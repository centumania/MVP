/**
 * POST /api/study/daily-test/grade
 *
 * Server-side grading for the AI daily test.
 * Receives the student's answers, grades them against the DB, persists results,
 * and triggers downstream accuracy updates.
 *
 * Body:
 *   {
 *     dailyTestId: string,          // daily_tests.id (null → auto-resolve from date)
 *     answers: {
 *       [questionId: string]: 'A'|'B'|'C'|'D'   // formal exam questions
 *     },
 *     htmlAnswers: {
 *       [htmlQuestionId: string]: 0|1|2|3         // 0-based index for HTML questions
 *     }
 *   }
 *
 * Response:
 *   {
 *     score, totalMarks, percentage,
 *     breakdown: { questionId, type, selected, correct, isCorrect, explanation }[]
 *   }
 *
 * Security:
 *   - correct_answer fetched server-side only
 *   - UNIQUE(user_id, test_id) prevents double-grading
 *   - Formal score: 1 mark per question (or question.marks)
 *   - HTML score: 1 mark per question
 */

import { NextRequest, NextResponse }   from 'next/server'
import { getSupabaseAdminClient }      from '@/src/lib/supabase/server'
import { getTodayInIST }               from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

const OPTION_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 }
const IDX_MAP:    Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_verified')
    .eq('id', user.id)
    .single()

  if (!profile?.payment_verified) {
    return NextResponse.json({ error: 'Payment required' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { dailyTestId, answers, htmlAnswers } = body as {
    dailyTestId:  string | null
    answers:      Record<string, string>
    htmlAnswers:  Record<string, number>
  }

  if (typeof answers !== 'object' || answers === null) {
    return NextResponse.json({ error: 'answers is required' }, { status: 400 })
  }

  const todayIST = getTodayInIST(new Date())

  // ── 1. Resolve daily_test row ──────────────────────────────────────────────

  let testId = dailyTestId
  if (!testId) {
    const { data: todayTest } = await supabase
      .from('daily_tests')
      .select('id')
      .eq('test_date', todayIST)
      .eq('is_published', true)
      .maybeSingle()
    // If no daily_test row exists, grade-only mode: results returned but not persisted
    testId = todayTest?.id ?? null
  }

  // ── 2. Prevent double submission (only when testId exists) ──────────────────

  if (testId) {
    const { data: existing } = await supabase
      .from('test_submissions')
      .select('id, score')
      .eq('user_id', user.id)
      .eq('test_id', testId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already submitted', score: existing.score }, { status: 409 })
    }
  }

  // ── 3. Grade formal exam questions ─────────────────────────────────────────

  const formalIds = Object.keys(answers)
  let formalScore = 0
  let formalTotal = 0

  interface QuestionGrade {
    id:          string
    correct_answer: string
    explanation: string | null
    marks:       number
    topic:       string
  }

  const formalGrades: Array<{
    questionId:  string
    type:        'formal'
    selected:    string
    correct:     string
    isCorrect:   boolean
    explanation: string | null
    marks:       number
    topic:       string
  }> = []

  if (formalIds.length > 0) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_answer, explanation, marks, topic')
      .in('id', formalIds)

    for (const q of (questions ?? []) as QuestionGrade[]) {
      const selected   = (answers[q.id] ?? '').toUpperCase()
      const isCorrect  = selected === q.correct_answer
      const marksEarned = isCorrect ? q.marks : 0
      formalScore += marksEarned
      formalTotal += q.marks
      formalGrades.push({
        questionId:  q.id,
        type:        'formal',
        selected,
        correct:     q.correct_answer,
        isCorrect,
        explanation: q.explanation ?? null,
        marks:       q.marks,
        topic:       q.topic,
      })
    }
  }

  // ── 4. Grade HTML questions ────────────────────────────────────────────────

  const htmlIds = Object.keys(htmlAnswers ?? {})
  let htmlScore = 0
  const htmlGrades: Array<{
    questionId:  string
    type:        'html'
    selected:    string
    correct:     string
    isCorrect:   boolean
    explanation: string | null
    marks:       number
    topic:       string
  }> = []

  if (htmlIds.length > 0) {
    const { data: htmlQuestions } = await supabase
      .from('html_question_bank')
      .select('id, correct_option, explanation, topic')
      .in('id', htmlIds)

    for (const q of (htmlQuestions ?? []) as { id: string; correct_option: number; explanation: string | null; topic: string }[]) {
      const selectedIdx = htmlAnswers[q.id]
      const isCorrect   = selectedIdx === q.correct_option
      if (isCorrect) htmlScore++
      htmlGrades.push({
        questionId:  q.id,
        type:        'html',
        selected:    IDX_MAP[selectedIdx] ?? '?',
        correct:     IDX_MAP[q.correct_option],
        isCorrect,
        explanation: q.explanation ?? null,
        marks:       1,
        topic:       q.topic,
      })
    }
  }

  const totalScore = formalScore + htmlScore
  const totalMarks = formalTotal + htmlIds.length
  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0

  // ── 5. Persist submission (skipped in grade-only mode when no daily_test) ───

  let submissionId: string | null = null

  if (testId) {
    const { data: submission, error: subError } = await supabase
      .from('test_submissions')
      .insert({ user_id: user.id, test_id: testId, score: totalScore })
      .select('id')
      .single()

    if (subError || !submission) {
      console.error('[daily-test/grade] submission insert failed:', subError)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }
    submissionId = submission.id

    if (formalGrades.length > 0) {
      const answerRows = formalGrades.map(g => ({
        submission_id:   submissionId!,
        question_id:     g.questionId,
        selected_answer: g.selected as 'A' | 'B' | 'C' | 'D',
        is_correct:      g.isCorrect,
      }))
      await supabase.from('test_submission_answers').insert(answerRows)
    }

    try {
      await supabase.rpc('update_topic_accuracy_after_submission', { p_submission_id: submissionId })
    } catch (e) {
      console.error('[daily-test/grade] update_topic_accuracy failed:', e)
    }

    const { data: testRow } = await supabase.from('daily_tests').select('batch_id').eq('id', testId).single()
    if (testRow?.batch_id) {
      try {
        await supabase.rpc('update_realtime_attendance', { p_user_id: user.id, p_batch_id: testRow.batch_id })
      } catch (e) {
        console.error('[daily-test/grade] update_realtime_attendance failed:', e)
      }
    }
  }

  // ── 6. Always update html_question_accuracy ───────────────────────────────

  if (htmlGrades.length > 0) {
    for (const g of htmlGrades) {
      await supabase.rpc('upsert_html_question_accuracy', {
        p_user_id:          user.id,
        p_html_question_id: g.questionId,
        p_correct:          g.isCorrect,
      })
    }
  }

  // ── 9. Return graded results ───────────────────────────────────────────────

  return NextResponse.json({
    score:      totalScore,
    totalMarks,
    percentage,
    breakdown:  [...formalGrades, ...htmlGrades].map(g => ({
      questionId:  g.questionId,
      type:        g.type,
      selected:    g.selected,
      correct:     g.correct,
      isCorrect:   g.isCorrect,
      explanation: g.explanation,
      marks:       g.marks,
      topic:       g.topic,
    })),
  })
}
