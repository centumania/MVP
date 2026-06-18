'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'

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

      const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (signInError) { setSuccess(true); return }
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
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B1020' }}>
        <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,51,255,0.12)', border: '1px solid rgba(37,51,255,0.25)' }}>
            <svg style={{ width: 28, height: 28, color: '#2533FF' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 36, letterSpacing: '0.04em', color: '#F9FAFB', marginBottom: 10 }}>
            ACCOUNT CREATED!
          </h2>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 6 }}>
            Welcome to CentuMania,{' '}
            <span style={{ fontWeight: 600, color: '#F9FAFB' }}>{form.name}</span>.
          </p>
          <p style={{ fontSize: 12, marginBottom: 28, padding: '10px 16px', borderRadius: 10, color: '#9CA3AF', background: 'rgba(37,51,255,0.06)', border: '1px solid rgba(37,51,255,0.15)' }}>
            Your account is ready. Sign in to access your dashboard.
          </p>
          <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 600, color: '#2533FF' }}>
            Sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0B1020' }}>

      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: '#080D1A', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 30%, rgba(37,51,255,0.12), transparent 70%)' }} />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 800" fill="none" style={{ opacity: 0.07 }}>
          {[100,200,300,400].map(y => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(37,51,255,0.6)" strokeWidth="0.5"/>)}
          {[100,200,300,400].map(x => <line key={x} x1={x} y1="0" x2={x} y2="800" stroke="rgba(37,51,255,0.6)" strokeWidth="0.5"/>)}
          <circle cx="400" cy="180" r="160" stroke="rgba(37,51,255,0.8)" strokeWidth="0.5" fill="none"/>
          <circle cx="400" cy="180" r="100" stroke="rgba(37,51,255,0.6)" strokeWidth="0.5" fill="none"/>
          <circle cx="400" cy="180" r="50"  stroke="rgba(246,179,0,0.4)"  strokeWidth="0.5" fill="none"/>
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <div style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 28, letterSpacing: '0.08em', color: '#F6B300' }}>
            CENTU<span style={{ color: '#F9FAFB' }}>MANIA</span>
          </div>
          <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            Winning is a Habit
          </p>
        </div>

        {/* What you get */}
        <div className="relative z-10 space-y-6">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2533FF', fontFamily: 'monospace', marginBottom: 12 }}>
              What you get
            </p>
            <h2 style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 36, letterSpacing: '0.03em', color: '#F9FAFB', lineHeight: 1.05, marginBottom: 24 }}>
              30 DAYS.<br />FULL MASTERY.
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Daily structured study materials',
              'Mock tests after every session',
              'Live leaderboard — compete to win',
              'Personal score analytics',
              'Performance-linked refund guarantee',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2533FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 13, color: '#D1D5DB' }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            {[['30', 'Days'], ['100+', 'Daily Qs'], ['3×', 'Score Lift']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 26, letterSpacing: '0.04em', color: '#F6B300' }}>{n}</div>
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p style={{ fontSize: 11, color: '#4B5563', fontFamily: 'monospace' }}>Puducherry LDC/UDC Exam Preparation · Batch 2026</p>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <Link href="/"
            className="inline-flex items-center gap-1.5 mb-8 transition-colors"
            style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden mb-6">
            <div style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 24, letterSpacing: '0.08em', color: '#F6B300' }}>
              CENTU<span style={{ color: '#F9FAFB' }}>MANIA</span>
            </div>
          </div>

          {/* Batch badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(37,51,255,0.08)', border: '1px solid rgba(37,51,255,0.20)', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2533FF', display: 'inline-block' }} className="animate-pulse" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
              LDC Batch 2026 — Open Enrolment
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 38, letterSpacing: '0.04em', color: '#F9FAFB', lineHeight: 1, marginBottom: 8 }}>
            JOIN THE PROGRAMME
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24 }}>Begin your intensive daily programme.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label htmlFor="name" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontFamily: 'monospace', marginBottom: 6 }}>Full Name</label>
              <input id="name" type="text" required autoComplete="name"
                placeholder="Your full name" value={form.name} onChange={update('name')}
                className="input-premium" />
            </div>

            <div>
              <label htmlFor="phone" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontFamily: 'monospace', marginBottom: 6 }}>Mobile Number</label>
              <input id="phone" type="tel" required autoComplete="tel"
                placeholder="9876543210" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                className="input-premium" />
            </div>

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontFamily: 'monospace', marginBottom: 6 }}>Email Address</label>
              <input id="email" type="email" required autoComplete="email"
                placeholder="you@example.com" value={form.email} onChange={update('email')}
                className="input-premium" />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontFamily: 'monospace', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required autoComplete="new-password"
                  placeholder="Min 8 characters"
                  value={form.password} onChange={update('password')}
                  className="input-premium"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" aria-label={showPassword ? 'Hide' : 'Show'} onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', inset: '0 0 0 auto', display: 'flex', alignItems: 'center', padding: '0 12px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  tabIndex={-1}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Consent */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <div style={{ position: 'relative', marginTop: 2, flexShrink: 0 }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                <div style={{ width: 16, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', background: consent ? '#2533FF' : 'transparent', border: `1.5px solid ${consent ? '#2533FF' : 'rgba(255,255,255,0.20)'}` }}>
                  {consent && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <polyline points="1 3.5 3.5 6 8 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
                I have read and agree to the{' '}
                <Link href="/privacy" target="_blank" style={{ color: '#2533FF', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  Privacy Policy
                </Link>
                {' '}and confirm I am enrolling in the LDC/UDC 2026 cohort.
              </span>
            </label>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(227,65,58,0.08)', border: '1px solid rgba(227,65,58,0.20)' }}>
                <svg style={{ width: 15, height: 15, color: '#E3413A', flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: 12, color: '#E3413A', margin: 0 }}>{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg" disabled={!consent}>
              Create account
            </Button>
          </form>

          <div style={{ marginTop: 18, paddingTop: 18, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ fontWeight: 600, color: '#2533FF' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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
