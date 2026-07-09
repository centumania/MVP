/**
 * GET /api/current-affairs
 *
 * Current-affairs feed for the dashboard NewsPanel widget.
 *
 * Sources live data from the CAIE service (the single source of truth for
 * current affairs) and adapts it to the { items, generatedToday, todayDate }
 * shape the dashboard already expects. The former local `current_affairs`
 * table + generate-current-affairs generator was retired — see the CAIE
 * pipeline for how items are produced.
 *
 * Auth: requires valid JWT + payment_verified.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient }    from '@/src/lib/supabase/server'
import { getTodayInIST }             from '@/src/lib/exam-window'
import { getCAIEEvents }             from '@/src/lib/caie/client'

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

// CAIE importance (Critical|High|Medium|Low) → NewsPanel relevance (High|Medium|Low)
const RELEVANCE_FROM_IMPORTANCE: Record<string, string> = {
  Critical: 'High', High: 'High', Medium: 'Medium', Low: 'Low',
}
const RELEVANCE_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 }

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('payment_verified').eq('id', user.id).single()
  if (!profile?.payment_verified) {
    return NextResponse.json({ error: 'Payment required' }, { status: 403 })
  }

  const todayIST = getTodayInIST(new Date())

  try {
    const { data: events } = await getCAIEEvents({ per_page: 12 })
    const items: CurrentAffairsItem[] = (events ?? [])
      .map(e => ({
        id:             e.id,
        title:          e.headline,
        summary:        e.ultra_short_summary,
        category:       e.category,
        exam_relevance: RELEVANCE_FROM_IMPORTANCE[e.importance] ?? 'Medium',
        tags:           e.tags ?? [],
        source_date:    e.source_date,
      }))
      .sort((a, b) => (RELEVANCE_ORDER[a.exam_relevance] ?? 1) - (RELEVANCE_ORDER[b.exam_relevance] ?? 1))

    const generatedToday = items.some(i => i.source_date === todayIST)
    return NextResponse.json({ items, generatedToday, todayDate: todayIST })
  } catch (e) {
    // Fail soft: the dashboard widget shows nothing rather than erroring the page.
    console.error('[api/current-affairs] CAIE fetch failed', e)
    return NextResponse.json({ items: [], generatedToday: false, todayDate: todayIST })
  }
}
