'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { LogoFull } from '@/src/components/ui/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: authError } = await getSupabaseBrowserClient()
        .auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

      if (authError) {
        setError(authError.message)
        return
      }
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0e1410' }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)', boxShadow: '0 0 24px rgba(74,222,128,0.12)' }}>
            <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Reset link sent
          </h2>
          <p className="text-sm text-text-muted mb-2">
            We sent a password reset link to{' '}
            <span className="font-semibold text-text">{email}</span>
          </p>
          <p className="text-sm text-text-muted mb-8">
            Check your inbox and click the link to set a new password. The link expires in 1 hour.
          </p>
          <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            Back to sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0e1410' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10">
          <LogoFull size={24} glow />
          <span className="text-[10px] text-text-muted font-mono tracking-wide block mt-1 pl-0.5">Winning is a Habit</span>
        </div>

        {/* Back link */}
        <Link href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-8 font-mono">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to sign in
        </Link>

        <h1 className="text-3xl font-bold text-text tracking-tight mb-1.5"
          style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Forgot password?
        </h1>
        <p className="text-sm mb-8 text-text-muted">
          Enter your registered email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
              Email address
            </label>
            <input
              id="email" type="email" required autoComplete="email"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="input-premium"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(232,115,107,0.08)', border: '1px solid rgba(232,115,107,0.20)' }}>
              <svg className="w-4 h-4 text-error shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Send reset link
          </Button>
        </form>
      </div>
    </div>
  )
}
