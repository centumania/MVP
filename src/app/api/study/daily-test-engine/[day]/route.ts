/**
 * GET /api/study/daily-test-engine/[day]
 *
 * Returns that day's question set for the "Today's Test" exam engine.
 * Day 1 is free; Day 2+ requires payment_verified — checked here, server-side,
 * not trusted from the client. NEVER includes correct_option or explanation:
 * this is the one response the client sees before submitting, so it must be
 * answer-blind. Grading happens separately via POST .../grade, after submit.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient }       from '@supabase/supabase-js'
import { getSupabaseAdminClient }    from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const QUESTIONS_PER_TEST = 25

interface EngineQuestion {
  id: string
  subject: string
  star: boolean
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ day: string }> }) {
  const { day: dayParam } = await params
  const day = parseInt(dayParam, 10)
  if (!Number.isInteger(day) || day < 1) {
    return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // daily_test_engine_questions is not in the generated Database types yet — untyped view.
  const { data: questions } = await (supabase as unknown as SupabaseClient)
    .from('daily_test_engine_questions')
    .select('id, subject, star, question_text, option_a, option_b, option_c, option_d')
    .eq('day', day) as { data: EngineQuestion[] | null }

  if (!questions || questions.length < QUESTIONS_PER_TEST) {
    return NextResponse.json({ error: 'Not available yet' }, { status: 404 })
  }

  // Random 25-question subset when the bank has extras for this day — mirrors
  // the original shuffle().slice(0, questionsPerTest) selection.
  const pool = [...questions]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const picked = pool.slice(0, QUESTIONS_PER_TEST)

  const items = picked.map((q) => ({
    id: q.id,
    subject: q.subject,
    star: q.star,
    q: q.question_text,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
  }))

  return NextResponse.json({ day, items })
}
