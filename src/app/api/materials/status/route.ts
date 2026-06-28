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
    .select('payment_verified, registration_number, created_at, batch_id')
    .eq('id', user.id)
    .single()

  const paymentVerified    = profile?.payment_verified === true
  const registrationNumber = profile?.registration_number ?? null
  const enrolledDate       = profile?.created_at
    ? profile.created_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  const batchQuery = supabase.from('batches').select('id, starts_on').eq('is_active', true)
  const { data: batch } = await (
    profile?.batch_id
      ? batchQuery.eq('id', profile.batch_id).maybeSingle()
      : batchQuery.order('starts_on', { ascending: false }).limit(1).maybeSingle()
  )

  let activeDays: number[] = []
  let testLinks: Record<number, string> = {}

  if (batch) {
    // Auto-compute today's batch day in IST (UTC+5:30)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
    const todayIST   = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)
    const startMs    = new Date(batch.starts_on + 'T00:00:00Z').getTime()
    const todayMs    = new Date(todayIST        + 'T00:00:00Z').getTime()
    const daysSince  = Math.floor((todayMs - startMs) / 86_400_000)

    if (daysSince >= 0) {
      const today = daysSince + 1
      // All days from Day 1 up to today are accessible
      activeDays = Array.from({ length: today }, (_, i) => i + 1)
    }

    // Fetch test links for all days (no expiry filter needed)
    const { data: rows } = await supabase
      .from('materials')
      .select('day_number, test_link')
      .eq('batch_id', batch.id)

    for (const row of rows ?? []) {
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
