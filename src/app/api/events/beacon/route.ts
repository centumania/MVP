/**
 * POST /api/events/beacon
 *
 * Beacon endpoint for beforeunload events (navigator.sendBeacon).
 * Token arrives in body as _token because beacon cannot set headers.
 * Same validation as /api/events — silently drops invalid payloads.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { ALLOWED_EVENTS } from '@/src/lib/analytics/track'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: true })
    }

    const { _token, event_name, session_id, event_timestamp, metadata } = body as Record<string, unknown>

    if (typeof _token !== 'string') return NextResponse.json({ ok: true })
    if (typeof event_name !== 'string' || !(ALLOWED_EVENTS as readonly string[]).includes(event_name)) {
      return NextResponse.json({ ok: true })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(_token)
    if (error || !user) return NextResponse.json({ ok: true })

    const ts = typeof event_timestamp === 'string' ? new Date(event_timestamp) : new Date()
    if (isNaN(ts.getTime())) return NextResponse.json({ ok: true })

    await supabase.from('analytics_events').insert({
      user_id:         user.id,
      session_id:      typeof session_id === 'string' ? session_id : null,
      event_name,
      event_timestamp: ts.toISOString(),
      metadata:        metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
