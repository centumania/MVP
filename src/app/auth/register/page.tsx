'use client'

/**
 * /auth/register — v2 design system.
 * Business logic unchanged from v1: client-side validation (name, Indian
 * mobile, password length, consent), POST /api/auth/register, auto sign-in,
 * success fallback when auto sign-in fails.
 */
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import AuthShell from '@/src/components/auth-v2/AuthShell'
import { AuthButton, Checkbox, ErrorBanner, Field, PasswordField, StatusIcon } from '@/src/components/auth-v2/controls'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // ── Success state (auto sign-in failed; account exists) ──────────
  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-6 text-gray-900 antialiased"
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
      >
        <div className="w-full max-w-sm text-center">
          <StatusIcon tone="success" />
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Account created!
          </h2>
          <p className="mt-2 text-[14.5px] text-gray-600">
            Welcome to CentuMania, <span className="font-bold text-gray-900">{form.name}</span>.
          </p>
          <p className="mt-4 rounded-xl border border-sky-200/70 bg-sky-50 px-4 py-3 text-[13px] text-sky-800">
            Your account is ready. Sign in to access your dashboard.
          </p>
          <Link
            href="/auth/login"
            className="mt-7 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-6 py-3 text-[14.5px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.3)] transition-all hover:-translate-y-0.5 hover:bg-sky-700"
          >
            Sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthShell variant="register">
      <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white px-3 py-1 text-[12px] font-semibold text-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        Founder Batch 2026 — open enrolment
      </span>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
        Join the programme
      </h1>
      <p className="mt-2 text-[14.5px] text-gray-500">Begin your intensive daily programme.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <Field
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={update('name')}
          placeholder="Your full name"
        />

        <Field
          id="phone"
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          required
          value={form.phone}
          onChange={(e) => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
          placeholder="9876543210"
        />

        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          placeholder="you@example.com"
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
          placeholder="Min 8 characters"
        />

        <Checkbox checked={consent} onChange={setConsent}>
          I have read and agree to the{' '}
          <Link href="/privacy" target="_blank" className="font-semibold text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-700">
            Privacy Policy
          </Link>{' '}
          and confirm I am enrolling in the CentuMania 2026 founder cohort.
        </Checkbox>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <AuthButton type="submit" loading={loading} disabled={!consent}>
          Create account
        </AuthButton>
      </form>

      <p className="mt-6 border-t border-gray-100 pt-5 text-center text-[14px] text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-bold text-sky-600 transition-colors hover:text-sky-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
