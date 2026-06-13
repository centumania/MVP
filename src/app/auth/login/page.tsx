'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient, setKeepSignedIn } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { LogoFull } from '@/src/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPw]   = useState(false)
  const [keepSignedIn, setKeep]     = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Write preference BEFORE the singleton is used so the storage adapter picks it up
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

      // ── Admin routing: check is_admin from profiles ──────────────
      // This is a UX convenience — security is enforced server-side in /admin routes.
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()

        if (profile?.is_admin) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
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
    <div className="min-h-screen flex" style={{ background: '#F8FAFC' }}>

      {/* ── Left Panel — Brand ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0b1e45 0%,#163070 55%,#e8ecf5 100%)' }}>

        {/* Geometric decoration */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 500 700" fill="none">
          <circle cx="400" cy="100" r="200" stroke="rgba(11,61,145,0.4)" strokeWidth="1"/>
          <circle cx="400" cy="100" r="140" stroke="rgba(11,61,145,0.25)" strokeWidth="1"/>
          <circle cx="400" cy="100" r="80"  stroke="rgba(11,61,145,0.15)" strokeWidth="1"/>
          <line x1="400" y1="-100" x2="400" y2="300" stroke="rgba(11,61,145,0.15)" strokeWidth="1"/>
          <line x1="200" y1="100"  x2="600" y2="100" stroke="rgba(11,61,145,0.15)" strokeWidth="1"/>
          <circle cx="100" cy="600" r="120" stroke="rgba(11,61,145,0.15)" strokeWidth="1"/>
          <polygon points="50,650 150,500 250,650" stroke="rgba(11,61,145,0.12)" strokeWidth="1" fill="none"/>
          {/* Large arrow decoration */}
          <line x1="50" y1="450" x2="250" y2="250" stroke="rgba(11,61,145,0.08)" strokeWidth="2"/>
          <polygon points="250,250 230,280 280,270" fill="rgba(11,61,145,0.08)"/>
        </svg>
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(11,61,145,0.08),transparent 70%)' }} />

        {/* Logo */}
        <div className="relative">
          <LogoFull size={30} glow />
          <span className="text-[10px] text-text-muted font-mono tracking-wide block mt-1 pl-0.5">Winning is a Habit</span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#0B3D91' }}>
            LDC/UDC · Puducherry · 2026
          </p>
          <blockquote className="text-4xl font-bold text-text leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            &ldquo;Discipline is the bridge between goals and accomplishment.&rdquo;
          </blockquote>
          <p className="text-sm text-text-muted">
            25 days. Every morning. Zero shortcuts. This is where champions are built.
          </p>
        </div>

        {/* Batch info */}
        <div className="relative">
          <p className="text-xs text-text-muted font-mono">Puducherry LDC/UDC Exam Preparation · Batch 2026</p>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#F8FAFC' }}>
        <div className="w-full max-w-sm">

          {/* Back to landing */}
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors font-mono mb-8">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <LogoFull size={24} glow />
            <span className="text-[10px] text-text-muted font-mono tracking-wide block mt-1 pl-0.5">Winning is a Habit</span>
          </div>

          <h1 className="text-3xl font-bold text-text tracking-tight mb-1.5"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8 text-text-muted">Sign in to continue your journey.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
                Email address
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-premium"
              />
            </div>

            {/* Password + visibility toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-text-muted font-mono">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-text-muted hover:text-primary transition-colors font-mono"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Keep me signed in */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <span
                className="relative flex items-center justify-center w-4 h-4 rounded shrink-0 transition-all"
                style={{
                  background: keepSignedIn ? 'rgba(11,61,145,0.15)' : 'transparent',
                  border: `1.5px solid ${keepSignedIn ? '#0B3D91' : '#3a4a3d'}`,
                }}
              >
                {keepSignedIn && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3"/>
                  </svg>
                )}
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={e => setKeep(e.target.checked)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </span>
              <span className="text-xs text-text-muted font-mono group-hover:text-text-secondary transition-colors">
                Keep me signed in
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

            <Button type="submit" loading={loading} fullWidth size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid #E5E7EB' }}>
            <p className="text-sm text-text-muted">
              New student?{' '}
              <Link href="/auth/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Eye icons ──────────────────────────────────────────────────────
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
