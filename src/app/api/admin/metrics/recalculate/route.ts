/**
 * POST /api/admin/metrics/recalculate
 *
 * Triggers a full recalculation of student_metrics from analytics_events.
 * Should be called:
 *   - By Vercel Cron (hourly, via CRON_SECRET Authorization header)
 *   - By an admin manually to backfill/repair metrics
 *
 * Auth: admin JWT  OR  Authorization: Bearer {CRON_SECRET}
 *
 * Response: { ok: true, students_updated: number, duration_ms: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // Vercel function timeout (seconds)

export async function POST(request: NextRequest) {
  const t0 = Date.now()

  // ── Auth: Vercel Cron secret OR admin JWT ─────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? ''
  const token      = authHeader.replace(/^Bearer\s+/i, '')

  const cronSecret = process.env.CRON_SECRET
  const isCron     = cronSecret && token === cronSecret

  if (!isCron) {
    // Fall through to admin JWT check
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // ── Run recalculation ─────────────────────────────────────────────────────
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase.rpc('refresh_student_metrics')
    if (error) {
      console.error('[metrics/recalculate] RPC failed:', error)
      return NextResponse.json({ error: 'Recalculation failed', detail: error.message }, { status: 500 })
    }

    const studentsUpdated = (data as { students_updated: number }[] | null)?.[0]?.students_updated ?? 0

    return NextResponse.json({
      ok:               true,
      students_updated: studentsUpdated,
      duration_ms:      Date.now() - t0,
    })
  } catch (err) {
    console.error('[metrics/recalculate] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
