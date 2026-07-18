/**
 * POST /api/leads
 *
 * Public (no-auth) capture of pre-signup onboarding answers from the /welcome
 * flow — the visitor's chosen language, target exam, prep stage, daily hours
 * and how they found us. Best-effort: any failure returns 200 so the client
 * redirect is never blocked, and no PII is required.
 *
 * Storage: inserts into the `leads` table when it exists (create it on DEV
 * first — see the migration note in the PR). Until then this is a safe no-op
 * that still 200s; the answers also live in the client's localStorage.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED = new Set(['lang', 'exam', 'stage', 'hours', 'source'])

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const row: Record<string, string> = {}
    for (const k of ALLOWED) {
      const v = body[k]
      if (typeof v === 'string' && v.length <= 40) row[k] = v
    }
    if (Object.keys(row).length === 0) return NextResponse.json({ ok: true })

    try {
      const supabase = getSupabaseAdminClient()
      await supabase.from('leads').insert({
        lang: row.lang ?? null,
        exam: row.exam ?? null,
        stage: row.stage ?? null,
        hours: row.hours ?? null,
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
