'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { LogoFull } from '@/src/components/ui/Logo'

export default function RegisterPage() {
  const [form, setForm]           = useState({ name: '', phone: '', email: '', password: '' })
  const [showPassword, setShowPw] = useState(false)
  const [consent, setConsent]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.name.trim().length < 2) { setError('Please enter your full name.'); return }
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) { setError('Enter a valid 10-digit Indian mobile number.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!consent) { setError('Please agree to the Privacy Policy and Terms to continue.'); return }
    setLoading(true)
    try {
      // Step 1 — create user server-side (email pre-confirmed)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Registration failed. Please try again.')
        return
      }

      // Step 2 — sign in immediately (no "check inbox" step)
      const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (signInError) {
        // Account created but sign-in failed — send to login page
        setSuccess(true)
        return
      }

      // Step 3 — go straight to dashboard
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success State ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F8FAFC' }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(11,61,145,0.10)', border: '1px solid rgba(11,61,145,0.25)', boxShadow: '0 0 24px rgba(11,61,145,0.12)' }}>
            <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Account created!
          </h2>
          <p className="text-sm mb-3 text-text-muted">
            Welcome to CentuMania,{' '}
            <span className="font-semibold text-text">{form.name}</span>.
          </p>
          <p className="text-xs mb-8 px-4 py-3 rounded-xl text-text-muted"
            style={{ background: 'rgba(11,61,145,0.06)', border: '1px solid rgba(11,61,145,0.15)' }}>
            Your account is ready. Sign in to access your dashboard.
          </p>
          <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            Sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#F8FAFC' }}>
      <div className="w-full max-w-sm">

        {/* Back to landing */}
        <Link href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors font-mono mb-8">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to home
        </Link>

        {/* Logo */}
        <div className="mb-10">
          <LogoFull size={24} glow />
          <span className="text-[10px] text-text-muted font-mono tracking-wide block mt-1 pl-0.5">Winning is a Habit</span>
        </div>

        {/* Batch badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-6"
          style={{ background: 'rgba(11,61,145,0.08)', border: '1px solid rgba(11,61,145,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">
            LDC Batch 2026 — Open Enrolment
          </span>
        </div>

        <h1 className="text-3xl font-bold text-text tracking-tight mb-1.5"
          style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Create your account
        </h1>
        <p className="text-sm mb-8 text-text-muted">Begin your intensive daily programme.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
              Full name
            </label>
            <input id="name" type="text" required autoComplete="name"
              placeholder="Your full name" value={form.name} onChange={update('name')}
              className="input-premium" />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
              Mobile number
            </label>
            <input id="phone" type="tel" required autoComplete="tel"
              placeholder="9876543210" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              className="input-premium" />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
              Email address
            </label>
            <input id="email" type="email" required autoComplete="email"
              placeholder="you@example.com" value={form.email} onChange={update('email')}
              className="input-premium" />
          </div>

          {/* Password + toggle */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required autoComplete="new-password"
                placeholder="Min 8 characters"
                value={form.password} onChange={update('password')}
                className="input-premium pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-secondary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Consent checkbox — required by DPDP Act */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded flex items-center justify-center transition-colors"
                style={{
                  background: consent ? '#0B3D91' : 'transparent',
                  border: `1.5px solid ${consent ? '#0B3D91' : '#E5E7EB'}`,
                }}
              >
                {consent && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <polyline points="1 3.5 3.5 6 8 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-text-muted leading-relaxed">
              I have read and agree to the{' '}
              <Link href="/privacy" target="_blank" className="text-primary hover:text-primary-hover underline underline-offset-2">
                Privacy Policy
              </Link>
              {' '}and confirm I am enrolling in the LDC/UDC 2026 cohort.
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
              <svg className="w-4 h-4 text-error shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg" disabled={!consent}>
            Create account
          </Button>
        </form>

        <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid #E5E7EB' }}>
          <p className="text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

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
