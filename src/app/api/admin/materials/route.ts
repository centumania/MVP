/**
 * GET  /api/admin/materials — list all materials for active batch
 * POST /api/admin/materials — create a new material (URL or PDF key)
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
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!batch) return NextResponse.json({ materials: [], batchId: null })

  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, day_number, title, html_url, pdf_key, test_link, published_at, expires_at')
    .eq('batch_id', batch.id)
    .order('day_number', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })

  const now = new Date().toISOString()
  const enriched = (materials ?? []).map(m => ({
    id:          m.id,
    dayNumber:   m.day_number,
    title:       m.title,
    htmlUrl:     m.html_url,
    pdfKey:      m.pdf_key,
    testLink:    m.test_link,
    contentType: m.pdf_key ? 'pdf' : m.html_url ? 'html' : null,
    hasContent:  !!(m.html_url || m.pdf_key),
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

  const { batchId, dayNumber, title, htmlUrl, pdfKey, testLink, publishedAt } = body as Record<string, string>

  if (!batchId || !dayNumber || !title) {
    return NextResponse.json({ error: 'Missing required: batchId, dayNumber, title' }, { status: 400 })
  }

  if (!htmlUrl?.trim() && !pdfKey?.trim() && !testLink?.trim()) {
    return NextResponse.json({ error: 'Provide a URL, upload a PDF, or add a test link.' }, { status: 400 })
  }

  const publishTime = publishedAt ? new Date(publishedAt) : new Date()
  const expiresAt   = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('materials')
    .insert({
      batch_id:     batchId,
      day_number:   Number(dayNumber),
      title:        String(title).trim(),
      html_url:     htmlUrl?.trim()  || null,
      pdf_key:      pdfKey?.trim()   || null,
      test_link:    testLink?.trim() || null,
      published_at: publishTime.toISOString(),
      expires_at:   expiresAt.toISOString(),
      video_url:    null,
      ppt_key:      null,
      html_key:     null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ material: data }, { status: 201 })
}
