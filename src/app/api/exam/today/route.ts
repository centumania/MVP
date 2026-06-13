/**
 * GET /api/exam/today
 *
 * Returns today's exam metadata for the authenticated student:
 *   - dayNumber   — which day of the cohort this is
 *   - examId      — UUID of today's exam
 *   - alreadySubmitted — whether this student already submitted
 *   - score / totalMarks — if submitted
 *
 * Used by the dashboard to:
 *   1. Show the correct "Day X of 25" counter
 *   2. Build the link to /exam/[day]
 *   3. Show score if already submitted
 *
 * Returns 402 if student is not payment-verified.
 * Returns 404 if no exam is scheduled today.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Payment gate ───────────────────────────────────────────
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // ── 3. Find today's exam ──────────────────────────────────────
    const now      = new Date()
    const todayIST = getTodayInIST(now)

    const { data: batch } = await adminSupabase
      .from('batches')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!batch) {
      return NextResponse.json({ error: 'No active batch' }, { status: 404 })
    }

    const { data: todayExams } = await adminSupabase
      .from('exams')
      .select('id, day_number')
      .eq('batch_id', batch.id)
      .eq('exam_date', todayIST)
      .eq('is_active', true)
      .order('day_number', { ascending: true })
      .limit(1)

    const exam = todayExams?.[0] ?? null

    if (!exam) {
      return NextResponse.json({ error: 'No exam today' }, { status: 404 })
    }

    // ── 4. Check for existing submission ─────────────────────────
    const { data: submission } = await adminSupabase
      .from('submissions')
      .select('id, score, total_marks')
      .eq('user_id', user.id)
      .eq('exam_id', exam.id)
      .maybeSingle()

    return NextResponse.json({
      dayNumber:        exam.day_number,
      examId:           exam.id,
      alreadySubmitted: submission !== null,
      score:            submission?.score      ?? null,
      totalMarks:       submission?.total_marks ?? null,
    })

  } catch (err) {
    console.error('[exam/today] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
