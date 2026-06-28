/**
 * Supabase Edge Function: generate-daily-assignments (v2)
 *
 * Generates per-student personalized question assignments for tomorrow's daily test.
 * Called nightly at 23:30 IST (18:00 UTC) via Upstash QStash → /api/generate-assignments.
 *
 * Question pool composition per student:
 *   50% — previous day's formal exam questions (weighted by topic weakness)
 *   30% — HTML trap questions (weighted by question-level accuracy)
 *   20% — batch-wide weak questions from other days (topic-weighted fallback)
 *
 * Weakness signals:
 *   - Formal questions: student_topic_accuracy (per-topic running totals)
 *   - HTML questions:   html_question_accuracy (per-question running totals)
 *   - Incorrectly answered questions get HIGH inclusion probability (not excluded!)
 *   - Correctly answered questions excluded for 14 days
 *
 * Tier weights for topic-based selection:
 *   critical (<50%) → 40%, weak (<70%) → 30%, moderate (<85%) → 20%, strong (≥85%) → 10%
 *
 * Deno runtime — imports from esm.sh.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuestionRow {
  id:    string
  topic: string
  marks: number
}

interface HtmlQuestionRow {
  id:      string
  topic:   string
  is_trap: boolean
}

interface TopicAccuracyRow {
  topic:           string
  total_attempted: number
  total_correct:   number
}

interface HtmlQuestionAccuracyRow {
  html_question_id: string
  total_attempted:  number
  total_correct:    number
}

interface WrongAnswerRow {
  question_id: string
}

type Tier = 'critical' | 'weak' | 'moderate' | 'strong'

const TIER_WEIGHTS: Record<Tier, number> = {
  critical: 0.40,
  weak:     0.30,
  moderate: 0.20,
  strong:   0.10,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function classifyTopic(attempted: number, correct: number): Tier {
  if (attempted === 0) return 'strong'
  const pct = (correct / attempted) * 100
  if (pct < 50) return 'critical'
  if (pct < 70) return 'weak'
  if (pct < 85) return 'moderate'
  return 'strong'
}

/** Weighted random selection without replacement. */
function selectWeighted<T>(items: T[], weights: number[], count: number): T[] {
  const pool   = items.map((item, i) => ({ item, weight: Math.max(weights[i], 0.01) }))
  const result: T[] = []
  while (result.length < count && pool.length > 0) {
    const total = pool.reduce((s, p) => s + p.weight, 0)
    if (total === 0) break
    let rand = Math.random() * total
    const idx = pool.findIndex(p => { rand -= p.weight; return rand <= 0 })
    const chosen = idx >= 0 ? idx : 0
    result.push(pool[chosen].item)
    pool.splice(chosen, 1)
  }
  return result
}

/**
 * Weight for a question based on accuracy:
 * - Wrong answers → very high weight (3.0) — these are the weak MCQs to repeat
 * - Unknown (no data) → medium weight (1.0)
 * - Low accuracy → weight scales from 2.5 down
 * - High accuracy → low weight (0.2)
 */
function accuracyWeight(attempted: number, correct: number): number {
  if (attempted === 0) return 1.0
  const pct = (correct / attempted) * 100
  if (pct < 40)  return 3.0   // heavily re-test weak questions
  if (pct < 60)  return 2.0
  if (pct < 75)  return 1.5
  if (pct < 90)  return 0.8
  return 0.2                   // near-mastered: low probability
}

