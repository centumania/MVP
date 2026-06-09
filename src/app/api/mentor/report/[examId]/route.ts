/**
 * GET /api/mentor/report/:examId
 *
 * Returns the stored AI Mentor Report for the authenticated student's
 * submission of the given exam.
 *
 * Security: requires valid JWT. Students can only access their own reports.
 * Admin client used to bypass RLS (auth check is manual).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  try {
    // ── Auth ────────────────────────────────────────────────────────
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = await params

    // ── Fetch report ────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', user.id)   // students can only read their own
      .maybeSingle()

    if (error) {
      console.error('[mentor/report] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Report not ready yet. Please try again in a moment.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ report: data })

  } catch (err) {
    console.error('[mentor/report] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
