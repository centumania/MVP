/**
 * Exam Window Logic — Pure Functions
 *
 * All functions here are pure and side-effect free.
 * They have zero knowledge of HTTP, databases, or Next.js.
 * This is intentional: pure functions are fully unit-testable.
 *
 * IST = UTC+5:30. India does NOT observe Daylight Saving Time — ever.
 * The offset is a fixed constant, not a lookup from a timezone database.
 * This makes the logic portable and independent of system TZ configuration.
 * Production servers (Vercel) run in UTC. Never assume otherwise.
 */

import type { ExamWindowStatus } from '@/src/types/database'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** India Standard Time offset from UTC. Fixed — no DST. */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // 19_800_000 ms

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Returns today's date string in IST as "YYYY-MM-DD".
 *
 * Why not use `new Date().toLocaleDateString('en-IN')`?
 * Because that relies on the runtime's locale and TZ settings,
 * which vary across environments. Explicit arithmetic is always correct.
 *
 * Example: At 23:45 UTC on June 3, it is 05:15 IST on June 4.
 * This function correctly returns "2026-06-04".
 */
export function getTodayInIST(now: Date = new Date()): string {
  const istMs = now.getTime() + IST_OFFSET_MS
  const istDate = new Date(istMs)
  // toISOString() is always UTC — adding IST_OFFSET_MS makes the UTC
  // representation equal to the IST wall-clock time.
  return istDate.toISOString().slice(0, 10) // "YYYY-MM-DD"
}

/**
 * Formats a millisecond duration as a human-readable string.
 *
 * Granularity rules (optimised for exam countdown UX):
 *   ≥ 1 hour:         "X hours Y minutes"  (seconds hidden — irrelevant)
 *   5–59 minutes:     "X minutes"          (seconds hidden — irrelevant)
 *   < 5 minutes:      "X minutes Y seconds" (seconds shown — urgency matters)
 *   < 1 minute:       "Y seconds"
 *   ≤ 0:              "0 seconds"
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0 seconds'

  const totalSeconds = Math.floor(ms / 1000)
  const hours        = Math.floor(totalSeconds / 3600)
  const minutes      = Math.floor((totalSeconds % 3600) / 60)
  const seconds      = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
  }

  // Show seconds only when under 5 minutes — adds urgency without noise
  if (hours === 0 && minutes < 5 && seconds > 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`)
  }

  return parts.length > 0 ? parts.join(' ') : 'less than a second'
}

/**
 * Computes the exam window status given the current time and the exam's
 * scheduled open/close times.
 *
 * Boundary semantics (deliberate, documented):
 *   now === open_time  → window IS open  (inclusive lower bound)
 *   now === close_time → window IS closed (exclusive upper bound — hard close)
 *
 * The "opens tomorrow" calculation uses open_time + 24h as an approximation.
 * This is correct for CentuMania's single daily schedule (all exams at 6:00 AM IST).
 * If future batches use variable schedules, this should query the next exam row instead.
 *
 * @param now       Current server time (UTC). Caller supplies this for testability.
 * @param openTime  Exam open timestamp (parsed from DB timestamptz → Date).
 * @param closeTime Exam close timestamp (parsed from DB timestamptz → Date).
 */
export function getExamWindowStatus(
  now: Date,
  openTime: Date,
  closeTime: Date,
  isLastDay = false,
): ExamWindowStatus {
  const nowMs    = now.getTime()
  const openMs   = openTime.getTime()
  const closeMs  = closeTime.getTime()

  // Represent current time as IST for the response (debugging + client display)
  const serverTimeIST = new Date(nowMs + IST_OFFSET_MS)
    .toISOString()
    .replace('Z', '+05:30')

  // --- Window is currently OPEN ---
  if (nowMs >= openMs && nowMs < closeMs) {
    const closesInMs = closeMs - nowMs
    const closesIn   = formatDuration(closesInMs)

    return {
      isOpen:   true,
      opensIn:  null,
      closesIn,
      message:  `Exam is LIVE. Closes in ${closesIn}.`,
      serverTimeIST,
    }
  }

  // --- Window has NOT opened yet today ---
  if (nowMs < openMs) {
    const opensInMs = openMs - nowMs
    const opensIn   = formatDuration(opensInMs)

    return {
      isOpen:   false,
      opensIn,
      closesIn: null,
      message:  `Exam opens in ${opensIn}. Be ready.`,
      serverTimeIST,
    }
  }

  // --- Window has CLOSED for today (nowMs >= closeMs) ---

  // Day 25 is the final exam of the cohort — there is no tomorrow.
  // Returning opensIn with a +24h estimate would be factually wrong.
  if (isLastDay) {
    return {
      isOpen:   false,
      opensIn:  null,
      closesIn: null,
      message:  "Today's exam window has closed. This was the final exam of the cohort. Well done.",
      serverTimeIST,
    }
  }

  // Approximate next open as open_time + 24 hours.
  // Valid assumption: all CentuMania exams open at 6:00 AM IST daily.
  const nextOpenMs = openMs + 24 * 60 * 60 * 1000
  const opensInMs  = nextOpenMs - nowMs
  const opensIn    = formatDuration(opensInMs)

  return {
    isOpen:   false,
    opensIn,
    closesIn: null,
    message:  `Today's exam window has closed. Next exam opens in ${opensIn}.`,
    serverTimeIST,
  }
}
