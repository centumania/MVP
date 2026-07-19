/**
 * /api/classroom/progress
 *
 * Dedicated per-student classroom metrics (separate from the shared study
 * event log). Backs the classroom's completion ticks + progress bars with a
 * clean, queryable per-(student, lesson) row, and syncs completion across
 * devices. Additive — the /api/events + /api/study/interaction flow is
 * unchanged and keeps recording engagement.
 *
 *   POST  { lesson_id, subject?, action: 'open'|'complete'|'uncomplete', time_spent_ms? }
 *   GET   → { completed: string[], rows: [...] } for the signed-in student
 *
 * Auth: Bearer JWT. Writes via the service-role client with an explicit
 * user_id; the table's RLS still restricts any direct REST access to own rows.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Action = 'open' | 'complete' | 'uncomplete'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json().catch(() => ({}))) as
      { lesson_id?: unknown; subject?: unknown; action?: unknown; time_spent_ms?: unknown }

    const lesson_id = typeof body.lesson_id === 'string' ? body.lesson_id.slice(0, 80) : ''
    if (!lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    const subject = typeof body.subject === 'string' ? body.subject.slice(0, 60) : null
    const action: Action = body.action === 'complete' || body.action === 'uncomplete' ? body.action : 'open'
    const dt = typeof body.time_spent_ms === 'number' && Number.isFinite(body.time_spent_ms)
      ? Math.max(0, Math.min(body.time_spent_ms, 86_400_000)) : 0

    // classroom_progress is intentionally outside the generated Database types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const now = new Date().toISOString()

    const { data: existing } = await db.from('classroom_progress')
      .select('id, time_spent_ms, open_count, status')
      .eq('user_id', user.id).eq('lesson_id', lesson_id).maybeSingle()

    if (!existing) {
      await db.from('classroom_progress').insert({
        user_id: user.id, lesson_id, subject,
        status: action === 'complete' ? 'completed' : 'opened',
        opened_at: now, completed_at: action === 'complete' ? now : null,
        time_spent_ms: dt, open_count: 1, updated_at: now,
      })
    } else {
      const status = action === 'complete' ? 'completed' : action === 'uncomplete' ? 'opened' : existing.status
      await db.from('classroom_progress').update({
        ...(subject ? { subject } : {}),
        status,
        ...(action === 'complete' ? { completed_at: now } : action === 'uncomplete' ? { completed_at: null } : {}),
        time_spent_ms: (existing.time_spent_ms ?? 0) + dt,
        open_count: (existing.open_count ?? 0) + (action === 'open' ? 1 : 0),
        updated_at: now,
      }).eq('id', existing.id)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // best-effort — never block the lesson UI
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ completed: [], rows: [] })

    const supabase = getSupabaseAdminClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ completed: [], rows: [] })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data } = await db.from('classroom_progress')
      .select('lesson_id, subject, status, time_spent_ms, completed_at')
      .eq('user_id', user.id)

    const rows = (data ?? []) as { lesson_id: string; status: string }[]
    const completed = rows.filter(r => r.status === 'completed').map(r => r.lesson_id)
    return NextResponse.json({ completed, rows })
  } catch {
    return NextResponse.json({ completed: [], rows: [] })
  }
}
