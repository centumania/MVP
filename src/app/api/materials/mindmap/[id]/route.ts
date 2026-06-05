/**
 * GET /api/materials/mindmap/[id]
 *
 * Serves the HTML MindMap for a material, gated by auth + payment.
 * Returns the HTML content directly (Content-Type: text/html) so it
 * can be rendered in an iframe inside the viewer page.
 *
 * Security:
 *  - JWT + payment_verified required
 *  - html_key resolved to a presigned URL server-side (never sent to client)
 *  - expiry check enforced (materials.expires_at)
 *  - Sandboxed via iframe sandbox attribute in the viewer
 *
 * Extension points (not yet implemented):
 *  - X-Completion-Tracking header reserved for future XP integration
 *  - X-Analytics-Session header reserved for future learning analytics
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

  // Generate a short-lived presigned URL for the HTML file
  const { data: signedData, error: signError } = await supabase.storage
    .from('materials')
    .createSignedUrl(material.html_key, 60) // 60-second expiry

  if (signError || !signedData?.signedUrl) {
    console.error('[mindmap] Failed to sign URL:', signError)
    return NextResponse.json({ error: 'Failed to load MindMap' }, { status: 500 })
  }

  // Fetch the HTML from storage and proxy it so the raw storage URL is never
  // exposed to the client.
  const htmlResponse = await fetch(signedData.signedUrl)
  if (!htmlResponse.ok) {
    return NextResponse.json({ error: 'Failed to retrieve MindMap' }, { status: 502 })
  }

  const html = await htmlResponse.text()

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type':           'text/html; charset=utf-8',
      'Cache-Control':          'no-store',
      // Extension point headers (reserved for future analytics)
      'X-Completion-Tracking': 'disabled',
      'X-Analytics-Session':   'disabled',
    },
  })
}
