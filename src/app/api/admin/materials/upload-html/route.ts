/**
 * POST /api/admin/materials/upload-html
 * Accepts a multipart form with an HTML file, uploads to Supabase Storage bucket
 * 'materials', returns the storage key.
 * Admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.name.endsWith('.html')) {
    return NextResponse.json({ error: 'Only .html files are accepted' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 413 })
  }

  const supabase = getSupabaseAdminClient()
  const key = `mindmaps/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '_')}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('materials')
    .upload(key, arrayBuffer, {
      contentType: 'text/html',
      upsert: false,
    })

  if (error) {
    console.error('[upload-html] Storage error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  return NextResponse.json({ key }, { status: 201 })
}
