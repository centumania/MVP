'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim(), phone },
          // After confirming email, redirect to callback route
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please log in.')
        } else {
          setError(authError.message)
        }
        return
      }

      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-carbon flex flex-col justify-center px-6 py-12">
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="text-5xl mb-6">✉️</div>
          <h2 className="font-headline text-3xl text-gold mb-3">CHECK YOUR EMAIL</h2>
          <p className="text-muted text-base leading-relaxed">
            We sent a confirmation link to <span className="text-offwhite">{email}</span>.
            Click the link to activate your account.
          </p>
          <p className="text-muted text-sm mt-4">
            After confirming, contact your coordinator to complete payment and get access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-carbon flex flex-col justify-center px-6 py-12">

      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="font-headline text-5xl text-gold tracking-wider">
          CENTUMANIA
        </h1>
        <p className="text-muted text-sm mt-1 font-subheading tracking-widest uppercase">
          Winning is a habit
        </p>
      </div>

      <div className="w-full max-w-sm mx-auto">
        <h2 className="font-subheading text-2xl font-semibold text-offwhite mb-6 uppercase tracking-wide">
          Register
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-muted mb-1.5 font-subheading uppercase tracking-wide">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-offwhite placeholder-muted focus:outline-none focus:border-gold transition-colors"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm text-muted mb-1.5 font-subheading uppercase tracking-wide">
              Mobile Number
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              required
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-offwhite placeholder-muted focus:outline-none focus:border-gold transition-colors"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-muted mb-1.5 font-subheading uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-offwhite placeholder-muted focus:outline-none focus:border-gold transition-colors"
              placeholder="yourname@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-muted mb-1.5 font-subheading uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-offwhite placeholder-muted focus:outline-none focus:border-gold transition-colors"
              placeholder="Min 8 characters"
            />
          </div>

          {error && (
            <p className="text-error text-sm bg-error/10 border border-error/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-carbon font-subheading font-bold uppercase tracking-widest py-3.5 rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base mt-2"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gold hover:text-gold-dark transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
