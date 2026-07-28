/**
 * GET /api/study/daily-test-engine/status
 *
 * "Today's Test" home screen data — which days have content and which of
 * those the caller may open. Day 1 is free for everyone; Day 2+ requires
 * payment_verified. Never returns question text or answers — just counts
 * and a locked/unlocked flag, so the day-select grid can render without
 * shipping any content the caller isn't entitled to.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient }       from '@supabase/supabase-js'
import { getSupabaseAdminClient }    from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const QUESTIONS_PER_TEST = 25
const TOTAL_DAYS = 30

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

  const paymentVerified = profile?.payment_verified === true

  // daily_test_engine_questions is not in the generated Database types yet — untyped view.
  const { data: rows } = await (supabase as unknown as SupabaseClient)
    .from('daily_test_engine_questions')
    .select('day')

  const countByDay = new Map<number, number>()
  for (const row of (rows ?? []) as { day: number }[]) {
    countByDay.set(row.day, (countByDay.get(row.day) ?? 0) + 1)
  }

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
    const questionCount = countByDay.get(day) ?? 0
    const available = questionCount >= QUESTIONS_PER_TEST
    const entitled = day === 1 || paymentVerified
    return { day, available, questionCount, locked: available && !entitled }
  })

  return NextResponse.json({ paymentVerified, days })
}
