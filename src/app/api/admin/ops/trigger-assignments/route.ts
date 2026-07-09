/**
 * POST /api/admin/ops/trigger-assignments
 *
 * Admin-triggered manual run of the daily assignment generation Edge Function.
 * Mirrors /api/generate-assignments (the ASSIGNMENT_SECRET-gated version called
 * by QStash at 23:30 IST) but gates on admin JWT instead, for on-demand reruns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing env' }, { status: 500 })
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
    console.error('[admin/ops/trigger-assignments] Edge Function call failed:', err)
    return NextResponse.json({ error: 'Edge Function unreachable' }, { status: 502 })
  }

  let payload: unknown
  try {
    payload = await fnResponse.json()
  } catch {
    payload = { raw: await fnResponse.text() }
  }

  if (!fnResponse.ok) {
    console.error('[admin/ops/trigger-assignments] Edge Function error:', fnResponse.status, payload)
    return NextResponse.json(
      { error: 'Edge Function returned an error', detail: payload },
      { status: fnResponse.status },
    )
  }

  return NextResponse.json(payload, { status: 200 })
}
