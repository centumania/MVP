/**
 * GET /api/materials
 *
 * Returns today's active study material for the authenticated student.
 * S3 keys (pdf_key, ppt_key) are NEVER returned to the client.
 * Only metadata and public video URLs are exposed.
 *
 * Returns 402 if student is not payment-verified.
 * Returns 404 if no non-expired material exists today.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('payment_verified').eq('id', user.id).single()
    if (!profile?.payment_verified) return NextResponse.json({ error: 'Payment required' }, { status: 402 })

    // Active batch
    const { data: batch } = await supabase
      .from('batches').select('id').eq('is_active', true).limit(1).maybeSingle()
    if (!batch) return NextResponse.json({ error: 'No active batch' }, { status: 404 })

    const now = new Date()

    // Fetch today's non-expired material for this batch
    const { data: materials, error: matErr } = await supabase
      .from('materials')
      .select('id, day_number, title, video_url, published_at, expires_at, pdf_key, ppt_key, html_key')
      .eq('batch_id', batch.id)
      .gt('expires_at', now.toISOString())
      .order('day_number', { ascending: false })

    if (matErr) {
      console.error('[materials] Query failed:', matErr)
      return NextResponse.json({ error: 'Failed to load materials' }, { status: 500 })
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json({ error: 'No materials available' }, { status: 404 })
    }

    // Strip S3/storage keys — only expose safe metadata + YouTube/public video URLs
    const safe = materials.map(m => ({
      id:          m.id,
      dayNumber:   m.day_number,
      title:       m.title,
      hasPDF:      !!m.pdf_key,
      hasPPT:      !!m.ppt_key,
      hasVideo:    !!m.video_url,
      hasMindMap:  !!m.html_key,  // Flag only — raw key never sent to client
      // Expose YouTube URLs and local /study/ embeds; never expose storage keys
      videoUrl:    (m.video_url?.startsWith('http') || m.video_url?.startsWith('/study/'))
                     ? m.video_url : null,
      publishedAt: m.published_at,
      expiresAt:   m.expires_at,
    }))

    return NextResponse.json({ materials: safe })

  } catch (err) {
    console.error('[materials] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
