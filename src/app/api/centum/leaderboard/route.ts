/**
 * GET /api/centum/leaderboard
 *
 * Returns today's Centum Index leaderboard for all students.
 * Admin-only.
 *
 * Query params:
 *   batch_id (optional) — filter by batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { searchParams } = new URL(request.url)
  const batchId = searchParams.get('batch_id')

  const supabase = getSupabaseAdminClient()
  const today = getTodayInIST()

  let query = supabase
    .from('centum_index_log')
    .select('*')
    .eq('calculated_date', today)
    .order('centum_index', { ascending: false })
    .limit(200)

  if (batchId) {
    query = query.eq('batch_id', batchId)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error('[centum/leaderboard] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ leaderboard: [] })
  }

  // Batch-fetch profile names (no direct FK from centum_index_log to profiles)
  const userIds = logs.map(l => l.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds)

  const nameMap: Record<string, string> = {}
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.name
  }

  const leaderboard = logs.map((l, i) => ({
    ...l,
    rank: i + 1,
    name: nameMap[l.user_id] ?? 'Unknown',
  }))

  return NextResponse.json({ leaderboard })
}
