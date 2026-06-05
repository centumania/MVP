/**
 * GET /api/admin/stats
 * Returns dashboard-level metrics for the admin overview page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const supabase = getSupabaseAdminClient()

  const [
    { count: totalStudents },
    { count: verifiedStudents },
    { count: pendingStudents },
    { count: totalSubmissions },
    { data: recentSubmissions },
    { data: activeBatch },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false).eq('payment_verified', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false).eq('payment_verified', false),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('submitted_at, score, total_marks').order('submitted_at', { ascending: false }).limit(7),
    supabase.from('batches').select('id, name, total_days, starts_on, ends_on, is_active').eq('is_active', true).maybeSingle(),
  ])

  // Today's submissions
  const todayIST = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
  const { count: todaySubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', `${todayIST}T00:00:00+05:30`)

  // Average accuracy from the leaderboard view (one row per user, not per submission)
  // The leaderboard view already aggregates per-user accuracy, so this is O(users) not O(submissions).
  const { data: avgData } = await supabase
    .from('leaderboard')
    .select('accuracy_percent')

  const avgScore = avgData && avgData.length > 0
    ? Math.round(avgData.reduce((acc, r) => acc + (r.accuracy_percent ?? 0), 0) / avgData.length)
    : 0

  return NextResponse.json({
    students: {
      total:    totalStudents   ?? 0,
      verified: verifiedStudents ?? 0,
      pending:  pendingStudents  ?? 0,
    },
    submissions: {
      total: totalSubmissions ?? 0,
      today: todaySubmissions ?? 0,
    },
    avgAccuracy: avgScore,
    activeBatch,
    recentActivity: recentSubmissions ?? [],
  })
}
