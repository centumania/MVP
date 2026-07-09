'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken, trackEvent, trackBeacon } from '@/src/lib/analytics/track'

type ContentType = 'html' | 'pdf'

export default function MaterialViewerPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()

  const [state,       setState]       = useState<'loading' | 'ready' | 'error'>('loading')
  const [contentType, setContentType] = useState<ContentType>('html')
  const [contentUrl,  setContentUrl]  = useState<string | null>(null)
  const [errorMsg,    setErrorMsg]    = useState('')

  const openedAtRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const res = await fetch(`/api/materials/open/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (cancelled) return

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { setErrorMsg('Your payment is pending. Contact your coordinator.'); setState('error'); return }
      if (res.status === 404) { setErrorMsg('This material is no longer available.'); setState('error'); return }
      if (res.status === 429) { setErrorMsg('Too many requests. Please wait a moment and try again.'); setState('error'); return }
      if (!res.ok)            { setErrorMsg('Could not load material. Please try again.'); setState('error'); return }

      const data = await res.json() as
        | { type: 'pdf'; url: string }
        | { type: 'html'; url: string }

      if (cancelled) return

      setCachedToken(session.access_token)
      openedAtRef.current = Date.now()
      trackEvent('material_opened', { material_id: id, content_type: data.type })

      // HTML: Netlify blocks iframing (X-Frame-Options). Redirect directly —
      // auth + payment have already been verified above.
      // Store token + material_id in localStorage so the HTML file's
      // centumania-tracker.js can authenticate its /api/study/interaction calls.
      if (data.type === 'html') {
        try { localStorage.setItem('cm:access_token', session.access_token) } catch { /* private browsing */ }
        try { localStorage.setItem('cm:material_id', id) } catch { /* private browsing */ }
        window.location.href = data.url
        return
      }

      setContentType(data.type)
      setContentUrl(data.url)
      setState('ready')
    }

    load().catch(() => {
      if (!cancelled) { setErrorMsg('Unexpected error. Please refresh.'); setState('error') }
    })

    return () => { cancelled = true }
  }, [id, router])

  useEffect(() => {
    function handleUnload() {
      const durationMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0
      if (durationMs >= 30_000) {
        trackBeacon('daily_material_completed', { material_id: id, duration_ms: durationMs })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [id])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8FAFC' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 h-12 shrink-0"
        style={{
          background: 'rgba(14,20,16,0.97)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E5E7EB',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <Link
          href="/materials"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors font-mono shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Materials
        </Link>

        {state === 'ready' && (
          <span
            className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
            style={contentType === 'pdf'
              ? { background: 'rgba(2,132,199,0.10)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }
              : { background: 'rgba(2,132,199,0.10)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }
            }
          >
            {contentType === 'pdf' ? 'PDF' : 'HTML'}
          </span>
        )}

        <div className="flex-1" />

        {state === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <div className="w-3.5 h-3.5 rounded-full border animate-spin"
              style={{ borderColor: 'rgba(2,132,199,0.2)', borderTopColor: '#0284c7' }} />
            Loading…
          </div>
        )}
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center flex-1 px-6 gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-sm text-text-muted text-center max-w-xs">{errorMsg}</p>
            <Link href="/materials"
              className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              ← Back to materials
            </Link>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(2,132,199,0.15)', borderTopColor: '#0284c7' }} />
            <p className="text-xs text-text-muted font-mono">Loading study material…</p>
          </div>
        )}

        {/* HTML viewer — direct iframe to preserve the page's own origin context */}
        {state === 'ready' && contentType === 'html' && contentUrl && (
          <iframe
            src={contentUrl}
            title="Study material"
            className="flex-1 w-full border-0"
            style={{ minHeight: 'calc(100vh - 48px)' }}
            allow="fullscreen"
          />
        )}

        {/* PDF viewer — native browser PDF renderer via signed URL */}
        {state === 'ready' && contentType === 'pdf' && contentUrl && (
          <iframe
            src={contentUrl}
            title="Study material (PDF)"
            className="flex-1 w-full border-0"
            style={{ minHeight: 'calc(100vh - 48px)' }}
          />
        )}
      </main>
    </div>
  )
}
