/**
 * GET /api/centum/student/[id]
 *
 * Returns the last 7 days of Centum Index scores for one student.
 * Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params

  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('centum_index_log')
    .select('*')
    .eq('user_id', id)
    .order('calculated_date', { ascending: false })
    .limit(7)

  if (error) {
    console.error('[centum/student] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }

  return NextResponse.json({ history: data ?? [] })
}
