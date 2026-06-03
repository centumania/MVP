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

  if (!batch) {
    return NextResponse.json({ materials: [], batchId: null })
  }

  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, day_number, title, video_url, pdf_key, ppt_key, published_at, expires_at')
    .eq('batch_id', batch.id)
    .order('day_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }

  const now = new Date().toISOString()
  const enriched = (materials ?? []).map(m => ({
    id:          m.id,
    dayNumber:   m.day_number,
    title:       m.title,
    hasVideo:    !!m.video_url,
    hasPDF:      !!m.pdf_key,
    hasPPT:      !!m.ppt_key,
    videoUrl:    m.video_url,
    pdfKey:      m.pdf_key,
    pptKey:      m.ppt_key,
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

  const { batchId, dayNumber, title, videoUrl, pdfKey, pptKey, publishedAt } = body as Record<string, string>

  if (!batchId || !dayNumber || !title) {
    return NextResponse.json({ error: 'Missing required: batchId, dayNumber, title' }, { status: 400 })
  }

  if (!videoUrl && !pdfKey && !pptKey) {
    return NextResponse.json({ error: 'At least one content source required (video, PDF, or PPT)' }, { status: 400 })
  }

  const publishTime = publishedAt ? new Date(publishedAt) : new Date()
  const expiresAt   = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('materials')
    .insert({
      batch_id:     batchId,
      day_number:   Number(dayNumber),
      title:        String(title).trim(),
      video_url:    videoUrl || null,
      pdf_key:      pdfKey   || null,
      ppt_key:      pptKey   || null,
      published_at: publishTime.toISOString(),
      expires_at:   expiresAt.toISOString(),
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
