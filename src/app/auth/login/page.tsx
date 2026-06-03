'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        // Supabase returns generic messages — translate to Tamil-friendly English
        if (authError.message.includes('Invalid login')) {
          setError('Incorrect email or password. Please try again.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox.')
        } else {
          setError(authError.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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

      {/* Card */}
      <div className="w-full max-w-sm mx-auto">
        <h2 className="font-subheading text-2xl font-semibold text-offwhite mb-6 uppercase tracking-wide">
          Log In
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-offwhite placeholder-muted focus:outline-none focus:border-gold transition-colors"
              placeholder="••••••••"
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
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          New student?{' '}
          <Link href="/auth/register" className="text-gold hover:text-gold-dark transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
