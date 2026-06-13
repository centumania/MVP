/**
 * GET /api/exam/[day]
 *
 * Returns exam questions for a given day number.
 * CRITICAL: correct_answer and explanation are NEVER returned here.
 *           They are only used server-side in /api/exam/submit.
 *
 * Security gates (in order):
 *   1. Valid JWT
 *   2. payment_verified = true
 *   3. Exam exists and is_active = true for the active batch
 *   4. Exam window is open OR student already submitted (to show answer key)
 *
 * Returns questions in sort_order. Client randomises display order to
 * reduce over-shoulder copying — server stores the canonical order.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getExamWindowStatus } from '@/src/lib/exam-window'
import type { QuestionForClient } from '@/src/types/database'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ day: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { day: dayParam } = await params
    const dayNumber = parseInt(dayParam, 10)

    if (isNaN(dayNumber) || dayNumber < 1) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
    }

    // ── 1. Auth ───────────────────────────────────────────────────
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Payment gate ───────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // ── 3. Find exam ──────────────────────────────────────────────
    const { data: batch } = await supabase
      .from('batches')
      .select('id, total_days')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!batch) {
      return NextResponse.json({ error: 'No active batch' }, { status: 404 })
    }

    const { data: exam } = await supabase
      .from('exams')
      .select('id, open_time, close_time, day_number, title, exam_date, link_url')
      .eq('batch_id', batch.id)
      .eq('day_number', dayNumber)
      .eq('is_active', true)
      .maybeSingle()

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // ── 4. Window + submission check ──────────────────────────────
    // Allow access if:
    //   (a) Window is currently open, OR
    //   (b) Student already submitted (they can view their answer key)
    const now       = new Date()
    const openTime  = new Date(exam.open_time)
    const closeTime = new Date(exam.close_time)
    const windowStatus = getExamWindowStatus(
      now, openTime, closeTime,
      exam.day_number === batch.total_days,
    )

    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id, score, total_marks')
      .eq('user_id', user.id)
      .eq('exam_id', exam.id)
      .maybeSingle()

    const windowOpen      = windowStatus.isOpen
    const alreadySubmitted = existingSubmission !== null

    // If window is not open and student hasn't submitted, deny access.
    // Still include linkUrl so the closed-window screen can show the external test button.
    if (!windowOpen && !alreadySubmitted) {
      return NextResponse.json(
        {
          error: 'Exam not accessible',
          windowStatus,
          linkUrl: exam.link_url,
        },
        { status: 403 },
      )
    }

    // ── 5. Fetch questions — WITHOUT correct_answer ───────────────
    // This is the most critical security boundary in the application.
    // We explicitly select only safe columns. correct_answer stays in DB.
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, marks, sort_order')
      .eq('exam_id', exam.id)
      .order('sort_order', { ascending: true })

    if (qError || !questions) {
      console.error('[exam/[day]] Questions query failed:', qError)
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    }

    const safeQuestions: QuestionForClient[] = questions.map(q => ({
      id:            q.id,
      exam_id:       exam.id,
      question_text: q.question_text,
      option_a:      q.option_a,
      option_b:      q.option_b,
      option_c:      q.option_c,
      option_d:      q.option_d,
      marks:         q.marks,
      sort_order:    q.sort_order,
    }))

    return NextResponse.json({
      exam: {
        id:        exam.id,
        dayNumber: exam.day_number,
        title:     exam.title,
        openTime:  exam.open_time,
        closeTime: exam.close_time,
        linkUrl:   exam.link_url,
      },
      questions:        safeQuestions,
      alreadySubmitted,
      submission:       alreadySubmitted ? existingSubmission : null,
      windowStatus,
    })

  } catch (err) {
    console.error('[exam/[day]] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
