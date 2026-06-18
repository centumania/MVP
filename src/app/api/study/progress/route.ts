/**
 * GET /api/study/progress?material_id=day-1-bio
 *
 * Returns per-student metrics for a specific material, computed from
 * analytics_events (written by /api/study/interaction via centumania-tracker.js).
 *
 * Response:
 *   nodes_completed    number   — unique nodes the student marked complete
 *   total_nodes        number   — from materials catalog (null if not set)
 *   first_accuracy_pct number   — MCQ first-attempt correct %
 *   xp                 number   — simple XP formula
 *   mode_unlock        string   — 'study' | 'revise' | 'quiz'
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getMaterialById } from '@/src/data/materials'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const materialId = request.nextUrl.searchParams.get('material_id')
  if (!materialId) return NextResponse.json({ error: 'material_id required' }, { status: 400 })

  const material = getMaterialById(materialId)

  // ── Node completions ──────────────────────────────────────────────
  const { data: completedRows } = await supabase
    .from('analytics_events')
    .select('metadata')
    .eq('user_id', user.id)
    .eq('event_name', 'node_completed')
    .filter('metadata->>material_id', 'eq', materialId)

  const nodesCompleted = new Set(
    (completedRows ?? []).map((r: { metadata: Record<string, unknown> }) => r.metadata?.html_node_id).filter(Boolean)
  ).size

  // ── MCQ first-attempt accuracy ────────────────────────────────────
  // analytics_events stores is_correct in metadata for mcq_completed events
  const { data: mcqRows } = await supabase
    .from('analytics_events')
    .select('metadata')
    .eq('user_id', user.id)
    .eq('event_name', 'mcq_completed')
    .filter('metadata->>material_id', 'eq', materialId)

  const mcqTotal   = mcqRows?.length ?? 0
  const mcqCorrect = (mcqRows ?? []).filter(
    (r: { metadata: Record<string, unknown> }) => r.metadata?.is_correct === true
  ).length
  const accuracyPct = mcqTotal > 0 ? Math.round(mcqCorrect / mcqTotal * 100) : 0

  // ── XP (simple) ───────────────────────────────────────────────────
  const xp = nodesCompleted * 10 + mcqCorrect * 2

  // ── Mode unlock ───────────────────────────────────────────────────
  const totalNodes = material?.totalNodes ?? null
  let modeUnlock: 'study' | 'revise' | 'quiz' = 'study'

  if (totalNodes && totalNodes > 0) {
    const ratio = nodesCompleted / totalNodes
    if (ratio >= 0.5) modeUnlock = 'revise'
    if (ratio >= 1.0 && accuracyPct >= 60) modeUnlock = 'quiz'
  } else if (nodesCompleted >= 20) {
    // fallback when totalNodes isn't in catalog
    modeUnlock = 'revise'
  }

  return NextResponse.json({
    nodes_completed:    nodesCompleted,
    total_nodes:        totalNodes,
    first_accuracy_pct: accuracyPct,
    xp,
    mode_unlock:        modeUnlock,
  })
}
