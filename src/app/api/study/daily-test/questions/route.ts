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
  type:        'formal' | 'html' | 'uploaded'
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

  // ── Priority: uploaded test for today takes precedence over AI assignment ─────
  {
    const { data: uploadedTest } = await supabase
      .from('uploaded_tests')
      .select('id, questions')
      .eq('test_date', todayIST)
      .eq('is_published', true)
      .maybeSingle()

    if (uploadedTest) {
      // Ensure a daily_tests row exists so submissions can be persisted + deduplicated
      const { data: batchRow } = await supabase
        .from('batches')
        .select('id')
        .eq('is_active', true)
        .order('starts_on', { ascending: false })
        .limit(1)
        .maybeSingle()

      let dailyTestId: string | null = null
      if (batchRow) {
        // upsert (ignoreDuplicates: false will touch the row on conflict and return it)
        const { data: upserted } = await supabase
          .from('daily_tests')
          .upsert(
            { batch_id: batchRow.id, test_date: todayIST, is_published: true, total_questions: null },
            { onConflict: 'batch_id,test_date', ignoreDuplicates: false },
          )
          .select('id')
          .maybeSingle()
        dailyTestId = upserted?.id ?? null

        // Fallback: ignoreDuplicates: false may still not return on some Supabase versions
        if (!dailyTestId) {
          const { data: existing } = await supabase
            .from('daily_tests')
            .select('id')
            .eq('test_date', todayIST)
            .eq('is_published', true)
            .maybeSingle()
          dailyTestId = existing?.id ?? null
        }
      }

      let alreadySubmitted = false
      if (dailyTestId) {
        const { data: sub } = await supabase
          .from('test_submissions')
          .select('id')
          .eq('user_id', user.id)
          .eq('test_id', dailyTestId)
          .maybeSingle()
        alreadySubmitted = !!sub
      }

      interface UploadedQ {
        question: string
        options:  [string, string, string, string]
        correct:  number
        explanation: string | null
        topic:    string
      }

      const uploadedQuestions: DailyTestQuestion[] = (uploadedTest.questions as UploadedQ[])
        .map((q, idx) => ({
          id:          `up:${uploadedTest.id}:${idx}`,
          type:        'uploaded' as const,
          topic:       q.topic?.trim() || 'General Studies',
          question:    q.question,
          options:     q.options,
          explanation: q.explanation ?? null,
          marks:       1,
        }))
        .sort(() => Math.random() - 0.5)

      return NextResponse.json({
        testDate:        todayIST,
        noAssignment:    false,
        alreadySubmitted,
        uploadedTestId:  uploadedTest.id,
        dailyTestId,
        questions:       uploadedQuestions,
      })
    }
  }

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

  // Treat a saved-but-empty assignment (from a previous broken run) as missing
  const assignmentIsEmpty =
    assignment &&
    (assignment.question_ids ?? []).length === 0 &&
    (assignment.html_question_ids ?? []).length === 0

  if ((!assignment || assignmentIsEmpty) && activeBatch) {
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
//
// Primary source: html_question_bank (MCQs, traps extracted from study HTML files).
// Selection strategy:
//   1. Weak questions — seen before with accuracy < 70% (needs more practice)
//   2. Unseen questions — never attempted (discovery)
//   3. Shuffle the combined set, cap at TARGET_HTML_COUNT
//
// Formal exam questions (questions table) are included only when real ones exist;
// placeholder/sample rows are skipped by checking question count against MIN_FORMAL.
// ---------------------------------------------------------------------------

const TARGET_HTML_COUNT  = 20
const MIN_FORMAL_TO_USE  = 5   // don't include formal questions if there are fewer than this

type SupabaseAdminClient = ReturnType<typeof import('@/src/lib/supabase/server').getSupabaseAdminClient>

async function generateOnDemandAssignment(
  supabase: SupabaseAdminClient,
  userId:   string,
  _batchId: string,
  testDate: string,
): Promise<{ question_ids: string[]; html_question_ids: string[] } | null> {

  // ── 1. Load per-question accuracy from html_question_accuracy ───────────────
  const { data: accuracyRows } = await supabase
    .from('html_question_accuracy')
    .select('html_question_id, total_attempted, total_correct')
    .eq('user_id', userId)

  const seenIds = (accuracyRows ?? []).map(r => r.html_question_id)

  // Weak = attempted at least twice AND accuracy below 70%
  const weakIds = (accuracyRows ?? [])
    .filter(r => r.total_attempted >= 2 && r.total_correct / r.total_attempted < 0.7)
    .sort((a, b) =>
      (a.total_correct / a.total_attempted) - (b.total_correct / b.total_attempted),
    )
    .map(r => r.html_question_id)

  // ── 2. Fill remaining slots with unseen HTML questions ─────────────────────
  let htmlIds: string[] = [...weakIds]

  if (htmlIds.length < TARGET_HTML_COUNT) {
    let unSeenQuery = supabase
      .from('html_question_bank')
      .select('id')
      .limit(60)

    // Only apply exclusion when there are seen IDs (avoids PostgREST quirk
    // where a dummy placeholder UUID can return 0 rows).
    if (seenIds.length > 0) {
      unSeenQuery = unSeenQuery.not('id', 'in', `(${seenIds.join(',')})`)
    }

    const { data: unseen, error: unSeenError } = await unSeenQuery
    if (unSeenError) console.error('[daily-test/questions] unseen fetch error:', unSeenError)

    const unSeenIds = (unseen ?? []).map(r => r.id).sort(() => Math.random() - 0.5)
    htmlIds = [...htmlIds, ...unSeenIds].slice(0, TARGET_HTML_COUNT)
  }

  // Final shuffle
  htmlIds = htmlIds.sort(() => Math.random() - 0.5)

  // ── 3. Optionally include formal exam questions (only if enough real ones exist)
  let formalIds: string[] = []
  const { count: formalCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })

  if ((formalCount ?? 0) >= MIN_FORMAL_TO_USE) {
    const { data: formalRows } = await supabase
      .from('questions')
      .select('id')
      .limit(15)
    formalIds = (formalRows ?? []).map(r => r.id).sort(() => Math.random() - 0.5).slice(0, 10)
  }

  // ── 4. Persist so re-fetches within the same day return the same set ────────
  const { error } = await supabase
    .from('daily_test_assignments')
    .upsert(
      {
        user_id:          userId,
        test_date:        testDate,
        question_ids:     formalIds,
        html_question_ids: htmlIds,
        generated_at:     new Date().toISOString(),
        topic_weights:    null,
      },
      { onConflict: 'user_id,test_date', ignoreDuplicates: false },
    )

  if (error) {
    console.error('[daily-test/questions] on-demand assignment upsert failed:', error)
    return null
  }

  return { question_ids: formalIds, html_question_ids: htmlIds }
}
