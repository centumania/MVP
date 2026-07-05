'use client'

/**
 * /auth/forgot-password — v2 design system.
 * Business logic unchanged from v1: resetPasswordForEmail with redirectTo
 * /auth/reset-password.
 */
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import Logo from '@/src/components/landing-v2/Logo'
import { AuthButton, ErrorBanner, Field, StatusIcon } from '@/src/components/auth-v2/controls'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-6 text-gray-900 antialiased"
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <Shell>
        <div className="text-center">
          <StatusIcon tone="success" />
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            Reset link sent
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-gray-600">
            We sent a password reset link to <span className="font-bold text-gray-900">{email}</span>.
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-gray-500">
            Check your inbox and click the link to set a new password. The link expires in 1 hour.
          </p>
          <Link href="/auth/login" className="mt-7 inline-block text-[14px] font-bold text-sky-600 transition-colors hover:text-sky-700">
            Back to sign in →
          </Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <Link href="/" className="mb-9 flex items-center gap-2.5">
        <Logo size={36} />
        <span>
          <span className="block text-[16px] font-bold tracking-tight text-gray-900">
            Centu<span className="text-sky-600">Mania</span>
          </span>
          <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Winning is a habit</span>
        </span>
      </Link>

      <Link href="/auth/login" className="mb-7 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-800">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to sign in
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
        Forgot password?
      </h1>
      <p className="mt-2 text-[14.5px] text-gray-500">Enter your registered email and we&apos;ll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <AuthButton type="submit" loading={loading}>
          Send reset link
        </AuthButton>
      </form>
    </Shell>
  )
}
