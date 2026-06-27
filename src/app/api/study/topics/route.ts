/**
 * GET /api/study/topics
 *
 * Returns the authenticated student's per-topic accuracy from
 * student_topic_accuracy, sorted weakest-first.
 *
 * Response:
 *   { topics: { topic, total_attempted, total_correct, accuracy_pct }[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rows, error } = await supabase
    .from('student_topic_accuracy')
    .select('topic, total_attempted, total_correct, last_updated')
    .eq('user_id', user.id)
    .order('total_attempted', { ascending: false })

  if (error) {
    console.error('[study/topics] Query failed:', error)
    return NextResponse.json({ error: 'Failed to load topics' }, { status: 500 })
  }

  const topics = (rows ?? []).map(r => ({
    topic:           r.topic,
    total_attempted: r.total_attempted,
    total_correct:   r.total_correct,
    accuracy_pct:    r.total_attempted > 0
      ? Math.round((r.total_correct / r.total_attempted) * 100)
      : 0,
    last_updated: r.last_updated,
  })).sort((a, b) => a.accuracy_pct - b.accuracy_pct) // weakest first

  return NextResponse.json({ topics })
}
