/**
 * POST /api/generate-current-affairs
 *
 * Cron endpoint — triggers the generate-current-affairs Supabase Edge Function.
 * Called daily at 07:00 IST (01:30 UTC) by Vercel Cron (vercel.json).
 *
 * Auth: requires CRON_SECRET header (same secret used for metrics recalculation).
 * The Edge Function itself validates the service role key in the Authorization header.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing env' }, { status: 500 })
  }

  const edgeFnUrl = `${supabaseUrl}/functions/v1/generate-current-affairs`

  try {
    const res = await fetch(edgeFnUrl, {
      method:  'POST',
      headers: { Authorization: `Bearer ${serviceKey}` },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[generate-current-affairs] Edge Function error:', data)
      return NextResponse.json({ error: 'Edge Function failed', detail: data }, { status: 502 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[generate-current-affairs] Fetch error:', err)
    return NextResponse.json({ error: 'Edge Function unreachable' }, { status: 502 })
  }
}
