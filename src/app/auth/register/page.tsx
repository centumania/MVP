'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { name: form.name.trim(), phone: form.phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) {
        setError(authError.message.includes('already registered')
          ? 'This email is already registered. Please sign in.'
          : authError.message)
        return
      }
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success State ──────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0e1410' }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(111,207,143,0.10)', border: '1px solid rgba(111,207,143,0.25)', boxShadow: '0 0 24px rgba(111,207,143,0.12)' }}>
            <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Check your inbox
          </h2>
          <p className="text-sm mb-1 text-text-muted">
            Confirmation link sent to{' '}
            <span className="font-semibold text-text">{form.email}</span>
          </p>
          <p className="text-sm mb-8 text-text-muted">
            Click the link, then contact your coordinator to complete enrolment.
          </p>
          <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
            Back to sign in →
          </Link>
        </div>
      </div>
    )
  }

  const FIELDS = [
    { id: 'name',     label: 'Full name',     type: 'text',     placeholder: 'Your full name',   autoComplete: 'name',         value: form.name,     onChange: update('name') },
    { id: 'phone',    label: 'Mobile number', type: 'tel',      placeholder: '9876543210',        autoComplete: 'tel',          value: form.phone,    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })) },
    { id: 'email',    label: 'Email address', type: 'email',    placeholder: 'you@example.com',  autoComplete: 'email',        value: form.email,    onChange: update('email') },
    { id: 'password', label: 'Password',      type: 'password', placeholder: 'Min 8 characters', autoComplete: 'new-password', value: form.password, onChange: update('password') },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#0e1410' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div style={{ filter: 'drop-shadow(0 0 8px rgba(111,207,143,0.4))' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="url(#rg1)" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="7" fill="url(#rg1)"/>
              <defs>
                <linearGradient id="rg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
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

        {/* Batch badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-6"
          style={{ background: 'rgba(111,207,143,0.08)', border: '1px solid rgba(111,207,143,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">
            LDC Batch 2026 — Open Enrolment
          </span>
        </div>

        <h1 className="text-3xl font-bold text-text tracking-tight mb-1.5"
          style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Create your account
        </h1>
        <p className="text-sm mb-8 text-text-muted">
          Begin your 25-day intensive programme.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block text-xs font-semibold uppercase tracking-widest mb-2 text-text-muted font-mono">
                {f.label}
              </label>
              <input
                id={f.id} type={f.type} required
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                value={f.value}
                onChange={f.onChange}
                className="input-premium"
              />
            </div>
          ))}

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
            Create account
          </Button>

          <p className="text-[10px] text-center leading-relaxed text-text-disabled">
            By registering you confirm you are enrolling in the LDC 2026 cohort and agree to our terms.
          </p>
        </form>

        <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid #27342b' }}>
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
