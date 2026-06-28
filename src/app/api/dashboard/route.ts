/**
 * GET /api/dashboard
 *
 * Returns a consolidated payload for the student dashboard.
 * Centum Index is calculated live from real engagement data:
 *   - student_metrics  (nodes opened/completed, MCQ accuracy, sessions)
 *   - analytics_events (distinct active days since batch start)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST, IST_OFFSET_MS } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

// Daily node target: how many nodes a student should ideally open per day.
// Drives Node Exploration score — reaching this = 100%.
const DAILY_NODE_TARGET = 15

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, payment_verified, tier, is_admin, batch_id')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ paymentPending: true })
    }

    const now      = new Date()
    const todayIST = getTodayInIST(now)

    // ── Round 1: parallel queries ────────────────────────────────
    const [
      { data: batch },
      { data: myRank },
      { data: allSubmissions },
      { count: cohortSize },
      { data: metrics },
    ] = await Promise.all([
      profile.batch_id
        ? supabase.from('batches').select('id, total_days, starts_on').eq('id', profile.batch_id).maybeSingle()
        : supabase.from('batches').select('id, total_days, starts_on').eq('is_active', true).maybeSingle(),
      supabase.from('study_leaderboard').select('rank, total_score, days_attended, accuracy_percent').eq('user_id', user.id).maybeSingle(),
      supabase.from('submissions').select('id, score, total_marks, submitted_at, exam_id').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(30),
      supabase.from('study_leaderboard').select('*', { count: 'exact', head: true }),
      supabase.from('student_metrics').select('nodes_opened, nodes_completed, mcqs_completed, mcqs_correct, study_sessions').eq('user_id', user.id).maybeSingle(),
    ])

    // ── Days elapsed since batch start ───────────────────────────
    const totalDays    = batch?.total_days ?? 30
    const batchStartOn = batch?.starts_on as string | null ?? null

    let daysElapsed = totalDays
    if (batchStartOn) {
      const startMs    = new Date(batchStartOn + 'T00:00:00+05:30').getTime()
      const nowISTMs   = now.getTime() + IST_OFFSET_MS
      daysElapsed = Math.max(1, Math.min(totalDays, Math.floor((nowISTMs - startMs) / (24 * 60 * 60 * 1000)) + 1))
    }

    // ── Round 2: exam dates + analytics active days ──────────────
    const examIds = (allSubmissions ?? []).map(s => s.exam_id).filter(Boolean)
    const [
      { data: examDates },
      { data: allBatchExams },
      { data: analyticsRows },
    ] = await Promise.all([
      examIds.length > 0
        ? supabase.from('exams').select('id, day_number, exam_date').in('id', examIds)
        : Promise.resolve({ data: [] as { id: string; day_number: number; exam_date: string }[] }),
      batch
        ? supabase.from('exams').select('exam_date').eq('batch_id', batch.id).eq('is_active', true).lte('exam_date', todayIST)
        : Promise.resolve({ data: [] as { exam_date: string }[] }),
      batchStartOn
        ? supabase.from('analytics_events').select('event_timestamp').eq('user_id', user.id).gte('event_timestamp', batchStartOn + 'T00:00:00+05:30')
        : Promise.resolve({ data: [] as { event_timestamp: string }[] }),
    ])

    // Count distinct IST days with any analytics event since batch start
    const activeDaysSet = new Set<string>()
    for (const e of analyticsRows ?? []) {
      const istMs = new Date(e.event_timestamp).getTime() + IST_OFFSET_MS
      activeDaysSet.add(new Date(istMs).toISOString().slice(0, 10))
    }
    const activeDaysInBatch = activeDaysSet.size

    // ── Today's exam ─────────────────────────────────────────────
    const examDateMap: Record<string, { day_number: number; exam_date: string }> = {}
    for (const e of examDates ?? []) {
      examDateMap[e.id] = { day_number: e.day_number, exam_date: e.exam_date }
    }

    const scheduledExamDates = new Set<string>(
      (allBatchExams ?? []).map(e => e.exam_date).filter(Boolean)
    )

    let todayExam: { dayNumber: number; examId: string; alreadySubmitted: boolean; score?: number; totalMarks?: number } | null = null

    if (batch) {
      const { data: exam } = await supabase
        .from('exams')
        .select('id, day_number')
        .eq('batch_id', batch.id)
        .eq('exam_date', todayIST)
        .eq('is_active', true)
        .maybeSingle()

      if (exam) {
        const todaySub = (allSubmissions ?? []).find(s => s.exam_id === exam.id)
        todayExam = {
          dayNumber:        exam.day_number,
          examId:           exam.id,
          alreadySubmitted: !!todaySub,
          score:            todaySub?.score,
          totalMarks:       todaySub?.total_marks,
        }
      }
    }

    // ── XP & streak (exam-based, will fill in when tests go live) ──
    const xp = (allSubmissions ?? []).reduce((acc, s) => {
      const bonus = s.total_marks > 0 && (s.score / s.total_marks) >= 0.8 ? 50 : 0
      return acc + (s.score * 10) + bonus
    }, 0)
    const xpLevel   = Math.floor(xp / 1000) + 1
    const xpInLevel = xp % 1000
    const xpToNext  = 1000

    const submittedDates = new Set<string>()
    for (const s of allSubmissions ?? []) {
      const info = examDateMap[s.exam_id]
      if (info?.exam_date) submittedDates.add(info.exam_date)
    }

    function calcStreak(): number {
      const scheduled = Array.from(scheduledExamDates).sort().reverse()
      if (scheduled.length === 0) return 0
      let streak = 0, started = false
      for (const date of scheduled) {
        const submitted = submittedDates.has(date)
        if (!started) {
          if (date === todayIST && !submitted) continue
          if (!submitted) return 0
          started = true
        }
        if (!submitted) break
        streak++
      }
      return streak
    }

    const last7 = (allSubmissions ?? []).slice(0, 7).map(s => ({
      score: s.score, totalMarks: s.total_marks,
      pct: s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0,
    })).reverse()

    const history = (allSubmissions ?? []).slice(0, 10).map(s => {
      const info = examDateMap[s.exam_id]
      return {
        dayNumber:   info?.day_number ?? null,
        score:       s.score,
        totalMarks:  s.total_marks,
        pct:         s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0,
        submittedAt: s.submitted_at,
      }
    })

    const percentile = myRank && cohortSize && cohortSize > 0
      ? Math.round((1 - (myRank.rank - 1) / cohortSize) * 100)
      : null

    // ── Centum Index — 4-factor live calculation ─────────────────
    // Node Exploration (35%): nodes opened vs daily target
    // Attendance        (35%): active days in batch vs days elapsed
    // Accuracy          (20%): MCQ correct ratio from student_metrics
    // Depth             (10%): nodes completed vs nodes opened
    const nodesOpened    = metrics?.nodes_opened    ?? 0
    const nodesCompleted = metrics?.nodes_completed ?? 0
    const mcqsDone       = metrics?.mcqs_completed  ?? 0
    const mcqsCorrect    = metrics?.mcqs_correct    ?? 0

    const nodeScore       = Math.min(100, daysElapsed > 0 ? (nodesOpened / (daysElapsed * DAILY_NODE_TARGET)) * 100 : 0)
    const attendanceScore = Math.min(100, daysElapsed > 0 ? (activeDaysInBatch / daysElapsed) * 100 : 0)
    const accuracyScore   = mcqsDone > 0 ? (mcqsCorrect / mcqsDone) * 100 : 0
    const depthScore      = nodesOpened > 0 ? (nodesCompleted / nodesOpened) * 100 : 0

    const centumIndex = parseFloat(
      ((nodeScore * 0.35) + (attendanceScore * 0.35) + (accuracyScore * 0.20) + (depthScore * 0.10)).toFixed(1)
    )

    return NextResponse.json({
      paymentPending:   false,
      todayExam,
      batchTotalDays:   totalDays,
      daysElapsed,
      // Centum Index breakdown
      centumIndex,
      nodeScore:        parseFloat(nodeScore.toFixed(1)),
      attendanceScore:  parseFloat(attendanceScore.toFixed(1)),
      accuracyScore:    parseFloat(accuracyScore.toFixed(1)),
      depthScore:       parseFloat(depthScore.toFixed(1)),
      nodesOpened,
      nodesCompleted,
      mcqsDone,
      mcqsCorrect,
      // Real activity stats
      activeDaysInBatch,
      mcqAccuracy: parseFloat(accuracyScore.toFixed(1)),
      leaderboard: myRank ? {
        rank:       myRank.rank,
        score:      myRank.total_score,
        days:       activeDaysInBatch,       // real active days, not exam days
        accuracy:   parseFloat(accuracyScore.toFixed(1)), // real MCQ accuracy
        percentile,
      } : null,
      xp, xpLevel, xpInLevel, xpToNext,
      streak:       calcStreak(),
      daysAttended: activeDaysInBatch,        // drives stats strip
      last7,
      history,
    })

  } catch (err) {
    console.error('[dashboard] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
