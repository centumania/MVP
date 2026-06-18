/**
 * GET /api/study/leaderboard
 *
 * Returns the top 50 students from the study_leaderboard view and the
 * requesting user's own rank.
 *
 * Requires: valid JWT + payment_verified = true.
 *
 * Response shape:
 *   {
 *     entries: { rank, name, tier, total_score, days_attended, accuracy_percent }[]
 *     myRank:  { rank, name, tier, total_score, days_attended, accuracy_percent } | null
 *   }
 *
 * user_id is intentionally stripped from entries before responding — students
 * must not be able to enumerate other users' IDs via the public leaderboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { StudyLeaderboardEntry } from '@/src/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // Top 50 — all columns including user_id (used to find own entry below)
    const { data: rows, error: topErr } = await supabase
      .from('study_leaderboard')
      .select('user_id, name, tier, total_score, days_attended, accuracy_percent, rank')
      .order('rank', { ascending: true })
      .limit(50)

    if (topErr) {
      console.error('[study/leaderboard] Query failed:', topErr)
      return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
    }

    // Requesting user's own entry (may be outside top 50)
    const { data: myRow } = await supabase
      .from('study_leaderboard')
      .select('user_id, name, tier, total_score, days_attended, accuracy_percent, rank')
      .eq('user_id', user.id)
      .maybeSingle()

    const stripUserId = (
      r: { user_id: string; name: string; tier: string | null; total_score: number; days_attended: number; accuracy_percent: number; rank: number },
    ): StudyLeaderboardEntry => ({
      name:             r.name,
      tier:             r.tier as StudyLeaderboardEntry['tier'],
      total_score:      r.total_score,
      days_attended:    r.days_attended,
      accuracy_percent: r.accuracy_percent,
      rank:             r.rank,
    })

    return NextResponse.json({
      entries: (rows ?? []).map(stripUserId),
      myRank:  myRow ? stripUserId(myRow) : null,
    })

  } catch (err) {
    console.error('[study/leaderboard] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
