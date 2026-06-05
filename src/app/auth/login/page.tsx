'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'

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
      const { error: authError } = await getSupabaseBrowserClient()
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
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0e1410' }}>

      {/* ── Left Panel — Brand ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0d1a10 0%,#112215 50%,#0e1410 100%)' }}>

        {/* Geometric decoration — green palette */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 500 700" fill="none">
          <circle cx="400" cy="100" r="200" stroke="rgba(111,207,143,0.4)" strokeWidth="1"/>
          <circle cx="400" cy="100" r="140" stroke="rgba(111,207,143,0.25)" strokeWidth="1"/>
          <circle cx="400" cy="100" r="80"  stroke="rgba(111,207,143,0.15)" strokeWidth="1"/>
          <line x1="400" y1="-100" x2="400" y2="300" stroke="rgba(111,207,143,0.15)" strokeWidth="1"/>
          <line x1="200" y1="100"  x2="600" y2="100" stroke="rgba(111,207,143,0.15)" strokeWidth="1"/>
          <circle cx="100" cy="600" r="120" stroke="rgba(94,200,192,0.15)" strokeWidth="1"/>
          <polygon points="50,650 150,500 250,650" stroke="rgba(94,200,192,0.12)" strokeWidth="1" fill="none"/>
        </svg>
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(111,207,143,0.08),transparent 70%)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div style={{ filter: 'drop-shadow(0 0 10px rgba(111,207,143,0.5))' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="url(#lg1)" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="7" fill="url(#lg1)" opacity="0.9"/>
              <line x1="16" y1="1" x2="16" y2="8" stroke="url(#lg1)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="24" x2="16" y2="31" stroke="url(#lg1)" strokeWidth="1.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6fcf8f"/>
                  <stop offset="100%" stopColor="#3fae6a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-base font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Centumania
          </span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#6fcf8f' }}>
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

        {/* Social proof */}
        <div className="relative flex items-center gap-4">
          <div className="flex -space-x-2">
            {['P','R','S','A','M'].map((l, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#6fcf8f,#3fae6a)', color: '#06140c', borderColor: '#0e1410' }}>
                {l}
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            <span className="text-text font-semibold">200+</span> aspirants enrolled this batch
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#0e1410' }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div style={{ filter: 'drop-shadow(0 0 8px rgba(111,207,143,0.4))' }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="url(#mlg)" strokeWidth="1.5"/>
                <circle cx="16" cy="16" r="7" fill="url(#mlg)"/>
                <defs>
                  <linearGradient id="mlg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6fcf8f"/>
                    <stop offset="100%" stopColor="#3fae6a"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-base font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
              Centumania
            </span>
          </div>

          <h1 className="text-3xl font-bold text-text tracking-tight mb-1.5"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8 text-text-muted">Sign in to continue your journey.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
                Password
              </label>
              <input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              Sign in
            </Button>
          </form>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid #27342b' }}>
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
