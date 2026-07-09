import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getCAIEEvent } from '@/src/lib/caie/client'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/caie/events/[id]
 *
 * Single current-affairs event (headline, summaries, exam relevance + its MCQs),
 * proxied from the CAIE service. Mirrors /api/caie/events (list) auth: valid JWT
 * + payment_verified. A genuine upstream miss returns 404 so the detail page can
 * show "Event not found"; other CAIE failures surface as 503.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
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

    const { id } = await params
    const lang = request.nextUrl.searchParams.get('lang') ?? undefined

    try {
      const data = await getCAIEEvent(id, lang)
      return NextResponse.json(data)
    } catch (e) {
      // caieGet throws `CAIE API error: <status> ...` on non-2xx — map a genuine
      // upstream 404 to a 404 here; anything else bubbles to the 503 handler.
      if (e instanceof Error && / 404\b/.test(e.message)) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      throw e
    }
  } catch (e) {
    console.error('[caie/events/[id]]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
