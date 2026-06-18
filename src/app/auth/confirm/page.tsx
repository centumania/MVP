'use client'

/**
 * /auth/confirm
 *
 * Handles email verification after the user clicks the link in their inbox.
 *
 * Mobile-safe design — supports two Supabase auth flows:
 *
 *   1. PKCE (default v2, same-browser): URL has ?code=...
 *      → exchangeCodeForSession() exchanges the code using the PKCE verifier
 *        stored in localStorage from the original signUp call.
 *
 *   2. Hash / implicit (different browser on mobile): URL hash has
 *      #access_token=...&refresh_token=...
 *      → detectSessionInUrl=true in the Supabase client handles this
 *        automatically on any page load. We just check getSession().
 *
 *   3. No code, no hash: link is invalid or already used — show error.
 *
 * Also handles the `?message=` query param set by /auth/callback for
 * expired-link redirects.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type State = 'loading' | 'success' | 'error'

function ConfirmInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<State>('loading')
  const [message, setMsg] = useState('')

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const code     = searchParams.get('code')
    const errMsg   = searchParams.get('message') // set by /auth/callback on error

    // Show error from upstream redirect (e.g. expired link from /auth/callback)
    if (errMsg) {
      setMsg(decodeURIComponent(errMsg))
      setState('error')
      return
    }

    async function verify() {
      // ── Path 1: PKCE code exchange ──────────────────────────────
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

      // ── Path 3: Nothing — link invalid or already used ───────────
      console.warn('[confirm] No code and no session found')
      setMsg('Verification link is invalid or has already been used. Please sign in or register again.')
      setState('error')
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Loading ──────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#F8FAFC' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#0B3D91', boxShadow: '0 0 12px rgba(11,61,145,0.3)' }} />
        <p className="text-sm text-text-muted">Confirming your account…</p>
        <p className="text-xs text-text-muted" style={{ opacity: 0.4 }}>This takes just a moment</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F8FAFC' }}>
        <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Verification failed
        </h2>
        <p className="text-sm text-text-muted max-w-xs mb-8 leading-relaxed">{message}</p>

        <div className="flex flex-col items-center gap-3">
          <a
            href="/auth/register"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#10B981', color: '#FFFFFF' }}
          >
            Register again
          </a>
          <a href="/auth/login" className="text-sm text-primary hover:text-primary-hover transition-colors font-medium">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  // ── Success (brief flash before redirect) ────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#F8FAFC' }}>
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(11,61,145,0.10)', border: '1px solid rgba(11,61,145,0.25)' }}>
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <p className="text-sm text-text-muted">Email verified — taking you to your dashboard…</p>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#F8FAFC' }}>
        <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#0B3D91' }} />
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    }>
      <ConfirmInner />
    </Suspense>
  )
}
