/**
 * PATCH  /api/admin/materials/[id] — update material
 * DELETE /api/admin/materials/[id] — delete material
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import type { Material } from '@/src/types/database'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

type MaterialUpdate = Partial<Pick<Material, 'title' | 'html_url' | 'published_at' | 'expires_at'>>

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
  if ('htmlUrl' in body) allowed.html_url = (body.htmlUrl as string) || null

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

  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
