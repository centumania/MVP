/**
 * PATCH  /api/admin/materials/[id] — update title, URL, PDF key, or expiry
 * DELETE /api/admin/materials/[id] — delete material + remove PDF from storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { Material } from '@/src/types/database'

export const dynamic = 'force-dynamic'

const BUCKET = 'centumania-materials'

type Params = { params: Promise<{ id: string }> }

type MaterialUpdate = Partial<Pick<Material, 'title' | 'html_url' | 'pdf_key' | 'test_link' | 'published_at' | 'expires_at'>>

export async function PATCH(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed: MaterialUpdate = {}
  if ('title'   in body) allowed.title    = String(body.title).trim()
  if ('htmlUrl' in body) {
    allowed.html_url = (body.htmlUrl as string)?.trim() || null
    // If switching to URL mode, clear any existing PDF key
    if (allowed.html_url) allowed.pdf_key = null
  }
  if ('pdfKey' in body) {
    allowed.pdf_key  = (body.pdfKey as string)?.trim() || null
    // If switching to PDF mode, clear any existing HTML URL
    if (allowed.pdf_key) allowed.html_url = null
  }
  if ('testLink' in body) {
    allowed.test_link = (body.testLink as string)?.trim() || null
  }

  if ('publishedAt' in body && body.publishedAt) {
    const pub = new Date(String(body.publishedAt))
    allowed.published_at = pub.toISOString()
    allowed.expires_at   = new Date(pub.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('materials')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ material: data })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  // Fetch pdf_key before deleting so we can clean up storage
  const { data: material } = await supabase
    .from('materials')
    .select('pdf_key')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Clean up PDF from storage (non-fatal — row is already deleted)
  if (material?.pdf_key) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([material.pdf_key])
    if (storageError) {
      console.warn('[materials/delete] Storage cleanup failed (row deleted):', storageError.message)
    }
  }

  return NextResponse.json({ success: true })
}
