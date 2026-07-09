import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getCAIEUserStats } from '@/src/lib/caie/client'

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

    const data = await getCAIEUserStats(user.id)
    return NextResponse.json(data)
  } catch (e) {
    console.error('[caie/attempts/stats]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