function difficultyBuckets(total: number): { easy: number; medium: number; hard: number } {
  const easy   = Math.round(total * 0.60)
  const medium = Math.round(total * 0.30)
  const hard   = total - easy - medium
  return { easy, medium, hard: Math.max(0, hard) }
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing env' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // ── 1. Get tomorrow's published daily_test ─────────────────────────────────

  const tomorrow     = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDate = tomorrow.toISOString().slice(0, 10)

  const { data: dailyTest, error: dtError } = await supabase
    .from('daily_tests')
    .select('id, batch_id, total_questions')
    .eq('test_date', tomorrowDate)
    .eq('is_published', true)
    .maybeSingle()

  if (dtError) {
    return new Response(JSON.stringify({ error: dtError.message }), { status: 500 })
  }
  if (!dailyTest) {
    return new Response(
      JSON.stringify({ ok: true, message: `No published daily_test for ${tomorrowDate} — skipping` }),
      { status: 200 },
    )
  }

  const totalQuestions  = dailyTest.total_questions || 50
  const formalCount     = Math.round(totalQuestions * 0.50)
  const htmlCount       = Math.round(totalQuestions * 0.30)
  const fallbackCount   = totalQuestions - formalCount - htmlCount

  // ── 2. Get previous day's exam questions (50% of pool) ────────────────────

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = yesterday.toISOString().slice(0, 10)

  const { data: prevExam } = await supabase
    .from('exams')
    .select('id, day_number')
    .eq('batch_id', dailyTest.batch_id)
    .eq('exam_date', yesterdayDate)
    .maybeSingle()

  const { data: prevDayQuestions } = prevExam
    ? await supabase
        .from('questions')
        .select('id, topic, marks')
        .eq('exam_id', prevExam.id)
    : { data: [] }

  // ── 3. Get all batch questions for fallback pool ───────────────────────────

  const { data: allExams } = await supabase
    .from('exams')
    .select('id')
    .eq('batch_id', dailyTest.batch_id)

  const batchExamIds = (allExams ?? []).map((e: { id: string }) => e.id)

  const { data: allBatchQuestions } = batchExamIds.length > 0
    ? await supabase.from('questions').select('id, topic, marks').in('exam_id', batchExamIds)
    : { data: [] }

  const prevDayIds   = new Set((prevDayQuestions ?? []).map((q: QuestionRow) => q.id))
  const fallbackPool = (allBatchQuestions ?? [] as QuestionRow[]).filter(
    (q: QuestionRow) => !prevDayIds.has(q.id)
  )

  // ── 4. Get HTML questions scoped to yesterday's materials ─────────────────
  // Extract filenames from materials.html_url for the previous day_number,
  // then filter html_question_bank to only those source files.
  // Falls back to the full bank if no materials are found (e.g. Day 1).

  let htmlSourceFiles: string[] = []
  if (prevExam?.day_number) {
    const { data: prevMaterials } = await supabase
      .from('materials')
      .select('html_url')
      .eq('batch_id', dailyTest.batch_id)
      .eq('day_number', prevExam.day_number)
      .not('html_url', 'is', null)

    htmlSourceFiles = (prevMaterials ?? [])
      .map((m: { html_url: string | null }) => m.html_url?.split('/').pop() ?? '')
      .filter((f: string) => f.endsWith('.html'))
  }

  const { data: htmlPool } = htmlSourceFiles.length > 0
    ? await supabase
        .from('html_question_bank')
        .select('id, topic, is_trap')
        .in('source_file', htmlSourceFiles)
    : await supabase
        .from('html_question_bank')
        .select('id, topic, is_trap')

  // ── 5. Get enrolled users ─────────────────────────────────────────────────

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id')
    .eq('payment_verified', true)
    .eq('is_admin', false)

  if (usersError || !users) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 })
  }

  // ── 6. Process each user ──────────────────────────────────────────────────

  const stats = { processed: 0, created: 0, skipped: 0, errors: [] as string[] }

  for (const user of users) {
    try {
      // 6a. Topic accuracy for formal question weighting
      const { data: topicAccRows } = await supabase
        .from('student_topic_accuracy')
        .select('topic, total_attempted, total_correct')
        .eq('user_id', user.id)

      const topicAcc: TopicAccuracyRow[] = topicAccRows ?? []

      const topicTierMap: Record<Tier, Set<string>> = {
        critical: new Set(), weak: new Set(), moderate: new Set(), strong: new Set(),
      }
      for (const row of topicAcc) {
        topicTierMap[classifyTopic(row.total_attempted, row.total_correct)].add(row.topic)
      }

      // 6b. HTML question accuracy for HTML weighting
      const { data: htmlAccRows } = await supabase
        .from('html_question_accuracy')
        .select('html_question_id, total_attempted, total_correct')
        .eq('user_id', user.id)

      const htmlAccMap = new Map<string, { attempted: number; correct: number }>()
      for (const row of (htmlAccRows ?? []) as HtmlQuestionAccuracyRow[]) {
        htmlAccMap.set(row.html_question_id, {
          attempted: row.total_attempted,
          correct:   row.total_correct,
        })
      }

      // 6c. Get correctly answered question IDs in last 14 days (exclude these from formal pool)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 14)
      const cutoffDate = cutoff.toISOString().slice(0, 10)

      const { data: recentCorrect } = await supabase
        .from('test_submission_answers')
        .select('question_id')
        .eq('is_correct', true)
        .in(
          'submission_id',
          (
            await supabase
              .from('test_submissions')
              .select('id')
              .eq('user_id', user.id)
              .in(
                'test_id',
                (
                  await supabase
                    .from('daily_tests')
                    .select('id')
                    .eq('batch_id', dailyTest.batch_id)
                    .gte('test_date', cutoffDate)
                ).data?.map((d: { id: string }) => d.id) ?? [],
              )
          ).data?.map((s: { id: string }) => s.id) ?? [],
        )

      const recentCorrectIds = new Set(
        (recentCorrect ?? []).map((r: WrongAnswerRow) => r.question_id)
      )

      // 6d. Select formal exam questions (previous day, topic-weighted)
      const prevAvailable = (prevDayQuestions ?? [] as QuestionRow[]).filter(
        (q: QuestionRow) => !recentCorrectIds.has(q.id)
      )

      let selectedFormal: string[]
      if (prevAvailable.length === 0) {
        // No prev-day questions available — use fallback pool
        const fallbackAvail = fallbackPool.filter((q: QuestionRow) => !recentCorrectIds.has(q.id))
        selectedFormal = pickRandom(fallbackAvail, formalCount).map(q => q.id)
      } else if (topicAcc.length === 0) {
        // New student: random from prev day
        selectedFormal = pickRandom(prevAvailable, Math.min(formalCount, prevAvailable.length))
          .map(q => q.id)
      } else {
        // Weighted by topic tier: critical topics get more questions
        const weights = (prevAvailable as QuestionRow[]).map(q => {
          const topicData = topicAcc.find(r => r.topic === q.topic)
          if (!topicData) return TIER_WEIGHTS.strong
          const tier = classifyTopic(topicData.total_attempted, topicData.total_correct)
          return TIER_WEIGHTS[tier]
        })
        const picked = selectWeighted(prevAvailable as QuestionRow[], weights, Math.min(formalCount, prevAvailable.length))

        // Pad with fallback if not enough prev-day questions
        const pickedIds = new Set(picked.map(q => q.id))
        if (picked.length < formalCount) {
          const fallbackAvail = fallbackPool.filter(
            (q: QuestionRow) => !recentCorrectIds.has(q.id) && !pickedIds.has(q.id)
          )
          const fallbackWeights = (fallbackAvail as QuestionRow[]).map(q => {
            const topicData = topicAcc.find(r => r.topic === q.topic)
            if (!topicData) return TIER_WEIGHTS.strong
            return TIER_WEIGHTS[classifyTopic(topicData.total_attempted, topicData.total_correct)]
          })
          const extra = selectWeighted(fallbackAvail as QuestionRow[], fallbackWeights, formalCount - picked.length)
          picked.push(...extra)
        }

        selectedFormal = picked.slice(0, formalCount).map(q => q.id)
      }

      // 6e. Select HTML questions (trap-weighted by per-question accuracy)
      const htmlAvailable = (htmlPool ?? []) as HtmlQuestionRow[]
      let selectedHtml: string[]

      if (htmlAvailable.length === 0) {
        selectedHtml = []
      } else if (topicAcc.length === 0 && htmlAccMap.size === 0) {
        // New student: prioritise trap questions, then random
        const traps    = htmlAvailable.filter(q => q.is_trap)
        const nonTraps = htmlAvailable.filter(q => !q.is_trap)
        const trapPick = pickRandom(traps, Math.min(Math.ceil(htmlCount * 0.6), traps.length))
        const rest     = pickRandom(nonTraps, htmlCount - trapPick.length)
        selectedHtml   = [...trapPick, ...rest].map(q => q.id)
      } else {
        // Weight by per-question accuracy (wrong answers get much higher weight)
        const weights = htmlAvailable.map(q => {
          const acc = htmlAccMap.get(q.id)
          const baseWeight = acc
            ? accuracyWeight(acc.attempted, acc.correct)
            : 1.0
          return q.is_trap ? baseWeight * 1.5 : baseWeight  // traps get bonus weight
        })
        selectedHtml = selectWeighted(htmlAvailable, weights, Math.min(htmlCount, htmlAvailable.length))
          .map(q => q.id)
      }

      // 6f. Build audit topic_weights
      const topicWeights: Record<Tier, string[]> = {
        critical: [...topicTierMap.critical],
        weak:     [...topicTierMap.weak],
        moderate: [...topicTierMap.moderate],
        strong:   [...topicTierMap.strong],
      }

      // 6g. Upsert into daily_test_assignments
      const { error: upsertError } = await supabase
        .from('daily_test_assignments')
        .upsert(
          {
            user_id:          user.id,
            test_date:        tomorrowDate,
            question_ids:     selectedFormal,
            html_question_ids: selectedHtml,
            generated_at:     new Date().toISOString(),
            topic_weights:    topicWeights,
          },
          { onConflict: 'user_id,test_date' },
        )

      if (upsertError) {
        stats.errors.push(`user ${user.id}: ${upsertError.message}`)
        stats.skipped++
      } else {
        stats.created++
      }
      stats.processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      stats.errors.push(`user ${user.id}: ${msg}`)
      stats.skipped++
      stats.processed++
    }
  }

  return new Response(
    JSON.stringify({
      ok:            true,
      test_date:     tomorrowDate,
      daily_test:    dailyTest.id,
      formalCount,
      htmlCount,
      fallbackCount,
      ...stats,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
