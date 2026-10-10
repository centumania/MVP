/**
 * POST /api/pilot/register
 *
 * Public (no-auth) sign-up for the free Vijayadashami pilot orientation on
 * /pilot. Unlike /api/leads this is not best-effort: the visitor is told
 * they're registered, so a failed write returns 503 and the client falls back
 * to a prefilled WhatsApp message instead of silently losing the sign-up.
 *
 * Security posture:
 *   • Rate-limited by client IP (public route, collects a phone number).
 *   • Body validated by parsePilotRegistration — whitelisted enums, capped name,
 *     normalised 10-digit Indian mobile.
 *   • Writes to `pilot_registrations` (RLS on, no policies) via the service-role
 *     client only. Upsert on phone, so a repeat submission updates one row.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { rateLimit } from '@/src/lib/rate-limit'
import { parsePilotRegistration } from '@/src/data/pilot'

export const dynamic = 'force-dynamic'

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function POST(request: NextRequest) {
  // 10/10min per IP: a family or a college lab registering several students
  // from one connection still fits; a bot flood does not.
  const limiter = await rateLimit(`pilot:${clientIp(request)}`, { limit: 10, window: '10 m' })
  if (!limiter.success) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') return NextResponse.json({ ok: false, error: 'body' }, { status: 400 })

  const parsed = parsePilotRegistration(body)
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })

  try {
    // `pilot_registrations` is intentionally NOT in the generated Database
    // types — a service-role-only capture table never read by typed client code.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdminClient() as any
    const { error } = await admin.from('pilot_registrations').upsert(
      {
        ...parsed.row,
        user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone' },
    )
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pilot/register] insert failed', err)
    return NextResponse.json({ ok: false, error: 'store' }, { status: 503 })
  }
}
