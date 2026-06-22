/**
 * GET /api/admin/metrics
 *
 * Admin-only. Returns per-student engagement metrics from student_metrics table,
 * joined with profiles for name/phone. Useful for admin dashboard and debugging.
 *
 * Response:
 * {
 *   updated_at: string       // when metrics were last recalculated
 *   students: {
 *     user_id, name, phone, registration_number,
 *     materials_opened, nodes_opened, nodes_completed,
 *     mcqs_completed, mcqs_correct, study_sessions,
 *     engagement_score, last_event_at, updated_at
 *   }[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch metrics joined with profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, phone, registration_number')
      .eq('payment_verified', true)
      .eq('is_admin', false)
      .order('name')

    const { data: metrics, error: metricsErr } = await supabase
      .from('student_metrics')
      .select('*')

    if (metricsErr) {
      console.error('[admin/metrics] Query failed:', metricsErr)
      return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
    }

    const metricsMap = Object.fromEntries((metrics ?? []).map(m => [m.user_id, m]))

    const students = (profiles ?? []).map(p => {
      const m = metricsMap[p.id]
      return {
        user_id:             p.id,
        name:                p.name,
        phone:               p.phone,
        registration_number: p.registration_number,
        materials_opened:    m?.materials_opened  ?? 0,
        nodes_opened:        m?.nodes_opened      ?? 0,
        nodes_completed:     m?.nodes_completed   ?? 0,
        mcqs_completed:      m?.mcqs_completed    ?? 0,
        mcqs_correct:        m?.mcqs_correct      ?? 0,
        study_sessions:      m?.study_sessions    ?? 0,
        engagement_score:    m?.engagement_score  ?? 0,
        last_event_at:       m?.last_event_at     ?? null,
        updated_at:          m?.updated_at        ?? null,
      }
    })

    // Most recently updated row tells us when metrics were last refreshed
    const latestUpdate = metrics && metrics.length > 0
      ? metrics.reduce((a, b) => a.updated_at > b.updated_at ? a : b).updated_at
      : null

    return NextResponse.json({ updated_at: latestUpdate, students })

  } catch (err) {
    console.error('[admin/metrics] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
