'use client'

/**
 * /auth/login — v2 design system.
 * Business logic unchanged from v1: setKeepSignedIn storage choice,
 * signInWithPassword, is_admin routing to /admin vs /dashboard.
 * New: displays the ?message= success param (set by reset-password),
 * which v1 silently ignored.
 */
import { Suspense, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient, setKeepSignedIn } from '@/src/lib/supabase/client'
import AuthShell from '@/src/components/auth-v2/AuthShell'
import { AuthButton, Checkbox, ErrorBanner, Field, PasswordField, SuccessBanner } from '@/src/components/auth-v2/controls'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const notice = searchParams.get('message')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeep] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
        Welcome back
      </h1>
      <p className="mt-2 text-[14.5px] text-gray-500">Sign in to continue your journey.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {notice && <SuccessBanner>{notice}</SuccessBanner>}

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

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          labelRight={
            <Link href="/auth/forgot-password" className="text-[13px] font-medium text-sky-600 transition-colors hover:text-sky-700">
              Forgot password?
            </Link>
          }
        />

        <Checkbox checked={keepSignedIn} onChange={setKeep}>
          Keep me signed in
        </Checkbox>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <AuthButton type="submit" loading={loading}>
          Sign in
        </AuthButton>
      </form>

      <p className="mt-7 border-t border-gray-100 pt-6 text-center text-[14px] text-gray-500">
        New student?{' '}
        <Link href="/auth/register" className="font-bold text-sky-600 transition-colors hover:text-sky-700">
          Create account
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <AuthShell variant="login">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
