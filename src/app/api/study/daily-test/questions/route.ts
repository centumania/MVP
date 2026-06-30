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
 * If no nightly assignment exists, an on-demand fallback is generated using
 * the student's weakest topics. The test is available any time of day.
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

  // ── 1. Get active batch (needed for daily_tests + on-demand assignment) ─────

  const { data: activeBatch } = await supabase
    .from('batches')
    .select('id')
    .eq('is_active', true)
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── 2. Get assignment for today (generate on-demand if missing) ───────────

  let { data: assignment } = await supabase
    .from('daily_test_assignments')
    .select('question_ids, html_question_ids')
    .eq('user_id', user.id)
    .eq('test_date', todayIST)
    .maybeSingle()

  if (!assignment && activeBatch) {
    assignment = await generateOnDemandAssignment(supabase, user.id, activeBatch.id, todayIST)
  }

  // ── 3. Ensure daily_tests row exists for today so grades are persisted ────

  if (activeBatch) {
    await supabase
      .from('daily_tests')
      .upsert(
        { batch_id: activeBatch.id, test_date: todayIST, is_published: true, total_questions: null },
        { onConflict: 'batch_id,test_date', ignoreDuplicates: true },
      )
  }

  // ── 4. Check if already submitted ─────────────────────────────────────────

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

  if (!assignment) {
    // No active batch — nothing to serve
    return NextResponse.json({
      testDate:         todayIST,
      noAssignment:     true,
      alreadySubmitted: false,
      questions:        [],
    })
  }

  // ── 5. Fetch formal exam questions (strip correct_answer) ─────────────────

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

  // ── 6. Fetch HTML bank questions (strip correct_option) ───────────────────

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

  // ── 7. Shuffle and return ─────────────────────────────────────────────────

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

// ---------------------------------------------------------------------------
// On-demand assignment generator
// Used when the nightly cron hasn't run yet (student takes test earlier in day).
// Picks questions prioritising the student's weakest topics; falls back to random.
// ---------------------------------------------------------------------------

type SupabaseAdminClient = ReturnType<typeof import('@/src/lib/supabase/server').getSupabaseAdminClient>

async function generateOnDemandAssignment(
  supabase: SupabaseAdminClient,
  userId:   string,
  _batchId: string,
  testDate: string,
): Promise<{ question_ids: string[]; html_question_ids: string[] } | null> {
  // 1. Find weak topics (accuracy < 70%, min 3 attempts)
  const { data: topicRows } = await supabase
    .from('student_topic_accuracy')
    .select('topic, total_attempted, total_correct')
    .eq('user_id', userId)

  const weakTopics = (topicRows ?? [])
    .filter(t => t.total_attempted >= 3 && t.total_correct / t.total_attempted < 0.7)
    .map(t => t.topic)

  // 2. Fetch formal questions WITH topic — prefer weak topics, fall back to any
  let formalRows: { id: string; topic: string }[] = []

  if (weakTopics.length > 0) {
    const { data: weak } = await supabase
      .from('questions')
      .select('id, topic')
      .in('topic', weakTopics)
      .limit(40)
    formalRows = (weak ?? []) as { id: string; topic: string }[]
  }

  if (formalRows.length < 15) {
    const excludeIds = formalRows.length > 0
      ? formalRows.map(r => r.id)
      : ['00000000-0000-0000-0000-000000000000']
    const { data: extra } = await supabase
      .from('questions')
      .select('id, topic')
      .not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`)
      .limit(40)
    formalRows = [...formalRows, ...((extra ?? []) as { id: string; topic: string }[])]
  }

  formalRows = formalRows.sort(() => Math.random() - 0.5).slice(0, 15)
  const formalIds = formalRows.map(r => r.id)

  // Topics actually covered by the selected formal questions
  const coveredTopics = [...new Set(formalRows.map(r => r.topic))]

  // 3. Fetch HTML trap questions — only from topics already covered in formal questions
  //    This prevents testing students on subjects not yet taught.
  let htmlIds: string[] = []
  if (coveredTopics.length > 0) {
    const { data: htmlRows } = await supabase
      .from('html_question_bank')
      .select('id')
      .in('topic', coveredTopics)
      .limit(30)
    htmlIds = (htmlRows ?? []).map(r => r.id).sort(() => Math.random() - 0.5).slice(0, 10)
  }

  // 4. Persist so re-fetches within the same day return the same set
  const { error } = await supabase
    .from('daily_test_assignments')
    .upsert(
      { user_id: userId, test_date: testDate, question_ids: formalIds, html_question_ids: htmlIds, generated_at: new Date().toISOString(), topic_weights: null },
      { onConflict: 'user_id,test_date', ignoreDuplicates: true },
    )

  if (error) {
    console.error('[daily-test/questions] on-demand assignment upsert failed:', error)
    return null
  }

  return { question_ids: formalIds, html_question_ids: htmlIds }
}
