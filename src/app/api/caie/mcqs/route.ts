import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getCAIEMCQs } from '@/src/lib/caie/client'

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
    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 })
    }

    const sp = request.nextUrl.searchParams
    const data = await getCAIEMCQs({
      event_id:   sp.get('event_id')   ?? undefined,
      exam_type:  sp.get('exam_type')  ?? undefined,
      difficulty: sp.get('difficulty') ?? undefined,
      page:       sp.get('page')     ? Number(sp.get('page'))     : undefined,
      per_page:   sp.get('per_page') ? Number(sp.get('per_page')) : undefined,
    })

    return NextResponse.json(data)
  } catch (e) {
    console.error('[caie/mcqs]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
