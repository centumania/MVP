/**
 * POST /api/study/interaction
 *
 * Receives interaction events from HTML study-map files (node views, MCQ answers).
 * These feed the Centum Index by writing to:
 *   - node_progress  (node_opened / node_completed)
 *   - mcq_attempts   (mcq_attempt — first-attempt lock enforced here)
 *   - analytics_events (audit log — always written)
 *
 * Node FK resolution strategy: deterministic UUID from (material_id + html_node_id).
 * On first interaction with a node, a row is auto-created in `nodes` and
 * `node_assignments` (linking to the active batch with today's date).
 *
 * Body:
 *   interaction_type  'node_opened' | 'node_completed' | 'mcq_attempt'
 *   node_id           string  — HTML node's string ID (e.g. "temp-scales-node")
 *   material_id       string  — UUID of the material in the materials table
 *   session_id        string  — client-generated session UUID
 *   timestamp         string  — ISO 8601
 *   metadata          object  — interaction-specific fields (see below per type)
 *
 * metadata per type:
 *   node_opened:    { total_questions, node_type? }
 *   node_completed: { total_questions, correct_first_attempt, accuracy_pct, time_spent_seconds? }
 *   mcq_attempt:    { question_index, is_correct, node_type? }
 *
 * Returns 200 { ok: true } for all valid and invalid inputs (event loss acceptable).
 * Returns 401 for missing/invalid auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ── Deterministic UUID ────────────────────────────────────────────────────────
// Produces a stable v5-shaped UUID from any seed string.
// Used so the same HTML node always maps to the same row in `nodes`.
function seedUuid(seed: string): string {
  const h = createHash('sha256').update('centumania:html-node:v1:' + seed).digest('hex')
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '5' + h.slice(13, 16),
    ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') +
      h.slice(18, 20),
    h.slice(20, 32),
  ].join('-')
}

// ── Node-type normalisation ───────────────────────────────────────────────────
const TYPE_REMAP: Record<string, string> = {
  regular:   'recognition',
  gold:      'mastery',
  hidden:    'trap',
  trap_quiz: 'trap',
  practice:  'mastery',
}
const VALID_TYPES = new Set(['recognition', 'shortcut', 'trap', 'pyq', 'mastery'])

function resolveNodeType(raw: unknown): 'recognition' | 'shortcut' | 'trap' | 'pyq' | 'mastery' {
  const s = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (TYPE_REMAP[s]) return TYPE_REMAP[s] as never
  if (VALID_TYPES.has(s)) return s as never
  return 'recognition'
}

// ── Analytics event name mapping ──────────────────────────────────────────────
const ANALYTICS_EVENT: Record<string, string> = {
  node_opened:    'node_opened',
  node_completed: 'node_completed',
  mcq_attempt:    'mcq_completed',
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Auth: Bearer token from Authorization header
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Parse body — silently drop malformed requests
  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ ok: true })
  }

  const {
    interaction_type,
    node_id,
    material_id,
    session_id,
    timestamp,
    metadata,
  } = body as Record<string, unknown>

  // Validate required fields
  if (!['node_opened', 'node_completed', 'mcq_attempt'].includes(interaction_type as string)) {
    return NextResponse.json({ ok: true }) // unknown type — drop silently
  }
  if (typeof node_id !== 'string' || !node_id.trim()) return NextResponse.json({ ok: true })
  if (typeof material_id !== 'string' || !material_id.trim()) return NextResponse.json({ ok: true })

  const ts   = typeof timestamp === 'string' ? new Date(timestamp) : new Date()
  const meta = (metadata && typeof metadata === 'object' && !Array.isArray(metadata))
    ? metadata as Record<string, unknown>
    : {}
  const itype = interaction_type as 'node_opened' | 'node_completed' | 'mcq_attempt'

  // Deterministic node UUID: stable across all interactions for the same material+node pair
  const nodeUuid = seedUuid(material_id + ':' + node_id)
  const nodeType = resolveNodeType(meta.node_type)

  // ── 1. Auto-create node in `nodes` table ────────────────────────────────────
  // ignoreDuplicates=true: if the UUID already exists (subsequent interactions),
  // silently skip — we never overwrite an admin-created node's title/type.
  // The generated Insert type excludes `id` (every table's Insert omits the PK,
  // since it's normally DB-generated) — but upsert needs `id` here to detect the
  // conflict against our deterministic UUID. supabase-js's upsert() applies
  // excess-property checking against the exact Insert type, so no type-safe
  // intersection survives at the call site; `any` is the honest escape hatch.
  const nodeRow: Record<string, unknown> = {
    id:        nodeUuid,
    title:     typeof meta.node_title === 'string' ? meta.node_title : node_id,
    node_type: nodeType,
    content:   { material_id, html_node_id: node_id, auto_created: true } as Record<string, unknown>,
    is_active: true,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from('nodes').upsert(nodeRow as any, { onConflict: 'id', ignoreDuplicates: true })

  // ── 2. Resolve student's batch ───────────────────────────────────────────────
  const { data: batch } = await supabase
    .from('batches').select('id').eq('is_active', true).maybeSingle()

  // ── 3. Auto-assign node to active batch ─────────────────────────────────────
  // node_assignments has no unique(batch_id, node_id) constraint, so we check
  // existence before inserting to prevent duplicate rows.
  if (batch) {
    const { count } = await supabase
      .from('node_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', batch.id)
      .eq('node_id', nodeUuid)

    if ((count ?? 0) === 0) {
      await supabase.from('node_assignments').insert({
        batch_id:      batch.id,
        node_id:       nodeUuid,
        assigned_date: new Date().toISOString().split('T')[0],
      })
    }
  }

  // ── 4. Write interaction-specific rows ────────────────────────────────────────

  if (itype === 'node_opened') {
    // Upsert node_progress — set visited_at only on first visit (ignoreDuplicates)
    await supabase.from('node_progress').upsert(
      {
        user_id:      user.id,
        node_id:      nodeUuid,
        visited_at:   ts.toISOString(),
        completed_at: null,
        is_completed: false,
      },
      { onConflict: 'user_id,node_id', ignoreDuplicates: true }
    )

  } else if (itype === 'node_completed') {
    // Upsert node_progress — mark completed, preserve visited_at
    const { data: existing } = await supabase
      .from('node_progress')
      .select('visited_at')
      .eq('user_id', user.id)
      .eq('node_id', nodeUuid)
      .maybeSingle()

    await supabase.from('node_progress').upsert(
      {
        user_id:      user.id,
        node_id:      nodeUuid,
        visited_at:   existing?.visited_at ?? ts.toISOString(),
        completed_at: ts.toISOString(),
        is_completed: true,
      },
      { onConflict: 'user_id,node_id' }
    )

  } else if (itype === 'mcq_attempt') {
    const qIdx      = typeof meta.question_index === 'number' ? meta.question_index : 0
    const isCorrect = meta.is_correct === true
    // Deterministic question UUID — stable per (material, node, question index)
    const questionUuid = seedUuid(material_id + ':' + node_id + ':q' + qIdx)

    // First-attempt lock: skip if a first attempt already exists for this question
    const { count: existingAttempt } = await supabase
      .from('mcq_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('question_id', questionUuid)
      .eq('attempt_number', 1)

    if ((existingAttempt ?? 0) === 0) {
      await supabase.from('mcq_attempts').insert({
        user_id:         user.id,
        node_id:         nodeUuid,
        question_id:     questionUuid,
        attempt_number:  1,
        selected_option: typeof meta.selected_option === 'string' ? meta.selected_option : null,
        is_correct:      isCorrect,
        attempted_at:    ts.toISOString(),
      })
    }
  }

  // ── 5. Audit log — always write to analytics_events ───────────────────────────
  const eventName = ANALYTICS_EVENT[itype]
  if (eventName) {
    await supabase.from('analytics_events').insert({
      user_id:         user.id,
      session_id:      typeof session_id === 'string' ? session_id : null,
      event_name:      eventName,
      event_timestamp: ts.toISOString(),
      metadata: {
        material_id,
        html_node_id: node_id,
        node_uuid:    nodeUuid,
        ...meta,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
