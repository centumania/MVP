/**
 * GET  /api/admin/materials — list all materials for active batch
 * POST /api/admin/materials — create a new material
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()

  const { data: batch } = await supabase
    .from('batches')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (!batch) return NextResponse.json({ materials: [], batchId: null })

  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, day_number, title, html_url, published_at, expires_at')
    .eq('batch_id', batch.id)
    .order('day_number', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })

  const now = new Date().toISOString()
  const enriched = (materials ?? []).map(m => ({
    id:          m.id,
    dayNumber:   m.day_number,
    title:       m.title,
    htmlUrl:     m.html_url,
    hasContent:  !!m.html_url,
    publishedAt: m.published_at,
    expiresAt:   m.expires_at,
    isExpired:   m.expires_at < now,
  }))

  return NextResponse.json({ materials: enriched, batchId: batch.id })
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

  const { batchId, dayNumber, title, htmlUrl, publishedAt } = body as Record<string, string>

  if (!batchId || !dayNumber || !title) {
    return NextResponse.json({ error: 'Missing required: batchId, dayNumber, title' }, { status: 400 })
  }

  if (!htmlUrl?.trim()) {
    return NextResponse.json({ error: 'Hosted HTML URL is required' }, { status: 400 })
  }

  const publishTime = publishedAt ? new Date(publishedAt) : new Date()
  const expiresAt   = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('materials')
    .insert({
      batch_id:     batchId,
      day_number:   Number(dayNumber),
      title:        String(title).trim(),
      html_url:     String(htmlUrl).trim(),
      published_at: publishTime.toISOString(),
      expires_at:   expiresAt.toISOString(),
      // Legacy columns kept nullable in schema
      video_url:    null,
      pdf_key:      null,
      ppt_key:      null,
      html_key:     null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Material for this day already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ material: data }, { status: 201 })
}
