import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getCAIEAttempts, submitCAIEAttempt } from '@/src/lib/caie/client'

export const dynamic = 'force-dynamic'

async function authenticate(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const supabase = getSupabaseAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabase
    .from('profiles').select('payment_verified').eq('id', user.id).single()
  if (!profile?.payment_verified) return null
  return user
}

// GET /api/caie/attempts?mcq_ids=id1,id2,...
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const mcq_ids = request.nextUrl.searchParams.get('mcq_ids') ?? ''
    const ids = mcq_ids.split(',').map(s => s.trim()).filter(Boolean)
    const data = await getCAIEAttempts(user.id, ids)
    return NextResponse.json({ data })
  } catch (e) {
    console.error('[caie/attempts GET]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}

// POST /api/caie/attempts   body: { mcq_id, chosen_option }
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { mcq_id?: string; chosen_option?: string }
    if (!body.mcq_id || !body.chosen_option) {
      return NextResponse.json({ error: 'mcq_id and chosen_option are required' }, { status: 400 })
    }

    // user_id is injected server-side — never trusted from the client body
    const result = await submitCAIEAttempt({
      mcq_id: body.mcq_id,
      user_id: user.id,
      chosen_option: body.chosen_option,
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error('[caie/attempts POST]', e)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
