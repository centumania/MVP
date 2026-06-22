import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_verified, registration_number, created_at')
    .eq('id', user.id)
    .single()

  const paymentVerified    = profile?.payment_verified === true
  const registrationNumber = profile?.registration_number ?? null
  const enrolledDate       = profile?.created_at
    ? profile.created_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  const { data: batch } = await supabase
    .from('batches')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  let activeDays: number[] = []
  let testLinks: Record<number, string> = {}

  if (batch) {
    const now = new Date().toISOString()
    const { data: rows } = await supabase
      .from('materials')
      .select('day_number, test_link')
      .eq('batch_id', batch.id)
      .lte('published_at', now)
      .gt('expires_at', now)

    for (const row of rows ?? []) {
      activeDays.push(row.day_number)
      if (row.test_link) testLinks[row.day_number] = row.test_link
    }
  }

  const response = NextResponse.json({
    paymentVerified,
    registrationNumber,
    enrolledDate,
    activeDays,
    testLinks,
  })

  response.cookies.set('cm_access', '1', {
    httpOnly: true,
    maxAge: 60 * 60,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
