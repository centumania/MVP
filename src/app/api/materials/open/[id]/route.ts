/**
 * GET /api/materials/open/[id]
 *
 * Auth + subscription gateway. Validates the Bearer token, checks subscription,
 * then returns { url } for the client to open in a new tab.
 *
 * Browser navigation (new tab) cannot send Authorization headers, so a server-side
 * 302 redirect is not usable. Instead the client fetches this endpoint with the
 * Bearer token, receives the validated URL, and calls window.open(url, '_blank').
 *
 * Response codes:
 *   200 — { url: string } — validated, client should window.open this
 *   401 — not logged in
 *   402 — payment required (beyond free days)
 *   404 — material not found, expired, or has no html_url
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const FREE_DAYS = 2

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  const { data: material } = await supabase
    .from('materials')
    .select('html_url, day_number, expires_at')
    .eq('id', id)
    .gt('expires_at', now)
    .maybeSingle()

  if (!material?.html_url) {
    return NextResponse.json({ error: 'Material not found or expired' }, { status: 404 })
  }

  if (material.day_number > FREE_DAYS) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }
  }

  return NextResponse.json({ url: material.html_url })
}
