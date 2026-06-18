/**
 * GET /api/admin/scoreboard
 *
 * Admin-only. Returns daily attendance and per-student progress for the
 * study-quiz leaderboard. Uses the service-role key — bypasses RLS.
 *
 * Requires: valid JWT + is_admin = true.
 *
 * Response shape:
 * {
 *   date:      string        // today's IST date YYYY-MM-DD
 *   attendees: {             // submitted today, sorted by score desc
 *     user_id, name, phone, score, total, time_taken_s,
 *     in_morning_window, submitted_at
 *   }[]
 *   absent: {                // payment_verified, not submitted today
 *     user_id, name, phone, email
 *   }[]
 *   history: {               // last 7 IST days, all students
 *     user_id, test_date, score, total, in_morning_window
 *   }[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { IST_OFFSET_MS } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // ── 1. Auth + admin gate ─────────────────────────────────────────
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── 2. Date range in IST ─────────────────────────────────────────
    const nowIstMs       = Date.now() + IST_OFFSET_MS
    const todayIST       = new Date(nowIstMs).toISOString().slice(0, 10)
    const sevenDaysAgoMs = nowIstMs - 7 * 24 * 60 * 60 * 1000
    const sevenDaysAgoIST = new Date(sevenDaysAgoMs).toISOString().slice(0, 10)

    // ── 3. Parallel queries ──────────────────────────────────────────
    const [todayResult, enrolledResult, historyResult] = await Promise.all([
      supabase
        .from('daily_test_scores')
        .select('user_id, score, total, time_taken_s, in_morning_window, submitted_at')
        .eq('test_date', todayIST),

      supabase
        .from('profiles')
        .select('id, name, phone, email')
        .eq('payment_verified', true)
        .eq('is_admin', false)
        .order('name'),

      supabase
        .from('daily_test_scores')
        .select('user_id, test_date, score, total, in_morning_window')
        .gte('test_date', sevenDaysAgoIST)
        .order('test_date', { ascending: false }),
    ])

    if (todayResult.error) {
      console.error('[admin/scoreboard] today query failed:', todayResult.error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }
    if (enrolledResult.error) {
      console.error('[admin/scoreboard] enrolled query failed:', enrolledResult.error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }
    if (historyResult.error) {
      console.error('[admin/scoreboard] history query failed:', historyResult.error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    // ── 4. Build response ────────────────────────────────────────────
    const todayRows  = todayResult.data  ?? []
    const enrolled   = enrolledResult.data ?? []
    const history    = historyResult.data  ?? []

    const submittedIds = new Set(todayRows.map((r) => r.user_id))
    const profileMap   = Object.fromEntries(enrolled.map((p) => [p.id, p]))

    const attendees = todayRows
      .map((r) => ({
        user_id:           r.user_id,
        name:              profileMap[r.user_id]?.name  ?? 'Unknown',
        phone:             profileMap[r.user_id]?.phone ?? null,
        score:             r.score,
        total:             r.total,
        time_taken_s:      r.time_taken_s,
        in_morning_window: r.in_morning_window,
        submitted_at:      r.submitted_at,
      }))
      .sort((a, b) => b.score - a.score)

    const absent = enrolled
      .filter((p) => !submittedIds.has(p.id))
      .map((p) => ({
        user_id: p.id,
        name:    p.name,
        phone:   p.phone,
        email:   p.email,
      }))

    return NextResponse.json({
      date: todayIST,
      attendees,
      absent,
      history,
    })

  } catch (err) {
    console.error('[admin/scoreboard] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
