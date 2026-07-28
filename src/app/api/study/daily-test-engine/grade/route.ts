/**
 * POST /api/study/daily-test-engine/grade
 *
 * Server-side grading for the "Today's Test" exam engine — mirrors the
 * security model already used by /api/study/daily-test/grade (the "AI Daily
 * Test"): the client never holds correct answers, only the server compares
 * submitted choices against the DB and returns the graded breakdown.
 *
 * Body:
 *   {
 *     day: number,
 *     responses: { id: string, chosenOriginal: number | null }[]
 *   }
 *
 * `chosenOriginal` is the 0-3 index into the UNSHUFFLED option order
 * (option_a..d) that the question was fetched with — the client tracks the
 * shuffle→original mapping itself, so it can grade against the DB's fixed
 * column order without ever seeing correct_option before this call.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient }       from '@supabase/supabase-js'
import { getSupabaseAdminClient }    from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MARK_CORRECT = 1
const MARK_WRONG   = -0.25
const MARK_SKIP    = 0

interface SubmittedResponse {
  id: string
  chosenOriginal: number | null
}

interface EngineQuestionAnswer {
  id: string
  correct_option: number
  explanation: string
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { day, responses } = body as { day: number; responses: SubmittedResponse[] }

  if (!Number.isInteger(day) || day < 1 || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  // Re-check entitlement server-side — never trust that the earlier GET's
  // gate was actually respected by the caller.
  if (day > 1) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (profile?.payment_verified !== true) {
      return NextResponse.json({ error: 'Payment required', reason: 'not_entitled' }, { status: 403 })
    }
  }

  const ids = responses.map((r) => r.id)
  // daily_test_engine_questions is not in the generated Database types yet — untyped view.
  const { data: questions } = await (supabase as unknown as SupabaseClient)
    .from('daily_test_engine_questions')
    .select('id, correct_option, explanation')
    .eq('day', day) // scope to this day — an id from another day can't be graded here
    .in('id', ids) as { data: EngineQuestionAnswer[] | null }

  const byId = new Map((questions ?? []).map((q) => [q.id, q]))

  // The client already has question text/options/subject from the pre-submission
  // fetch (non-sensitive) — this response only proves correctness, so it stays lean.
  // IMPORTANT: never drop an item — the client zips this array against its own
  // state.items by INDEX, so the response must stay the same length/order as
  // the request even for an unrecognised id (treated as no-credit, not a crash).
  let correct = 0, wrong = 0, skipped = 0
  const detail = responses.map((r, i) => {
    const q = byId.get(r.id)
    if (!q) {
      skipped++
      return { seq: i + 1, id: r.id, outcome: 'skipped' as const, marks: 0, correctOriginal: 0, explanation: '' }
    }
    let outcome: 'correct' | 'wrong' | 'skipped'
    let marks: number
    if (r.chosenOriginal === null || r.chosenOriginal === undefined) {
      outcome = 'skipped'; marks = MARK_SKIP; skipped++
    } else if (r.chosenOriginal === q.correct_option) {
      outcome = 'correct'; marks = MARK_CORRECT; correct++
    } else {
      outcome = 'wrong'; marks = MARK_WRONG; wrong++
    }
    return {
      seq: i + 1,
      id: q.id,
      outcome,
      marks,
      correctOriginal: q.correct_option,
      explanation: q.explanation,
    }
  })

  const attempted = correct + wrong
  const net = +(correct * MARK_CORRECT + wrong * MARK_WRONG).toFixed(2)
  const accuracyPct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0

  return NextResponse.json({
    day,
    totals: { questions: detail.length, correct, wrong, skipped, attempted },
    scoring: { markCorrect: MARK_CORRECT, markWrong: MARK_WRONG, net, maxPossible: detail.length * MARK_CORRECT },
    accuracyPct,
    responses: detail,
  })
}
