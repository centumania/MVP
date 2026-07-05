'use client'

/**
 * /auth/reset-password — v2 design system.
 *
 * Business logic unchanged from v1. Supabase redirects here after the user
 * clicks the password-reset link in their email:
 *   1. Supabase appends ?code=... (PKCE) or sets a hash session (implicit).
 *   2. On mount we exchange the code / check for an active session.
 *   3. User enters new password → supabase.auth.updateUser({ password })
 *   4. Sign out, then redirect to login with a success message.
 */
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken } from '@/src/lib/analytics/track'
import Logo from '@/src/components/landing-v2/Logo'
import { AuthButton, ErrorBanner, PasswordField, Spinner, StatusIcon } from '@/src/components/auth-v2/controls'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sessionReady, setSessionReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const code = searchParams.get('code')

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
      setCachedToken(null)
      await getSupabaseBrowserClient().auth.signOut()
      setTimeout(() => router.replace('/auth/login?message=Password+reset+successfully'), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return <Spinner label="Verifying reset link…" />
  }

  // ── Invalid link ──
  if (error && !sessionReady) {
    return (
      <div className="py-6 text-center">
        <StatusIcon tone="error" />
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Link expired</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{error}</p>
        <a href="/auth/forgot-password" className="mt-6 inline-block text-[14px] font-bold text-sky-600 transition-colors hover:text-sky-700">
          Request a new reset link →
        </a>
      </div>
    )
  }

  // ── Success ──
  if (done) {
    return (
      <div className="py-6 text-center">
        <StatusIcon tone="success" />
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Password updated!</h2>
        <p className="mt-2 text-[14px] text-gray-500">Redirecting you to sign in…</p>
      </div>
    )
  }

  // ── Form ──
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PasswordField
        id="password"
        label="New password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min 8 characters"
      />

      <PasswordField
        id="confirm"
        label="Confirm password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repeat password"
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <AuthButton type="submit" loading={loading}>
        Set new password
      </AuthButton>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-6 text-gray-900 antialiased"
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-9 flex items-center gap-2.5">
          <Logo size={36} />
          <span>
            <span className="block text-[16px] font-bold tracking-tight text-gray-900">
              Centu<span className="text-sky-600">Mania</span>
            </span>
            <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">Winning is a habit</span>
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
          Set new password
        </h1>
        <p className="mb-7 mt-2 text-[14.5px] text-gray-500">Choose a strong password for your account.</p>

        <Suspense fallback={<Spinner />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
