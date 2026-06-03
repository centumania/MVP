/**
 * Supabase Reusable Helper Functions
 *
 * All helpers are server-safe (no 'use client').
 * Import in API routes, Server Components, or server actions.
 */

import { getSupabaseServerClient, getSupabaseAdminClient } from './server'

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Get the currently authenticated user from a JWT access token.
 * Pass the Authorization header value from the incoming request.
 *
 * Usage in API route:
 *   const token = req.headers.get('Authorization')?.replace('Bearer ', '')
 *   const user = await getUserFromToken(token)
 */
export async function getUserFromToken(accessToken: string | undefined | null) {
  if (!accessToken) return null

  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) return null
  return data.user
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a student profile by user ID.
 * Returns null if not found or query fails.
 */
export async function getProfileById(userId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

/**
 * Check if a user is payment-verified and enrolled.
 * Used as a gate before serving any protected content.
 */
export async function isPaymentVerified(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId)
  return profile?.payment_verified === true
}

/**
 * Check if a user has admin privileges.
 * Used to protect admin API routes.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId)
  return profile?.is_admin === true
}

// ---------------------------------------------------------------------------
// Exam helpers
// ---------------------------------------------------------------------------

/**
 * Get the exam for a given day number.
 * Returns null if no exam exists for that day.
 */
export async function getExamByDay(dayNumber: number) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('day_number', dayNumber)
    .single()

  if (error) return null
  return data
}

/**
 * Check if a student has already submitted for a given exam.
 * Prevents double-submission (also enforced at DB level via UNIQUE constraint).
 */
export async function hasAlreadySubmitted(userId: string, examId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  const { data } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .maybeSingle()

  return data !== null
}

// ---------------------------------------------------------------------------
// Material helpers
// ---------------------------------------------------------------------------

/**
 * Get today's published material that has not expired.
 * Returns null if material doesn't exist or has expired (24hr window).
 */
export async function getActiveMaterial(dayNumber: number) {
  const supabase = getSupabaseServerClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('day_number', dayNumber)
    .gt('expires_at', now)  // 24hr expiry check — server-side
    .single()

  if (error) return null
  return data
}

// ---------------------------------------------------------------------------
// Leaderboard helpers
// ---------------------------------------------------------------------------

/**
 * Fetch top N leaderboard entries plus the requesting user's entry.
 * Uses the leaderboard view in Supabase.
 */
export async function getLeaderboard(limit = 100) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) return []
  return data
}

/**
 * Get the rank of a specific user from the leaderboard view.
 */
export async function getUserRank(userId: string) {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

// ---------------------------------------------------------------------------
// Admin helpers (service role — bypass RLS)
// ---------------------------------------------------------------------------

/**
 * Mark a user's payment as verified.
 * Called by Razorpay webhook after successful payment confirmation.
 * Uses admin client — bypasses RLS.
 */
export async function markPaymentVerified(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ payment_verified: true })
    .eq('id', userId)

  return !error
}
