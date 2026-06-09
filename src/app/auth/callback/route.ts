/**
 * GET /auth/callback
 *
 * Fallback handler for Supabase email-confirmation redirects that still
 * point here (e.g. old emails in users' inboxes before we changed
 * emailRedirectTo to point directly to /auth/confirm).
 *
 * New registrations send emailRedirectTo → /auth/confirm directly,
 * avoiding this extra server hop (better for mobile cross-browser scenarios).
 *
 * This route is kept for backward compatibility.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code        = searchParams.get('code')
  const error       = searchParams.get('error')
  const errorDesc   = searchParams.get('error_description')
  const type        = searchParams.get('type') // 'signup' | 'recovery' | 'magiclink'

  // Supabase may redirect here with an error (expired link, etc.)
  if (error) {
    const msg = errorDesc ?? 'Link expired. Please try again.'
    // For recovery (password reset), send back to forgot-password
    if (type === 'recovery') {
      return NextResponse.redirect(
        `${origin}/auth/forgot-password?message=${encodeURIComponent(msg)}`
      )
    }
    return NextResponse.redirect(
      `${origin}/auth/confirm?message=${encodeURIComponent(msg)}`
    )
  }

  if (!code) {
    // No code — let /auth/confirm try the hash-based (implicit) flow
    return NextResponse.redirect(`${origin}/auth/confirm`)
  }

  // For password recovery, forward to reset-password page with code
  if (type === 'recovery') {
    return NextResponse.redirect(
      `${origin}/auth/reset-password?code=${encodeURIComponent(code)}`
    )
  }

  // For email verification (signup / magiclink), forward to confirm page
  return NextResponse.redirect(
    `${origin}/auth/confirm?code=${encodeURIComponent(code)}`
  )
}
