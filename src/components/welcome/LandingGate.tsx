'use client'

/**
 * LandingGate — first-visit guard for "/".
 *
 * Routing decision (least friction for returning students):
 *   • Logged-in student  → /dashboard (skip the marketing funnel entirely)
 *   • Returning visitor (cm_lang saved) → fall through to the landing
 *   • Brand-new visitor (no cm_lang) → /welcome (language gate + onboarding)
 *   • ?stay=1 (the gate just sent us here) → always show the landing
 *
 * Renders a neutral placeholder for the split second before the decision so
 * no one sees a flash of the wrong page. Additive wrapper — the landing
 * component itself is untouched.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const show = () => { if (!cancelled) setReady(true) }
    ;(async () => {
      try {
        // The gate sends returning visitors here with ?stay=1 after they pick
        // a language — always show the landing, never bounce them back.
        if (new URLSearchParams(window.location.search).has('stay')) return show()

        // Logged-in students never need the funnel — straight to their dashboard.
        const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
        if (cancelled) return
        if (session) { router.replace('/dashboard'); return }

        // Returning visitor who already chose a language → the landing.
        let hasLang = false
        try { hasLang = !!localStorage.getItem('cm_lang') } catch { hasLang = false }
        if (hasLang) return show()

        // Brand-new visitor → language gate + onboarding survey.
        router.replace('/welcome')
      } catch {
        show() // any failure → show the landing, never block the visitor
      }
    })()
    return () => { cancelled = true }
  }, [router])

  if (!ready) {
    return <div aria-hidden className="min-h-screen bg-[#FAFAF8]" />
  }
  return (
    <>
      {children}
      {/* Always-available language switcher — the gate is never "lost".
          Returning visitors skip the gate, but can re-open it anytime. */}
      <a
        href="/welcome"
        aria-label="Change language"
        className="fixed right-3 top-3 z-50 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-[12px] font-bold text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:border-sky-300 hover:text-sky-700"
        style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top))' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" />
        </svg>
        EN / தமிழ்
      </a>
    </>
  )
}
