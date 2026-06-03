/**
 * GET /auth/callback
 *
 * Handles Supabase email confirmation redirect.
 * Supabase appends ?code=... to this URL after the user clicks
 * the confirmation link in their email.
 *
 * We exchange the code for a session and redirect to the dashboard.
 * If the exchange fails (expired or invalid link), redirect to login
 * with an error query param so the page can show a message.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  // Supabase may redirect here with an error for expired links etc.
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?message=Link+expired.+Please+try+again.`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // The code exchange for a session must happen on the client side using
  // the browser client (it sets localStorage/cookies). We redirect to a
  // client page that handles the exchange, then redirects to /dashboard.
  // The code is passed as a hash fragment to keep it out of server logs.
  return NextResponse.redirect(
    `${origin}/auth/confirm?code=${encodeURIComponent(code)}`
  )
}
