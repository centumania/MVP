/**
 * POST /api/events
 *
 * Accepts analytics events from authenticated students.
 * Returns 200 on success, 400 on bad input, 401 on no auth.
 * Never returns 500 — event loss is acceptable, error surfacing is not.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { ALLOWED_EVENTS } from '@/src/lib/analytics/track'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { event_name, session_id, event_timestamp, metadata } = body as Record<string, unknown>

    if (typeof event_name !== 'string' || !(ALLOWED_EVENTS as readonly string[]).includes(event_name)) {
      return NextResponse.json({ error: 'Unknown event_name' }, { status: 400 })
    }

    const ts = typeof event_timestamp === 'string' ? new Date(event_timestamp) : new Date()
    if (isNaN(ts.getTime())) {
      return NextResponse.json({ error: 'Invalid event_timestamp' }, { status: 400 })
    }

    await supabase.from('analytics_events').insert({
      user_id:         user.id,
      session_id:      typeof session_id === 'string' ? session_id : null,
      event_name:      event_name,
      event_timestamp: ts.toISOString(),
      metadata:        metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Swallow all errors — event loss is acceptable
    return NextResponse.json({ ok: true })
  }
}
