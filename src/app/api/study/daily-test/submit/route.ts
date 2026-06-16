/**
 * POST /api/study/daily-test/submit
 *
 * Records a student's study-quiz score for today (IST calendar date).
 * Score is client-reported; the server validates bounds only.
 * test_date and in_morning_window are computed server-side — the client
 * never supplies either field.
 *
 * No submission window gate. Students may submit any time of day.
 * in_morning_window is a label (06:00–08:29 IST), not a gate.
 *
 * Security gates (in order):
 *   1. Valid JWT
 *   2. payment_verified = true
 *   3. material exists
 *   4. 0 ≤ score ≤ total ≤ 200 (bound-check)
 *   5. UNIQUE(user_id, test_date) enforced at DB level — first submission wins
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { IST_OFFSET_MS } from '@/src/lib/exam-window'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ─────────────────────────────────────────────────────
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Parse body ────────────────────────────────────────────────
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { material_id, score, total, time_taken_s } =
      body as Record<string, unknown>

    if (typeof material_id !== 'string' || !material_id) {
      return NextResponse.json({ error: 'material_id is required' }, { status: 400 })
    }

    const scoreNum = Number(score)
    const totalNum = Number(total)
    const timeNum  = typeof time_taken_s === 'number' ? Math.floor(time_taken_s) : null

    // ── 3. Bound-checks ──────────────────────────────────────────────
    // HARDENING POINT: if real stakes (cashback, prizes) attach to this endpoint,
    // replace the checks below with server-side answer recomputation: fetch the
    // material's question list, receive submitted answers (not just a score), and
    // compute score here. The current design trusts the client's score integer.
    if (!Number.isInteger(scoreNum) || !Number.isInteger(totalNum)) {
      return NextResponse.json({ error: 'score and total must be integers' }, { status: 400 })
    }
    if (totalNum <= 0 || totalNum > 200) {
      return NextResponse.json(
        { error: 'total must be between 1 and 200' },
        { status: 400 },
      )
    }
    if (scoreNum < 0 || scoreNum > totalNum) {
      return NextResponse.json(
        { error: 'score must be between 0 and total' },
        { status: 400 },
      )
    }

    // ── 4. Payment gate ──────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('payment_verified')
      .eq('id', user.id)
      .single()

    if (!profile?.payment_verified) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // ── 5. Validate material exists ──────────────────────────────────
    const { data: material } = await supabase
      .from('materials')
      .select('id')
      .eq('id', material_id)
      .maybeSingle()

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // ── 6. Compute test_date and in_morning_window — server-side IST ─
    // Both values come from one UTC timestamp; the client supplies neither.
    // Using the same IST_OFFSET_MS constant and pattern as src/lib/exam-window.ts.
    const nowUtc   = new Date()
    const nowIstMs = nowUtc.getTime() + IST_OFFSET_MS
    const nowIst   = new Date(nowIstMs)

    // IST calendar date as YYYY-MM-DD
    const testDate = nowIst.toISOString().slice(0, 10)

    // getUTCHours/Minutes on (UTC + IST_OFFSET) gives IST wall-clock.
    // India has no DST; this arithmetic is always correct.
    const istMinutesFromMidnight = nowIst.getUTCHours() * 60 + nowIst.getUTCMinutes()

    // 06:00 = 360 min; 08:30 = 510 min (exclusive — 08:30:00 sharp is not morning)
    const inMorningWindow = istMinutesFromMidnight >= 360 && istMinutesFromMidnight < 510

    // ── 7. Insert ────────────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from('daily_test_scores')
      .insert({
        user_id:           user.id,
        material_id,
        test_date:         testDate,
        score:             scoreNum,
        total:             totalNum,
        in_morning_window: inMorningWindow,
        time_taken_s:      timeNum,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint: student already submitted today. First submission wins.
        return NextResponse.json({ error: 'Already submitted today' }, { status: 409 })
      }
      console.error('[daily-test/submit] Insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
    }

    return NextResponse.json({
      ok:                true,
      test_date:         testDate,
      in_morning_window: inMorningWindow,
    })

  } catch (err) {
    console.error('[daily-test/submit] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
