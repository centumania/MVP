/**
 * GET /api/materials/mindmap/[id]
 *
 * Returns a short-lived presigned URL for the interactive HTML MindMap.
 * The viewer loads the URL directly in an iframe — Supabase Storage serves
 * the HTML without a restrictive CSP so all inline scripts run freely.
 *
 * Security:
 *  - JWT + payment_verified required before the URL is issued
 *  - Presigned URL expires in 5 minutes (viewer must load within that window)
 *  - html_key (internal storage path) is never sent to the client
 *  - expires_at enforced: expired materials return 404
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('payment_verified')
    .eq('id', user.id)
    .single()

  if (!profile?.payment_verified) {
    return NextResponse.json({ error: 'Payment required' }, { status: 402 })
  }

  const now = new Date().toISOString()
  const { data: material } = await supabase
    .from('materials')
    .select('id, html_key, expires_at')
    .eq('id', id)
    .gt('expires_at', now)
    .single()

  if (!material?.html_key) {
    return NextResponse.json({ error: 'MindMap not found or expired' }, { status: 404 })
  }

  // 5-minute presigned URL — enough for the iframe to load the full HTML
  const { data: signedData, error: signError } = await supabase.storage
    .from('materials')
    .createSignedUrl(material.html_key, 300)

  if (signError || !signedData?.signedUrl) {
    console.error('[mindmap] Failed to sign URL:', signError)
    return NextResponse.json({ error: 'Failed to load MindMap' }, { status: 500 })
  }

  // Return the presigned URL — the viewer uses it as the iframe src.
  // Supabase Storage serves the HTML with no restrictive CSP, so all
  // inline scripts and dynamic imports in the MindMap run freely.
  return NextResponse.json(
    { url: signedData.signedUrl },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
