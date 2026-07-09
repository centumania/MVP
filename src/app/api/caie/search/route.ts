import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { searchCAIEEvents } from '@/src/lib/caie/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const query: string = body?.query ?? ''
    if (!query || query.length < 2 || query.length > 500) {
      return NextResponse.json({ error: 'query must be 2–500 characters' }, { status: 400 })
    }

    const data = await searchCAIEEvents({
      query,
      exam_type: body?.exam_type,
      category:  body?.category,
      limit:     body?.limit,
    })

    return NextResponse.json(data)
  } catch (e) {
    console.error('[caie/search]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
