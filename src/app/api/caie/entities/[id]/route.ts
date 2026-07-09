import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getCAIEEntity } from '@/src/lib/caie/client'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/caie/entities/[id]
 *
 * Single knowledge-graph entity (with its linked events), proxied from CAIE.
 * Mirrors /api/caie/entities (list) auth: valid JWT + payment_verified. A genuine
 * upstream miss returns 404 so the entity page can show "Entity not found"; other
 * CAIE failures surface as 503.
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

    try {
      const data = await getCAIEEntity(id)
      return NextResponse.json(data)
    } catch (e) {
      if (e instanceof Error && / 404\b/.test(e.message)) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
      }
      throw e
    }
  } catch (e) {
    console.error('[caie/entities/[id]]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
