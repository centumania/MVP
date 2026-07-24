'use client'

/**
 * Today's Test — the Daily Test Engine embedded INSIDE the app shell.
 *
 * Previously "Today's Test" redirected to the bare /study/daily-test-engine.html,
 * which dropped the navigation. This wraps it in an iframe within AppLayout so
 * the sidebar/bottom-nav stay present, and passes ?free=N to the HTML so unpaid
 * students only see Days 1–2 unlocked (the rest lock behind a subscription).
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { setCachedToken } from '@/src/lib/analytics/track'

export const dynamic = 'force-dynamic'

const FREE_DAYS = 2

export default function TestEnginePage() {
  const router = useRouter()
  const [src, setSrc] = useState<string | null>(null)
  const [userName, setUserName] = useState('Student')

  useEffect(() => {
    let cancelled = false
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      if (!session) { router.replace('/auth/login'); return }
      setCachedToken(session.access_token)
      setUserName((session.user.user_metadata?.name as string) ?? session.user.email?.split('@')[0] ?? 'Student')
      // Let the embedded HTML authenticate its own /api/study/interaction posts.
      try {
        localStorage.setItem('cm:access_token', session.access_token)
        localStorage.setItem('cm:material_id', 'daily-test-engine')
      } catch { /* ignore */ }
      // Payment status → the free-day cap the HTML respects.
      let paid = false
      try {
        const r = await fetch('/api/materials/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (r.ok) { const j = await r.json(); paid = j?.paymentVerified === true }
      } catch { /* treat as unpaid on failure */ }
      if (cancelled) return
      setSrc(`/study/daily-test-engine.html${paid ? '' : `?free=${FREE_DAYS}`}`)
    })
    return () => { cancelled = true }
  }, [router])

  return (
    <AppLayout userName={userName}>
      {!src ? (
        <div style={{ display: 'flex', minHeight: '70vh', alignItems: 'center', justifyContent: 'center' }}>
          <style>{`@keyframes cm-spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(2,132,199,0.2)', borderTopColor: '#0284c7', animation: 'cm-spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <iframe
          src={src}
          title="Daily Test Engine"
          style={{ width: '100%', height: 'calc(100vh - 60px)', border: 0, display: 'block' }}
          allow="fullscreen"
        />
      )}
    </AppLayout>
  )
}
