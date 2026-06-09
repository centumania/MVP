'use client'

/**
 * /auth/reset-password
 *
 * Supabase redirects here after the user clicks the password-reset link in
 * their email (sent by resetPasswordForEmail with redirectTo pointing here).
 *
 * Flow:
 *   1. Supabase appends ?code=... to this URL (PKCE) or sets a hash session
 *      (implicit). detectSessionInUrl=true handles both automatically.
 *   2. On mount we check for an active session (Supabase auto-exchanged it).
 *   3. User enters new password → supabase.auth.updateUser({ password })
 *   4. Redirect to login with success message.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { LogoMark } from '@/src/components/ui/Logo'

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function ResetForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [sessionReady, setSessionReady] = useState(false)
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [done, setDone]                 = useState(false)
  const [initLoading, setInitLoading]   = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const code     = searchParams.get('code')

    async function init() {
      // PKCE flow: exchange code for session
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError('Reset link is invalid or has expired. Please request a new one.')
          setInitLoading(false)
          return
        }
        setSessionReady(true)
        setInitLoading(false)
        return
      }

      // Implicit / hash flow: detectSessionInUrl handled it automatically
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      } else {
        setError('Reset link is invalid or has expired. Please request a new one.')
      }
      setInitLoading(false)
    }

    init()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const { error: updateError } = await getSupabaseBrowserClient()
        .auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setDone(true)
      // Sign out so the user is prompted to log in fresh with the new password
      await getSupabaseBrowserClient().auth.signOut()
      setTimeout(() => router.replace('/auth/login?message=Password+reset+successfully'), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#6fcf8f' }} />
        <p className="text-sm text-text-muted">Verifying reset link…</p>
      </div>
    )
  }

  // ── Invalid link ──────────────────────────────────────────────
  if (error && !sessionReady) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.20)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8736b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Link expired
        </h2>
        <p className="text-sm text-text-muted mb-6">{error}</p>
        <a href="/auth/forgot-password"
          className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          Request a new reset link →
        </a>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(111,207,143,0.10)', border: '1px solid rgba(111,207,143,0.25)' }}>
          <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Password updated!
        </h2>
        <p className="text-sm text-text-muted">Redirecting you to sign in…</p>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            required autoComplete="new-password"
            placeholder="Min 8 characters"
            value={password} onChange={e => setPassword(e.target.value)}
            className="input-premium pr-11"
          />
          <button type="button" aria-label={showPw ? 'Hide' : 'Show'} onClick={() => setShowPw(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary transition-colors"
            tabIndex={-1}>
            {showPw ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            required autoComplete="new-password"
            placeholder="Repeat password"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            className="input-premium pr-11"
          />
          <button type="button" aria-label={showConfirm ? 'Hide' : 'Show'} onClick={() => setShowConfirm(v => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary transition-colors"
            tabIndex={-1}>
            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
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
        Set new password
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0e1410' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10"
          style={{ filter: 'drop-shadow(0 0 8px rgba(111,207,143,0.4))' }}>
          <LogoMark size={24} />
          <div>
            <span className="text-base font-bold text-text tracking-tight block" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
              CentuMania
            </span>
            <span className="text-[10px] text-text-muted font-mono tracking-wide">Winning is a Habit</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text tracking-tight mb-1.5"
          style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Set new password
        </h1>
        <p className="text-sm mb-8 text-text-muted">
          Choose a strong password for your account.
        </p>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: '#6fcf8f' }} />
          </div>
        }>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
