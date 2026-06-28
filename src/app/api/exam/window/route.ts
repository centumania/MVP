/**
 * GET /api/exam/window
 *
 * Returns whether the daily exam window is currently open.
 *
 * This route is intentionally unauthenticated — it returns only timing
 * metadata, not exam content. Students, prospective students, and the
 * dashboard can all call it without a session.
 *
 * Critical invariants:
 *   1. Time is ALWAYS sourced from the server. Client clock is never trusted.
 *   2. The response is NEVER cached. A stale "isOpen: true" response after
 *      the window closes would allow students to believe they can still submit.
 *   3. Exam content (questions, correct answers) is NOT included here.
 *   4. On DB failure, the window is treated as CLOSED (fail-safe, not fail-open).
 */

import { NextResponse }          from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { getTodayInIST, getExamWindowStatus, IST_OFFSET_MS } from '@/src/lib/exam-window'
import type { ExamWindowStatus }  from '@/src/types/database'

/**
 * Disable all caching for this route.
 *
 * Without this, Next.js or Vercel's CDN may cache a response and serve
 * a stale "isOpen: true" to students after the window has closed. That
 * would be a correctness bug with direct impact on student fairness.
 */
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/** Headers applied to every response from this route. */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma':        'no-cache',
} as const

/**
 * Returns a well-typed "window closed" status for error and no-exam cases.
 * Fail-safe: when in doubt, report the window as closed.
 *
 * Accepts `now` so every response in the handler uses the single time value
 * captured at the top of GET() — not a second Date.now() call made later.
 * Uses IST_OFFSET_MS from the shared constant, not a duplicated magic number.
 */
function closedResponse(now: Date, message: string): ExamWindowStatus {
  return {
    isOpen:        false,
    opensIn:       null,
    closesIn:      null,
    message,
    serverTimeIST: new Date(now.getTime() + IST_OFFSET_MS)
      .toISOString()
      .replace('Z', '+05:30'),
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse<ExamWindowStatus>> {
  // Capture server time BEFORE the try block — new Date() never throws,
  // and every code path (success + all error paths) needs this same value.
  const now = new Date()

  try {
    // ── 1. Find the active batch ─────────────────────────────────────────
    //
    // Fix: without this filter, two batches with overlapping exam_dates
    // (e.g. LDC Day 25 and UDC Day 1 on the same calendar date) would
    // cause maybeSingle() to error. The active batch narrows the exam
    // query to exactly one cohort.
    //
    // We use the admin/service-role client because this endpoint is public —
    // no auth session exists to satisfy the RLS policies on exams/batches.
    // The data returned (timing only) is non-sensitive.
    const supabase = getSupabaseAdminClient()
    const todayIST = getTodayInIST(now)

    const { data: activeBatch, error: batchError } = await supabase
      .from('batches')
      .select('id, total_days')
      .eq('is_active', true)
      .order('starts_on', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (batchError) {
      console.error('[exam/window] Batch query failed:', {
        message: batchError.message,
        code:    batchError.code,
      })
      return NextResponse.json(
        closedResponse(now, 'Unable to retrieve exam schedule. Please try again shortly.'),
        { status: 503, headers: NO_CACHE_HEADERS },
      )
    }

    if (!activeBatch) {
      return NextResponse.json(
        closedResponse(now, 'No active exam batch found.'),
        { status: 200, headers: NO_CACHE_HEADERS },
      )
    }

    // ── 2. Find today's active exam within the active batch ──────────────
    //
    // Selecting only the columns this handler needs.
    // day_number is required to detect the final cohort day (Fix: Day 25).
    // title and is_active intentionally excluded — unused and redundant.
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, open_time, close_time, day_number')
      .eq('batch_id', activeBatch.id)
      .eq('exam_date', todayIST)
      .eq('is_active', true)
      .maybeSingle()

    if (examError) {
      console.error('[exam/window] Exam query failed:', {
        message:  examError.message,
        code:     examError.code,
        batchId:  activeBatch.id,
        todayIST,
      })
      return NextResponse.json(
        closedResponse(now, 'Unable to retrieve exam schedule. Please try again shortly.'),
        { status: 503, headers: NO_CACHE_HEADERS },
      )
    }

    if (!exam) {
      return NextResponse.json(
        closedResponse(now, 'No exam is scheduled for today.'),
        { status: 200, headers: NO_CACHE_HEADERS },
      )
    }

    // ── 3. Parse and validate timestamps ────────────────────────────────
    //
    // Supabase returns timestamptz as ISO 8601 strings (UTC, Z suffix).
    // new Date() correctly parses these on all JS runtimes.
    const openTime  = new Date(exam.open_time)
    const closeTime = new Date(exam.close_time)

    if (isNaN(openTime.getTime()) || isNaN(closeTime.getTime())) {
      console.error('[exam/window] Invalid open_time or close_time in exam row:', {
        examId:    exam.id,
        openTime:  exam.open_time,
        closeTime: exam.close_time,
      })
      return NextResponse.json(
        closedResponse(now, 'Exam schedule data is invalid. Please contact support.'),
        { status: 500, headers: NO_CACHE_HEADERS },
      )
    }

    // ── 4. Calculate and return window status ────────────────────────────
    //
    // isLastDay: when the window closes on Day 25, there is no "next exam".
    // getExamWindowStatus uses this to suppress the opensIn countdown and
    // return a cohort-end message instead of a wrong "opens in 20 hours".
    const isLastDay = exam.day_number === activeBatch.total_days

    const status = getExamWindowStatus(now, openTime, closeTime, isLastDay)

    return NextResponse.json(status, {
      status:  200,
      headers: NO_CACHE_HEADERS,
    })

  } catch (err) {
    // Catches synchronous throws (e.g. missing SUPABASE_SERVICE_ROLE_KEY env var)
    // and any unexpected runtime errors not covered by the Supabase error paths.
    // Logged server-side only — nothing internal is exposed to the client.
    console.error('[exam/window] Unhandled exception:', err)
    return NextResponse.json(
      closedResponse(now, 'An unexpected error occurred. Please try again shortly.'),
      { status: 500, headers: NO_CACHE_HEADERS },
    )
  }
}
