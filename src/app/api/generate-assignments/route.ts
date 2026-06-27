/**
 * POST /api/generate-assignments
 *
 * Entry point called by Upstash QStash at 23:30 IST daily.
 * Validates the shared secret, then forwards to the Supabase Edge Function
 * which does the actual assignment generation.
 *
 * Security: only proceeds if x-assignment-secret header matches
 * ASSIGNMENT_SECRET env var. QStash sends this header on every invocation.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // ── 1. Validate shared secret ──────────────────────────────────────────────
  const secret = process.env.ASSIGNMENT_SECRET
  if (!secret) {
    console.error('[generate-assignments] ASSIGNMENT_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const incomingSecret = request.headers.get('x-assignment-secret')
  if (!incomingSecret || incomingSecret !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── 2. Forward to Supabase Edge Function ──────────────────────────────────
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('[generate-assignments] Missing Supabase env vars')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const fnUrl = `${supabaseUrl}/functions/v1/generate-daily-assignments`

  let fnResponse: Response
  try {
    fnResponse = await fetch(fnUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({}),
    })
  } catch (err) {
    console.error('[generate-assignments] Edge Function call failed:', err)
    return NextResponse.json({ error: 'Edge Function unreachable' }, { status: 502 })
  }

  // ── 3. Relay response ─────────────────────────────────────────────────────
  let payload: unknown
  try {
    payload = await fnResponse.json()
  } catch {
    payload = { raw: await fnResponse.text() }
  }

  if (!fnResponse.ok) {
    console.error('[generate-assignments] Edge Function error:', fnResponse.status, payload)
    return NextResponse.json(
      { error: 'Edge Function returned an error', detail: payload },
      { status: fnResponse.status },
    )
  }

  return NextResponse.json(payload, { status: 200 })
}
