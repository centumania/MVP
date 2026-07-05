'use client'

/**
 * /auth/confirm — v2 design system.
 *
 * Business logic unchanged from v1. Handles email verification after the
 * user clicks the link in their inbox. Mobile-safe: supports both Supabase
 * flows —
 *   1. PKCE (same browser): ?code=... → exchangeCodeForSession()
 *   2. Hash / implicit (different browser on mobile): detectSessionInUrl
 *      establishes the session automatically; we just check getSession().
 *   3. Neither → link invalid or already used.
 * Also handles the ?message= param set by /auth/callback for expired links.
 */
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Spinner, StatusIcon } from '@/src/components/auth-v2/controls'

type State = 'loading' | 'success' | 'error'

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF8] px-6 text-center text-gray-900 antialiased"
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
    >
      {children}
    </div>
  )
}

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ?message= is set by /auth/callback on expired links — known at render
  // time, so derive the initial state from it instead of setting it in an effect.
  const upstreamError = searchParams.get('message')
  const [state, setState] = useState<State>(upstreamError ? 'error' : 'loading')
  const [message, setMsg] = useState(upstreamError ? decodeURIComponent(upstreamError) : '')

  useEffect(() => {
    if (upstreamError) return

    const supabase = getSupabaseBrowserClient()
    const code = searchParams.get('code')

    async function verify() {
      // ── Path 1: PKCE code exchange ──
      if (code) {
        console.log('[confirm] Attempting PKCE code exchange')
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.warn('[confirm] Code exchange failed:', error.message)
          // PKCE verifier mismatch (different browser on mobile) — check if
          // Supabase already established a session via the hash tokens
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            console.log('[confirm] Session found via hash (implicit flow) — proceeding')
            setState('success')
            router.replace('/dashboard')
            return
          }
          // Truly expired / invalid
          setMsg('Your verification link has expired or was already used. Please register again or contact your coordinator.')
          setState('error')
          return
        }

        setState('success')
        router.replace('/dashboard')
        return
      }

      // ── Path 2: Hash / implicit — detectSessionInUrl handled it ──
      // Give Supabase a short delay to finish processing the URL hash
      await new Promise(r => setTimeout(r, 400))
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        console.log('[confirm] Session confirmed (implicit flow)')
        setState('success')
        router.replace('/dashboard')
        return
      }

      // ── Path 3: Nothing — link invalid or already used ──
      console.warn('[confirm] No code and no session found')
      setMsg('Verification link is invalid or has already been used. Please sign in or register again.')
      setState('error')
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'loading') {
    return (
      <Screen>
        <Spinner label="Confirming your account…" />
        <p className="-mt-8 text-[12px] text-gray-400">This takes just a moment</p>
      </Screen>
    )
  }

  if (state === 'error') {
    return (
      <Screen>
        <StatusIcon tone="error" />
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Verification failed</h2>
        <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-gray-600">{message}</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href="/auth/register"
            className="rounded-xl bg-sky-600 px-6 py-3 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.3)] transition-all hover:-translate-y-0.5 hover:bg-sky-700"
          >
            Register again
          </a>
          <a href="/auth/login" className="text-[14px] font-semibold text-sky-600 transition-colors hover:text-sky-700">
            Back to sign in
          </a>
        </div>
      </Screen>
    )
  }

  // ── Success (brief flash before redirect) ──
  return (
    <Screen>
      <StatusIcon tone="success" />
      <p className="text-[14px] text-gray-600">Email verified — taking you to your dashboard…</p>
    </Screen>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Spinner label="Loading…" />
        </Screen>
      }
    >
      <ConfirmInner />
    </Suspense>
  )
}
