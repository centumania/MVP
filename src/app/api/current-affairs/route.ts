/**
 * GET /api/current-affairs
 *
 * Returns today's active current affairs items.
 * Falls back to yesterday's items if today has none yet (before 07:00 IST cron).
 *
 * Auth: requires valid JWT + payment_verified.
 *
 * Response:
 *   { items: CurrentAffairsItem[], generatedToday: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient }    from '@/src/lib/supabase/server'
import { getTodayInIST }             from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export interface CurrentAffairsItem {
  id:             string
  title:          string
  summary:        string
  category:       string
  exam_relevance: string
  tags:           string[]
  source_date:    string
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

  // Fetch today's items; if empty, fall back to most recent day with items
  const { data: todayItems } = await supabase
    .from('current_affairs')
    .select('id, title, summary, category, exam_relevance, tags, source_date')
    .eq('is_active', true)
    .eq('source_date', todayIST)
    .order('exam_relevance', { ascending: true })  // High first (H < L alphabetically reversed below)

  const generatedToday = (todayItems?.length ?? 0) > 0

  let items = todayItems ?? []

  if (!generatedToday) {
    // Fall back to the most recent available date
    const { data: recentItems } = await supabase
      .from('current_affairs')
      .select('id, title, summary, category, exam_relevance, tags, source_date')
      .eq('is_active', true)
      .order('source_date', { ascending: false })
      .order('exam_relevance', { ascending: true })
      .limit(10)

    items = recentItems ?? []
  }

  // Sort: High relevance first
  const relevanceOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
  items = items.sort((a, b) =>
    (relevanceOrder[a.exam_relevance] ?? 1) - (relevanceOrder[b.exam_relevance] ?? 1)
  )

  return NextResponse.json({
    items,
    generatedToday,
    todayDate: todayIST,
  })
}
