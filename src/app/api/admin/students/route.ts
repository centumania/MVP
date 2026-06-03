/**
 * GET  /api/admin/students — list all students with submission stats
 * POST /api/admin/students — (reserved for future batch import)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { searchParams } = new URL(request.url)
  const search  = searchParams.get('search') ?? ''
  const status  = searchParams.get('status') ?? 'all'  // all | verified | pending
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = 50
  const offset  = (page - 1) * perPage

  const supabase = getSupabaseAdminClient()

  let query = supabase
    .from('profiles')
    .select('id, name, email, phone, tier, payment_verified, created_at', { count: 'exact' })
    .eq('is_admin', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (status === 'verified') query = query.eq('payment_verified', true)
  if (status === 'pending')  query = query.eq('payment_verified', false)

  const { data: profiles, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }

  // Submission counts per student (batch)
  const ids = (profiles ?? []).map(p => p.id)
  const { data: submissionCounts } = ids.length > 0
    ? await supabase
        .from('submissions')
        .select('user_id')
        .in('user_id', ids)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const s of submissionCounts ?? []) {
    countMap[s.user_id] = (countMap[s.user_id] ?? 0) + 1
  }

  const students = (profiles ?? []).map(p => ({
    ...p,
    daysAttended: countMap[p.id] ?? 0,
  }))

  return NextResponse.json({
    students,
    total: count ?? 0,
    page,
    perPage,
  })
}
