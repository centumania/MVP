/**
 * GET /api/study/daily-test/questions
 *
 * Returns today's personalised daily test questions for the authenticated student.
 * Merges formal exam questions (from daily_test_assignments.question_ids) and
 * HTML trap questions (html_question_ids) into a single shuffled list.
 *
 * correct_answer / correct_option are NEVER returned to the client.
 *
 * Response:
 *   { testDate, alreadySubmitted, questions: DailyTestQuestion[] }
 *
 * If no assignment exists for today the response includes an empty questions
 * array and a `noAssignment: true` flag — the UI should prompt the student to
 * come back after the nightly generation runs (23:30 IST).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient }    from '@/src/lib/supabase/server'
import { getTodayInIST }             from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export interface DailyTestQuestion {
  id:          string
  type:        'formal' | 'html'
  topic:       string
  question:    string
  options:     [string, string, string, string]
  explanation: string | null
  marks:       number
}

export async function GET(request: NextRequest) {
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

  const todayIST = getTodayInIST(new Date())

  // ── 1. Get assignment for today ──────────────────────────────────────────

  const { data: assignment } = await supabase
    .from('daily_test_assignments')
    .select('question_ids, html_question_ids')
    .eq('user_id', user.id)
    .eq('test_date', todayIST)
    .maybeSingle()

  if (!assignment) {
    return NextResponse.json({
      testDate:      todayIST,
      noAssignment:  true,
      alreadySubmitted: false,
      questions:     [],
    })
  }

  // ── 2. Check if already submitted ─────────────────────────────────────────

  const { data: todayTest } = await supabase
    .from('daily_tests')
    .select('id')
    .eq('test_date', todayIST)
    .eq('is_published', true)
    .maybeSingle()

  let alreadySubmitted = false
  if (todayTest) {
    const { data: existingSub } = await supabase
      .from('test_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('test_id', todayTest.id)
      .maybeSingle()
    alreadySubmitted = !!existingSub
  }

  // ── 3. Fetch formal exam questions (strip correct_answer) ─────────────────

  const formalIds: string[] = assignment.question_ids ?? []
  const htmlIds:   string[] = assignment.html_question_ids ?? []

  const formalQuestions: DailyTestQuestion[] = []

  if (formalIds.length > 0) {
    const { data: rows } = await supabase
      .from('questions')
      .select('id, topic, question_text, option_a, option_b, option_c, option_d, explanation, marks')
      .in('id', formalIds)

    for (const row of rows ?? []) {
      formalQuestions.push({
        id:          row.id,
        type:        'formal',
        topic:       row.topic ?? 'General Studies',
        question:    row.question_text,
        options:     [row.option_a, row.option_b, row.option_c, row.option_d],
        explanation: row.explanation ?? null,
        marks:       row.marks ?? 1,
      })
    }
  }

  // ── 4. Fetch HTML bank questions (strip correct_option) ───────────────────

  const htmlQuestions: DailyTestQuestion[] = []

  if (htmlIds.length > 0) {
    const { data: rows } = await supabase
      .from('html_question_bank')
      .select('id, topic, question_text, option_a, option_b, option_c, option_d, explanation')
      .in('id', htmlIds)

    for (const row of rows ?? []) {
      htmlQuestions.push({
        id:          row.id,
        type:        'html',
        topic:       row.topic ?? 'General Studies',
        question:    row.question_text,
        options:     [row.option_a, row.option_b, row.option_c, row.option_d],
        explanation: row.explanation ?? null,
        marks:       1,
      })
    }
  }

  // ── 5. Shuffle and return ─────────────────────────────────────────────────

  const all = [...formalQuestions, ...htmlQuestions]
    .sort(() => Math.random() - 0.5)

  return NextResponse.json({
    testDate:         todayIST,
    noAssignment:     false,
    alreadySubmitted,
    dailyTestId:      todayTest?.id ?? null,
    questions:        all,
  })
}
