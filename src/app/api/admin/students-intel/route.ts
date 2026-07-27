/**
 * GET /api/admin/students-intel
 *
 * Rajan's student-monitoring brain — the roster + at-risk flags for the admin
 * page. The computation lives in src/lib/growth/intel.ts so the daily-nudge cron
 * judges "at-risk" with the exact same logic. Read-only, admin-gated.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/admin'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { computeStudentIntel } from '@/src/lib/growth/intel'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (ctx instanceof NextResponse) return ctx

  const db = getSupabaseAdminClient()
  const { students, summary } = await computeStudentIntel(db)
  return NextResponse.json({ generatedAt: new Date().toISOString(), summary, students })
}
