/**
 * GET /api/mentor/history/:studentId
 *
 * Returns the 20 most recent AI Mentor Report summaries for a student.
 * Used for score trend and history view on the dashboard.
 *
 * Security: a student can only fetch their own history.
 *           Admins can fetch any student's history.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
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

    const { studentId } = await params

    // Students can only query their own history
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin && user.id !== studentId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Fetch history ───────────────────────────────────────────────
    const { data, error } = await supabase
      .from('ai_reports')
      .select('id, exam_id, readiness_score, predicted_low, predicted_high, learning_profile, generated_at')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[mentor/history] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return NextResponse.json({ history: data ?? [] })

  } catch (err) {
    console.error('[mentor/history] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
