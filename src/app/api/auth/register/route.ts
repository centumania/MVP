import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/src/lib/supabase/server'
import { rateLimit } from '@/src/lib/rate-limit'

/**
 * POST /api/auth/register
 *
 * Creates a new user with email_confirm: true so no confirmation email
 * is sent — bypasses Supabase free-tier email rate limit entirely.
 *
 * Admin manually controls access via payment_verified in the profiles table.
 * Auto-assigns a sequential registration_number (CM2026001, CM2026002, …).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limiter = await rateLimit(`register:${ip}`, { limit: 5, window: '15 m' })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limiter.reset - Date.now()) / 1000)) } },
      )
    }

    const { name, phone, email, password } = await req.json()

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

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), phone },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user?.id) {
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('registration_number', 'is', null)

      const nextSeq = (count ?? 0) + 1
      const registrationNumber = `CM${year}${String(nextSeq).padStart(3, '0')}`

      await supabase
        .from('profiles')
        .update({ registration_number: registrationNumber })
        .eq('id', data.user.id)
    }

    return NextResponse.json({ userId: data.user?.id })
  } catch {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
