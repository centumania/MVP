/**
 * GET /api/dashboard
 *
 * Returns a single consolidated payload for the dashboard:
 *   - today's exam status
 *   - user's full submission history (for XP + streak calculation)
 *   - leaderboard position
 *
 * One call instead of three — reduces page load latency significantly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, payment_verified, tier, is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ paymentPending: true })
    }

    const now      = new Date()
    const todayIST = getTodayInIST(now)

    // Parallel queries — no joins (TypeScript Database type has no Relations defined)
    const [
      { data: batch },
      { data: myRank },
      { data: allSubmissions },
      { count: cohortSize },
    ] = await Promise.all([
      supabase.from('batches').select('id, total_days').eq('is_active', true).maybeSingle(),
      supabase.from('leaderboard').select('rank, total_score, days_attended, accuracy_percent').eq('user_id', user.id).maybeSingle(),
      supabase.from('submissions').select('id, score, total_marks, submitted_at, exam_id').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(30),
      supabase.from('leaderboard').select('*', { count: 'exact', head: true }),
    ])

    // Fetch exam dates for submissions to calculate streak + history
    const examIds = (allSubmissions ?? []).map(s => s.exam_id).filter(Boolean)
    const [
      { data: examDates },
      { data: allBatchExams },
    ] = await Promise.all([
      examIds.length > 0
        ? supabase.from('exams').select('id, day_number, exam_date').in('id', examIds)
        : Promise.resolve({ data: [] }),
      batch
        ? supabase.from('exams').select('exam_date').eq('batch_id', batch.id).eq('is_active', true).lte('exam_date', todayIST)
        : Promise.resolve({ data: [] }),
    ])

    const examDateMap: Record<string, { day_number: number; exam_date: string }> = {}
    for (const e of examDates ?? []) {
      examDateMap[e.id] = { day_number: e.day_number, exam_date: e.exam_date }
    }

    // All scheduled exam dates up to today (for gap-aware streak calculation)
    const scheduledExamDates = new Set<string>(
      (allBatchExams ?? []).map(e => e.exam_date).filter(Boolean)
    )

    // Today's exam
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
          dayNumber:       exam.day_number,
          examId:          exam.id,
          alreadySubmitted: !!todaySub,
          score:           todaySub?.score,
          totalMarks:      todaySub?.total_marks,
        }
      }
    }

    // XP: 10 pts per mark scored + 50 bonus for ≥80%
    const xp = (allSubmissions ?? []).reduce((acc, s) => {
      const bonus = s.total_marks > 0 && (s.score / s.total_marks) >= 0.8 ? 50 : 0
      return acc + (s.score * 10) + bonus
    }, 0)

    const xpLevel  = Math.floor(xp / 1000) + 1
    const xpInLevel = xp % 1000
    const xpToNext  = 1000

    // Streak: consecutive SCHEDULED exam days with submissions
    // Uses scheduled exam dates (not calendar days) so weekend/holiday gaps
    // don't break a student's streak.
    const submittedDates = new Set<string>()
    for (const s of allSubmissions ?? []) {
      const examInfo = examDateMap[s.exam_id]
      if (examInfo?.exam_date) submittedDates.add(examInfo.exam_date)
    }

    function calcStreak(): number {
      const scheduled = Array.from(scheduledExamDates).sort().reverse()
      if (scheduled.length === 0) return 0

      let streak = 0
      let started = false
      for (const date of scheduled) {
        const submitted = submittedDates.has(date)
        if (!started) {
          // Today's exam not yet submitted — streak is still alive, skip it
          if (date === todayIST && !submitted) continue
          if (!submitted) return 0
          started = true
        }
        if (!submitted) break
        streak++
      }
      return streak
    }

    // Last 7 submissions for performance trend
    const last7 = (allSubmissions ?? [])
      .slice(0, 7)
      .map(s => ({
        score:      s.score,
        totalMarks: s.total_marks,
        pct:        s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0,
      }))
      .reverse()

    // Full submission history with day numbers (for history card)
    const history = (allSubmissions ?? []).slice(0, 10).map(s => {
      const examInfo = examDateMap[s.exam_id]
      return {
        dayNumber:   examInfo?.day_number ?? null,
        score:       s.score,
        totalMarks:  s.total_marks,
        pct:         s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0,
        submittedAt: s.submitted_at,
      }
    })

    const percentile = myRank && cohortSize && cohortSize > 0
      ? Math.round((1 - (myRank.rank - 1) / cohortSize) * 100)
      : null

    return NextResponse.json({
      paymentPending: false,
      todayExam,
      batchTotalDays: batch?.total_days ?? 25,
      leaderboard: myRank
        ? {
            rank:      myRank.rank,
            score:     myRank.total_score,
            days:      myRank.days_attended,
            accuracy:  myRank.accuracy_percent,
            percentile,
          }
        : null,
      xp,
      xpLevel,
      xpInLevel,
      xpToNext,
      streak: calcStreak(),
      daysAttended: allSubmissions?.length ?? 0,
      last7,
      history,
    })

  } catch (err) {
    console.error('[dashboard] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
