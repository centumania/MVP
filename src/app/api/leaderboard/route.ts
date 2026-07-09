/**
 * GET /api/leaderboard
 *
 * Returns the top 50 students and the requesting user's own rank.
 * Uses the `leaderboard` view in Supabase.
 * Requires: valid JWT + payment_verified = true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('payment_verified').eq('id', user.id).single()
    if (!profile?.payment_verified) return NextResponse.json({ error: 'Payment required' }, { status: 402 })

    // Top 50 — global leaderboard (no per-user batch filtering)
    const topQuery = supabase
      .from('leaderboard')
      .select('user_id, name, tier, total_score, days_attended, accuracy_percent, rank')
      .order('rank', { ascending: true })
      .limit(50)

    const { data: top, error: topErr } = await topQuery

    if (topErr) {
      console.error('[leaderboard] Query failed:', topErr)
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
    }

    // Current user's own rank (may be outside top 50)
    const myRankQuery = supabase
      .from('leaderboard')
      .select('user_id, name, tier, total_score, days_attended, accuracy_percent, rank')
      .eq('user_id', user.id)
    const { data: myRank } = await myRankQuery.maybeSingle()

    return NextResponse.json({
      entries:   top ?? [],
      myRank:    myRank ?? null,
      userId:    user.id,
    })

  } catch (err) {
    console.error('[leaderboard] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
