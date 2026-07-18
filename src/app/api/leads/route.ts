/**
 * POST /api/leads
 *
 * Public (no-auth) capture of pre-signup onboarding answers from the /welcome
 * flow — the visitor's chosen language, target exam, prep stage, daily hours
 * and how they found us. Best-effort: any failure returns 200 so the client
 * redirect is never blocked, and no PII is required.
 *
 * Security posture:
 *   • Rate-limited by client IP (abuse / bot-flood protection on a public route).
 *   • Input is whitelisted to 5 known keys, each capped at 40 chars.
 *   • Writes to `onboarding_leads` (RLS on, no policies) via the service-role
 *     client only — the table is never readable/writable through the public
 *     REST API. It is deliberately separate from the `leads` contact table.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { rateLimit } from '@/src/lib/rate-limit'

export const dynamic = 'force-dynamic'

const ALLOWED = ['lang', 'exam', 'stage', 'hours', 'source'] as const

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    // Abuse guard: a real visitor submits once; 20/10min per IP is generous for
    // shared NAT (college / office wifi) while capping bot floods. Never blocks
    // the client redirect — over-limit still 200s, it just skips the write.
    const limiter = await rateLimit(`leads:${clientIp(request)}`, { limit: 20, window: '10 m' })
    if (!limiter.success) return NextResponse.json({ ok: true })

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const row: Record<string, string> = {}
    for (const k of ALLOWED) {
      const v = body[k]
      if (typeof v === 'string' && v.length <= 40) row[k] = v
    }
    if (Object.keys(row).length === 0) return NextResponse.json({ ok: true })

    try {
      // `onboarding_leads` is intentionally NOT in the generated Database types —
      // it is a service-role-only capture table never read by typed client code.
      // A narrow cast keeps the rest of the file fully typed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = getSupabaseAdminClient() as any
      await admin.from('onboarding_leads').insert({
        lang:   row.lang   ?? null,
        exam:   row.exam   ?? null,
        stage:  row.stage  ?? null,
        hours:  row.hours  ?? null,
        source: row.source ?? null,
        user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
      })
    } catch {
      // table may not exist yet — swallow; the client keeps the answer locally
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
