import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

/**
 * POST /api/auth/register
 *
 * Creates a new user with email_confirm: true so no confirmation email
 * is sent — bypasses Supabase free-tier email rate limit entirely.
 *
 * Admin manually controls access via payment_verified in the profiles table.
 * Email verification adds no security value for this flow.
 */
export async function POST(req: Request) {
  try {
    const { name, phone, email, password } = await req.json()

    // Basic server-side validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 })
    }
    if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 })
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Create user with email pre-confirmed — no email sent, no rate limit
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), phone },
    })

    if (error) {
      // Surface friendly messages for common cases
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ userId: data.user?.id })
  } catch {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
