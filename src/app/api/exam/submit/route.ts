/**
 * POST /api/exam/submit
 *
 * Submits a student's exam answers. Calculates score server-side.
 * CRITICAL: Score is ALWAYS calculated here from DB data.
 *           The client only sends answers — never a score.
 *
 * Security gates (in order):
 *   1. Valid JWT
 *   2. payment_verified = true
 *   3. Exam window is currently open (server clock, not client)
 *   4. Student has not already submitted (DB UNIQUE constraint + app check)
 *   5. All submitted question IDs belong to the correct exam
 *
 * Request body:
 *   { examId: string, answers: { [questionId]: 'A' | 'B' | 'C' | 'D' } }
 *
 * Response:
 *   { score, totalMarks, percentage, answerKey: [...] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getExamWindowStatus } from '@/src/lib/exam-window'
import { rateLimit } from '@/src/lib/rate-limit'
import { triggerMentorReportAfterSubmit } from '@/src/lib/mentor/service'
import type { AnswerOption, ExamSubmitResult } from '@/src/types/database'

export const dynamic = 'force-dynamic'

// ── Request schema validation ──────────────────────────────────────

const VALID_OPTIONS = new Set<string>(['A', 'B', 'C', 'D'])

function isValidAnswers(
  val: unknown,
): val is Record<string, AnswerOption> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return false
  return Object.entries(val).every(
    ([k, v]) => typeof k === 'string' && typeof v === 'string' && VALID_OPTIONS.has(v),
  )
}

// ── Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ─────────────────────────────────────────────────────
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 1b. Rate limit ────────────────────────────────────────────────
    const limiter = await rateLimit(`exam-submit:${user.id}`, { limit: 3, window: '1 h' })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After':         String(Math.ceil((limiter.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit':   String(limiter.limit),
            'X-RateLimit-Remaining': String(limiter.remaining),
          },
        },
      )
    }

    // ── 2. Parse and validate request body ──────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { examId, answers } = body as Record<string, unknown>

    if (typeof examId !== 'string' || !examId) {
      return NextResponse.json({ error: 'examId is required' }, { status: 400 })
    }
    if (!isValidAnswers(answers)) {
      return NextResponse.json({ error: 'answers must be { [questionId]: A|B|C|D }' }, { status: 400 })
    }
    if (Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 })
    }

    // ── 3. Payment gate ──────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // ── 4. Fetch exam to validate window ─────────────────────────────
    const { data: exam } = await supabase
      .from('exams')
      .select('id, open_time, close_time, is_active, day_number, batch_id')
      .eq('id', examId)
      .single()

    if (!exam || !exam.is_active) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // ── 5. Enforce exam window — server clock only ───────────────────
    // Fetch batch to get total_days for isLastDay check
    const { data: batch } = await supabase
      .from('batches')
      .select('total_days')
      .eq('id', exam.batch_id)
      .single()

    const now       = new Date()
    const openTime  = new Date(exam.open_time)
    const closeTime = new Date(exam.close_time)
    const windowStatus = getExamWindowStatus(
      now, openTime, closeTime,
      exam.day_number === batch?.total_days,
    )

    if (!windowStatus.isOpen) {
      return NextResponse.json(
        { error: 'Exam window is not open', windowStatus },
        { status: 403 },
      )
    }

    // ── 6. Check for duplicate submission ────────────────────────────
    // Application-level check (DB UNIQUE constraint is the real guard).
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('exam_id', examId)
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this exam' },
        { status: 409 },
      )
    }

    // ── 7. Fetch questions WITH correct_answer (server-side only) ────
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, correct_answer, marks, explanation')
      .eq('exam_id', examId)

    if (qError || !questions || questions.length === 0) {
      console.error('[exam/submit] Failed to fetch questions:', qError)
      return NextResponse.json({ error: 'Failed to load exam questions' }, { status: 500 })
    }

    // ── 8. Validate submitted question IDs belong to this exam ───────
    const validQuestionIds = new Set(questions.map(q => q.id))
    const invalidIds = Object.keys(answers).filter(id => !validQuestionIds.has(id))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Invalid question IDs in submission' },
        { status: 400 },
      )
    }

    // ── 9. Calculate score (server-side, from DB data) ────────────────
    let score       = 0
    let totalMarks  = 0

    const answerKey: ExamSubmitResult['answerKey'] = []

    for (const question of questions) {
      totalMarks += question.marks
      const submitted = answers[question.id] ?? null
      const isCorrect = submitted === question.correct_answer

      if (isCorrect) {
        score += question.marks
      }

      answerKey.push({
        questionId:  question.id,
        yourAnswer:  submitted as AnswerOption,
        correct:     question.correct_answer,
        isCorrect,
        explanation: question.explanation,
      })
    }

    const percentage = totalMarks > 0
      ? Math.round((score / totalMarks) * 100)
      : 0

    // ── 10. Persist submission ────────────────────────────────────────
    const { data: newSubmission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        user_id:     user.id,
        exam_id:     examId,
        score,
        total_marks: totalMarks,
      })
      .select('id')
      .single()

    if (insertError || !newSubmission) {
      // Handle DB unique constraint violation (race condition — two tabs)
      if (insertError?.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted this exam' },
          { status: 409 },
        )
      }
      console.error('[exam/submit] Failed to insert submission:', insertError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    // ── 11. Persist per-question answers ─────────────────────────────
    const answerRows = Object.entries(answers).map(([questionId, selectedAnswer]) => {
      const question = questions.find(q => q.id === questionId)!
      return {
        submission_id:   newSubmission.id,
        question_id:     questionId,
        selected_answer: selectedAnswer,
        is_correct:      selectedAnswer === question.correct_answer,
      }
    })

    const { error: answerInsertError } = await supabase
      .from('submission_answers')
      .insert(answerRows)

    if (answerInsertError) {
      // Non-fatal: score is saved. Answer key detail is lost but submission stands.
      console.error('[exam/submit] Failed to insert answer rows:', answerInsertError)
    }

    // ── 12. Return result ─────────────────────────────────────────────
    const result: ExamSubmitResult = { score, total: totalMarks, percentage, answerKey }

    // ── 13. Fire-and-forget mentor report generation ──────────────────
    // Score returns immediately. Report is generated in the background
    // (~2-3 s) and ready by the time the student navigates to it.
    const correctCount   = answerKey.filter(a => a.isCorrect).length
    const answeredCount  = Object.keys(answers).length

    triggerMentorReportAfterSubmit({
      userId:         user.id,
      examId,
      submissionId:   newSubmission.id,
      overallScore:   percentage,
      answeredCount,
      totalQuestions: questions.length,
      correctCount,
    }).catch(err => console.error('[exam/submit] Mentor report generation failed:', err))

    return NextResponse.json(result, { status: 201 })

  } catch (err) {
    console.error('[exam/submit] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
