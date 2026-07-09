/**
 * GET /api/admin/ops
 *
 * Aggregated daily operations snapshot for the admin Operations Center.
 * Read-only — combines counts already exposed piecemeal elsewhere
 * (daily test assignments, study quiz scores, current affairs, centum index)
 * into one payload so the ops page needs a single request.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST } from '@/src/lib/exam-window'
import { getCAIEEvents } from '@/src/lib/caie/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()
  const todayIST = getTodayInIST(new Date())

  const [
    { count: verifiedStudents },
    { count: assignmentsToday },
    { count: studyScoresToday },
    { data: activeBatch },
    { data: latestCentumRow },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('is_admin', false).eq('payment_verified', true),
    supabase.from('daily_test_assignments').select('*', { count: 'exact', head: true })
      .eq('test_date', todayIST),
    supabase.from('daily_test_scores').select('*', { count: 'exact', head: true })
      .eq('test_date', todayIST),
    supabase.from('batches').select('id, name').eq('is_active', true).maybeSingle(),
    supabase.from('centum_index_log').select('calculated_date')
      .order('calculated_date', { ascending: false }).limit(1).maybeSingle(),
  ])

  // Current affairs are served by the CAIE service (System A), not the retired
  // local current_affairs table. Guarded so an unreachable CAIE never 500s ops.
  let currentAffairs = { publishedToday: 0, activeTotal: 0, ok: true }
  try {
    const [todayCA, totalCA] = await Promise.all([
      getCAIEEvents({ from_date: todayIST, to_date: todayIST, per_page: 1 }),
      getCAIEEvents({ per_page: 1 }),
    ])
    currentAffairs = { publishedToday: todayCA.total, activeTotal: totalCA.total, ok: true }
  } catch (e) {
    console.error('[admin/ops] CAIE fetch failed', e)
    currentAffairs.ok = false
  }

  let centum: { calculatedDate: string | null; top: number; avg: number } = {
    calculatedDate: latestCentumRow?.calculated_date ?? null,
    top: 0,
    avg: 0,
  }

  if (latestCentumRow?.calculated_date) {
    const { data: rows } = await supabase
      .from('centum_index_log')
      .select('centum_index')
      .eq('calculated_date', latestCentumRow.calculated_date)

    if (rows && rows.length > 0) {
      const values = rows.map(r => Number(r.centum_index))
      centum.top = Math.round(Math.max(...values) * 10) / 10
      centum.avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    }
  }

  return NextResponse.json({
    todayDate: todayIST,
    activeBatch,
    students: { verified: verifiedStudents ?? 0 },
    dailyTest: {
      assignmentsGenerated: assignmentsToday ?? 0,
      studyQuizSubmitted: studyScoresToday ?? 0,
    },
    currentAffairs: {
      publishedToday: currentAffairs.publishedToday,
      activeTotal: currentAffairs.activeTotal,
      source: currentAffairs.ok ? 'caie' : 'unavailable',
    },
    centum,
  })
}
