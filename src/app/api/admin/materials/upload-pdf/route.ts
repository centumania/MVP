/**
 * POST /api/admin/materials/upload-pdf
 *
 * Accepts a multipart/form-data request with a single PDF file.
 * Uploads it to the private Supabase Storage bucket "centumania-materials".
 * Returns { key } — the storage object path, stored in materials.pdf_key.
 *
 * Security:
 *   - Admin JWT required
 *   - MIME type validated (application/pdf only)
 *   - File size capped at 20 MB
 *   - Filename sanitised + UUID-prefixed (prevents path guessing)
 *
 * Bucket setup (run once in Supabase Dashboard → Storage):
 *   1. Create bucket named "centumania-materials"
 *   2. Set to PRIVATE (not public)
 *   3. Add RLS policy: allow service_role full access (default — no change needed)
 *
 * Signed URLs (1-hour expiry) are generated on student access via
 * GET /api/materials/open/[id].
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES  = 20 * 1024 * 1024  // 20 MB
const BUCKET     = 'centumania-materials'

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  // ── Parse multipart form ────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided. Use field name "file".' }, { status: 400 })
  }

  // ── Validate MIME ────────────────────────────────────────────────
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted.' }, { status: 415 })
  }

  // ── Validate size ────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    )
  }

  // ── Sanitise filename + UUID prefix ─────────────────────────────
  // UUID prefix ensures the key cannot be guessed even if the filename leaks.
  const originalName = (file.name ?? 'upload.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `pdfs/${crypto.randomUUID()}-${originalName}`

  // ── Upload to private Supabase Storage ───────────────────────────
  const supabase = getSupabaseAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-pdf] Storage upload failed:', uploadError)
    // Friendly message for the most common case
    if (uploadError.message?.toLowerCase().includes('bucket') || uploadError.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Storage bucket "centumania-materials" not found. Create it in Supabase Dashboard → Storage first.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  return NextResponse.json({ key }, { status: 201 })
}
