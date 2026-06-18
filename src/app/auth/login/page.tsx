'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient, setKeepSignedIn } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPassword, setShowPw] = useState(false)
  const [keepSignedIn, setKeep]   = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      setKeepSignedIn(keepSignedIn)
      const supabase = getSupabaseBrowserClient()
      const { data, error: authError } = await supabase
        .auth.signInWithPassword({ email: email.trim().toLowerCase(), password })

      if (authError) {
        setError(
          authError.message.includes('Invalid login')
            ? 'Incorrect email or password.'
            : authError.message.includes('Email not confirmed')
            ? 'Please verify your email first. Check your inbox.'
            : authError.message
        )
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()
        router.push(profile?.is_admin ? '/admin' : '/dashboard')
        router.refresh()
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
    <div className="min-h-screen flex" style={{ background: '#0B1020' }}>

      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: '#080D1A', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Indigo radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 60% 30%, rgba(37,51,255,0.12), transparent 70%)' }} />

        {/* Grid lines */}
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

        {/* Quote */}
        <div className="relative z-10 space-y-5">
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2533FF', fontFamily: 'monospace' }}>
            LDC/UDC · Puducherry · 2026
          </p>
          <blockquote style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 38, lineHeight: 1.05, letterSpacing: '0.03em', color: '#F9FAFB' }}>
            &ldquo;DISCIPLINE IS THE BRIDGE BETWEEN GOALS AND ACCOMPLISHMENT.&rdquo;
          </blockquote>
          <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6 }}>
            Every morning. Zero shortcuts. This is where champions are built.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            {[['30', 'Day Programme'], ['100+', 'Daily Qs'], ['3×', 'Score Lift']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 26, letterSpacing: '0.04em', color: '#2533FF' }}>{n}</div>
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p style={{ fontSize: 11, color: '#4B5563', fontFamily: 'monospace' }}>Puducherry LDC/UDC Exam Preparation · Batch 2026</p>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <Link href="/"
            className="inline-flex items-center gap-1.5 mb-10 transition-colors"
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
          <div className="lg:hidden mb-8">
            <div style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 24, letterSpacing: '0.08em', color: '#F6B300' }}>
              CENTU<span style={{ color: '#F9FAFB' }}>MANIA</span>
            </div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 40, letterSpacing: '0.04em', color: '#F9FAFB', lineHeight: 1, marginBottom: 8 }}>
            WELCOME BACK
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 32 }}>Sign in to continue your journey.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontFamily: 'monospace', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-premium"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label htmlFor="password" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontFamily: 'monospace' }}>
                  Password
                </label>
                <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#2533FF')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6B7280')}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Keep me signed in */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 4, flexShrink: 0, transition: 'all 0.15s', background: keepSignedIn ? 'rgba(37,51,255,0.15)' : 'transparent', border: `1.5px solid ${keepSignedIn ? '#2533FF' : 'rgba(255,255,255,0.20)'}` }}>
                {keepSignedIn && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#2533FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3"/>
                  </svg>
                )}
                <input type="checkbox" checked={keepSignedIn} onChange={e => setKeep(e.target.checked)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </span>
              <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>Keep me signed in</span>
            </label>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(227,65,58,0.08)', border: '1px solid rgba(227,65,58,0.20)' }}>
                <svg style={{ width: 15, height: 15, color: '#E3413A', flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ fontSize: 12, color: '#E3413A', margin: 0 }}>{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">Sign in</Button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              New student?{' '}
              <Link href="/auth/register" style={{ fontWeight: 600, color: '#2533FF' }}>
                Create account
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
