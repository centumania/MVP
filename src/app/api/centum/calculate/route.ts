/**
 * POST /api/centum/calculate
 *
 * Triggers calculate_centum_index() Postgres function for one student.
 * Admin-only. Returns the JSONB result from the function.
 *
 * Body: { user_id: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { CentumBreakdown } from '@/src/types/centum'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_id } = body as Record<string, unknown>
  if (typeof user_id !== 'string' || !user_id.trim()) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  // Verify the user exists in profiles before calling the function
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user_id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data, error } = await supabase.rpc('calculate_centum_index', {
    p_user_id: user_id,
  })

  if (error) {
    console.error('[centum/calculate] RPC error:', error)
    return NextResponse.json(
      { error: 'Calculation failed', detail: error.message },
      { status: 500 },
    )
  }

  // The function returns a JSONB error object if no active batch exists
  const result = data as unknown as CentumBreakdown & { error?: string }
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  return NextResponse.json(result as unknown as CentumBreakdown)
}
