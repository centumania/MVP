/**
 * GET /api/cron/daily-nudge — the "works while you sleep" job.
 *
 * Runs daily (Vercel Cron). Re-engages drifting students: for everyone flagged
 * at_risk / never_started who has OPTED IN and hasn't been nudged within the
 * cooldown window, it sends a WhatsApp nudge via the notification engine and
 * records it. CRON_SECRET-gated. Fully idempotent within the cooldown.
 *
 * WhatsApp rule: drifting students are outside the 24h window, so a real send
 * needs an approved TEMPLATE. If TWILIO_NUDGE_TEMPLATE_SID is set we use it;
 * otherwise we fall back to free-form body (delivers only inside 24h / sandbox).
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { computeStudentIntel } from '@/src/lib/growth/intel'
import { notifyWhatsApp } from '@/src/lib/notify/service'

export const dynamic = 'force-dynamic'

const COOLDOWN_DAYS = 3
const NUDGE_TEMPLATE_KEY = 'at_risk_nudge'
const MAX_PER_RUN = 200 // safety cap so a bad state can never blast everyone

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  const q = request.nextUrl.searchParams.get('secret')
  return auth === `Bearer ${secret}` || q === secret
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdminClient()
  // `notifications` is intentionally outside the generated Database types
  // (same pattern as classroom_progress) — use an untyped view for it.
  const dbn = db as unknown as SupabaseClient
  const { students } = await computeStudentIntel(db)
  const targets = students.filter(s => s.health === 'at_risk' || s.health === 'never_started')

  // Cooldown: skip anyone already nudged (sent) within the last COOLDOWN_DAYS.
  const since = new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString()
  const { data: recent } = await dbn
    .from('notifications')
    .select('user_id')
    .eq('template_key', NUDGE_TEMPLATE_KEY)
    .eq('status', 'sent')
    .gte('created_at', since)
  const recentlyNudged = new Set(((recent ?? []) as { user_id: string }[]).map(r => r.user_id))

  const templateSid = process.env.TWILIO_NUDGE_TEMPLATE_SID
  const results = { targets: targets.length, attempted: 0, sent: 0, skipped: 0, failed: 0, cooled: 0 }

  for (const s of targets) {
    if (results.attempted >= MAX_PER_RUN) break
    if (recentlyNudged.has(s.id)) { results.cooled++; continue }
    results.attempted++
    const first = s.name.split(' ')[0]
    const body = `Hi ${first}, Rajan here from CentuMania 👋 Noticed you've been away — your daily test and streak are waiting. Jump back in: https://centumania.co.in/dashboard`
    const r = await notifyWhatsApp(db, {
      userId: s.id,
      ...(templateSid
        ? { contentSid: templateSid, contentVariables: { '1': first } }
        : { body }),
      templateKey: NUDGE_TEMPLATE_KEY,
      requireOptIn: true,
    })
    if (r.status === 'sent') results.sent++
    else if (r.status === 'skipped') results.skipped++
    else results.failed++
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), cooldownDays: COOLDOWN_DAYS, usingTemplate: !!templateSid, ...results })
}
