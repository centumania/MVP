'use client'

/**
 * LandingGate — first-visit guard for "/".
 *
 * A brand-new visitor (no cm_lang saved) is sent to /welcome (language gate +
 * onboarding). Returning visitors fall straight through to the landing.
 * Renders a neutral placeholder for the split second before the decision so
 * first-timers never see a flash of the landing. Additive wrapper — the
 * landing component itself is untouched.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // The language gate is the first page every visit to "/". We only fall
    // through to the landing when the gate sends us here with ?stay=1
    // (after the visitor has picked a language). A reload of bare "/" always
    // shows the gate again.
    let redirecting = false
    try {
      const stay = new URLSearchParams(window.location.search).has('stay')
      if (!stay) { redirecting = true; router.replace('/welcome'); return }
    } catch { /* storage blocked — just show the landing */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!redirecting) setReady(true)
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
