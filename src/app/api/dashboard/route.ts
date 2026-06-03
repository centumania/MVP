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
      supabase.from('submissions').select('id, score, total_marks, submitted_at, exam_id').eq('user_id', user.id).order('submitted_at', { ascending: false }),
      supabase.from('leaderboard').select('*', { count: 'exact', head: true }),
    ])

    // Fetch exam dates for submissions to calculate streak
    const examIds = (allSubmissions ?? []).map(s => s.exam_id).filter(Boolean)
    const { data: examDates } = examIds.length > 0
      ? await supabase.from('exams').select('id, day_number, exam_date').in('id', examIds)
      : { data: [] }

    const examDateMap: Record<string, { day_number: number; exam_date: string }> = {}
    for (const e of examDates ?? []) {
      examDateMap[e.id] = { day_number: e.day_number, exam_date: e.exam_date }
    }

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

    // Streak: consecutive exam days with submissions
    const submittedDates = new Set<string>()
    for (const s of allSubmissions ?? []) {
      const examInfo = examDateMap[s.exam_id]
      if (examInfo?.exam_date) submittedDates.add(examInfo.exam_date)
    }

    function calcStreak(): number {
      let streak = 0
      const d = new Date(now.getTime() + 5.5 * 3600 * 1000)
      let dateStr = d.toISOString().slice(0, 10)

      // If today not submitted, check if yesterday was (streak still alive if not yet today)
      if (!submittedDates.has(dateStr)) {
        d.setDate(d.getDate() - 1)
        dateStr = d.toISOString().slice(0, 10)
        if (!submittedDates.has(dateStr)) return 0
      }

      while (submittedDates.has(dateStr)) {
        streak++
        d.setDate(d.getDate() - 1)
        dateStr = d.toISOString().slice(0, 10)
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
    })

  } catch (err) {
    console.error('[dashboard] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
