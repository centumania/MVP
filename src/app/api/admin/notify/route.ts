/**
 * POST /api/admin/notify — admin-triggered WhatsApp nudge (Rajan → student).
 *
 * Body: { userId: string, message: string, templateKey?: string }
 * Records to the notifications ledger and sends via Twilio. Returns the result;
 * until the Twilio env vars are set, it records the attempt and reports
 * "not configured" rather than failing — the wiring is proven end to end.
 *
 * This is a manual 1:1 support message initiated by an admin, so it does not
 * require the student's marketing opt-in (automated broadcasts DO — the cron
 * path calls notifyWhatsApp with requireOptIn defaulted true).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { notifyWhatsApp } from '@/src/lib/notify/service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const body = await request.json().catch(() => null)
  const userId = body && typeof body.userId === 'string' ? body.userId : ''
  const message = body && typeof body.message === 'string' ? body.message.trim() : ''
  const templateKey = body && typeof body.templateKey === 'string' ? body.templateKey : 'admin_nudge'

  if (!userId || !message) {
    return NextResponse.json({ error: 'userId and message are required' }, { status: 400 })
  }

  const db = getSupabaseAdminClient()
  const result = await notifyWhatsApp(db, {
    userId,
    body: message,
    templateKey,
    requireOptIn: false,
  })
  return NextResponse.json(result)
}
