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

  // Unlock days based on the student's own enrollment date (IST UTC+5:30).
  // Day 1 is available immediately on join. Day N unlocks N-1 days later.
  // Batch membership is kept for admin/reporting only — it no longer gates content.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const todayIST  = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)
  const todayMs   = new Date(todayIST + 'T00:00:00Z').getTime()
  const enrollMs  = new Date(enrolledDate + 'T00:00:00Z').getTime()
  const daysSince = Math.floor((todayMs - enrollMs) / 86_400_000)
  if (daysSince >= 0) {
    activeDays = Array.from({ length: daysSince + 1 }, (_, i) => i + 1)
  }

  // Fetch test links from the DB materials table (batch-scoped, admin-managed)
  if (batch) {
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
