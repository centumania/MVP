'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken, trackEvent, trackBeacon } from '@/src/lib/analytics/track'
import { getMaterialById } from '@/src/data/materials'

type ViewerState = 'loading' | 'ready' | 'error'

export default function StudentMaterialViewer() {
  const { studentId, day } = useParams<{ studentId: string; day: string }>()
  const router             = useRouter()

  const [state,     setState]    = useState<ViewerState>('loading')
  const [errorMsg,  setErrorMsg] = useState('')
  const [iframeSrc, setIframeSrc]= useState<string | null>(null)
  const [title,     setTitle]    = useState('')

  const openedAtRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const material = getMaterialById(day)
      if (!material) {
        if (!cancelled) { setErrorMsg('Material not found.'); setState('error') }
        return
      }

      const res = await fetch('/api/materials/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (cancelled) return
      if (res.status === 401) { router.replace('/auth/login'); return }
      if (!res.ok) {
        if (!cancelled) { setErrorMsg('Could not verify access. Please try again.'); setState('error') }
        return
      }

      const status = await res.json() as {
        paymentVerified:    boolean
        registrationNumber: string | null
        enrolledDate:       string
        activeDays:         number[]
      }
      if (cancelled) return

      // Confirm this URL belongs to the authenticated student
      if (status.registrationNumber !== studentId) {
        if (status.registrationNumber) {
          router.replace(`/materials/${status.registrationNumber}/${day}`)
        } else {
          router.replace('/materials')
        }
        return
      }

      // Check day schedule
      const enrolled = new Date(status.enrolledDate)
      enrolled.setHours(0, 0, 0, 0)
      const unlock = new Date(enrolled)
      unlock.setDate(unlock.getDate() + (material.day - 1))
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (today < unlock) {
        const daysLeft = Math.ceil((unlock.getTime() - today.getTime()) / 86_400_000)
        if (!cancelled) {
          setErrorMsg(`Day ${material.day} unlocks in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`)
          setState('error')
        }
        return
      }

      // Check payment
      if (material.day > 2 && !status.paymentVerified) {
        if (!cancelled) { setErrorMsg('Your payment is pending. Contact your coordinator.'); setState('error') }
        return
      }

      // Check Supabase publish window
      if (!status.activeDays.includes(material.day)) {
        if (!cancelled) {
          setErrorMsg("Today's material hasn't been published yet. Check back after 6:00 AM IST.")
          setState('error')
        }
        return
      }

      setCachedToken(session.access_token)
      openedAtRef.current = Date.now()
      trackEvent('material_opened', { material_id: day, day: material.day, student_id: studentId })

      if (!cancelled) {
        setTitle(material.title)
        setIframeSrc(material.htmlPath)
        setState('ready')
      }
    }

    load().catch(() => {
      if (!cancelled) { setErrorMsg('Unexpected error. Please refresh.'); setState('error') }
    })

    return () => { cancelled = true }
  }, [studentId, day, router])

  useEffect(() => {
    function handleUnload() {
      const durationMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0
      if (durationMs >= 30_000) {
        trackBeacon('daily_material_completed', { material_id: day, duration_ms: durationMs })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [day])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e1410' }}>
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 h-12 shrink-0"
        style={{
          background: 'rgba(14,20,16,0.97)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #27342b',
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

        {state === 'ready' && title && (
          <span className="text-xs text-text-muted font-mono truncate">{title}</span>
        )}

        <div className="flex-1" />

        {state === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <div className="w-3.5 h-3.5 rounded-full border animate-spin"
              style={{ borderColor: 'rgba(74,222,128,0.2)', borderTopColor: '#4ADE80' }} />
            Loading…
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center flex-1 px-6 gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.20)' }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#e8736b" strokeWidth="2" strokeLinecap="round">
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
              style={{ borderColor: 'rgba(74,222,128,0.15)', borderTopColor: '#4ADE80' }} />
            <p className="text-xs text-text-muted font-mono">Loading study material…</p>
          </div>
        )}

        {state === 'ready' && iframeSrc && (
          <iframe
            src={iframeSrc}
            title={title}
            className="flex-1 w-full border-0"
            style={{ minHeight: 'calc(100vh - 48px)' }}
            allow="fullscreen"
          />
        )}
      </main>
    </div>
  )
}
