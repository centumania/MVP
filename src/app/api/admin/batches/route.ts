/**
 * GET  /api/admin/batches — list all batches
 * POST /api/admin/batches — create a new batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()
  const { data: batches, error } = await supabase
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }

  return NextResponse.json({ batches: batches ?? [] })
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, examType, startsOn, endsOn, totalDays, isActive } = body as Record<string, unknown>

  if (!name || !startsOn || !endsOn) {
    return NextResponse.json({ error: 'Missing required: name, startsOn, endsOn' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('batches')
    .insert({
      name:       String(name).trim(),
      exam_type:  String(examType ?? 'LDC'),
      starts_on:  String(startsOn),
      ends_on:    String(endsOn),
      total_days: Number(totalDays ?? 25),
      is_active:  Boolean(isActive ?? false),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Batch name already exists or another batch is already active' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ batch: data }, { status: 201 })
}
