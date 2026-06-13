'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonCard } from '@/src/components/ui/Skeleton'

type Material = {
  id:          string
  dayNumber:   number
  title:       string
  hasContent:  boolean
  testLink:    string | null
  isFree:      boolean
  publishedAt: string
  expiresAt:   string
}

function timeUntil(iso: string, nowMs: number): string {
  const ms = new Date(iso).getTime() - nowMs
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

function MaterialCard({ m }: { m: Material }) {
  const nav              = useRouter()
  const [now, setNow]    = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const ms     = new Date(m.expiresAt).getTime() - now
  const urgent = ms > 0 && ms < 2 * 3600 * 1000

  function openMaterial() {
    // Navigate directly — the viewer handles auth/payment/404 errors itself.
    // Calling the open API here as a pre-check would double-fetch the HTML content
    // (open API now proxies external HTML server-side, which is expensive).
    nav.push(`/materials/viewer/${m.id}`)
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
              Day {m.dayNumber}
            </p>
            {m.isFree && (
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(11,61,145,0.10)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.20)' }}>
                Free
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            {m.title}
          </h2>
        </div>
        <Badge variant={urgent ? 'error' : 'warning'} dot>{timeUntil(m.expiresAt, now)}</Badge>
      </div>

      <div className="space-y-3">
        {m.hasContent ? (
          <button
            onClick={openMaterial}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg,rgba(11,61,145,0.12),rgba(11,61,145,0.08))',
              border: '1px solid rgba(11,61,145,0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(11,61,145,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-primary">Open Study Material</p>
                <p className="text-xs text-text-muted mt-0.5">Opens secure viewer</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #E5E7EB' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <p className="text-sm text-text-muted">Content not yet published.</p>
          </div>
        )}

        {m.testLink && (
          <a
            href={m.testLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.08))',
              border: '1px solid rgba(245,158,11,0.30)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: '#D97706' }}>Take Today&apos;s Test</p>
                <p className="text-xs text-text-muted mt-0.5">Opens in new tab</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}
      </div>
    </Card>
  )
}

export default function MaterialsPage() {
  const router                          = useRouter()
  const [userName, setUserName]         = useState('')
  const [materials, setMaterials]       = useState<Material[]>([])
  const [loading,   setLoading]         = useState(true)
  const [status,    setStatus]          = useState<'ok' | 'payment' | 'empty' | 'error'>('ok')

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUserName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '')

      const res = await fetch('/api/materials', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { setStatus('payment'); setLoading(false); return }
      if (res.status === 404) { setStatus('empty');   setLoading(false); return }
      if (!res.ok)            { setStatus('error');   setLoading(false); return }
      setMaterials((await res.json()).materials ?? [])
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Study Materials
          </h1>
          <p className="text-sm text-text-muted mt-1">Daily content · available for 24 hours from publish time.</p>
        </div>

        {status === 'payment' && (
          <div className="flex items-start gap-4 p-5 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)' }}>
              <svg className="w-5 h-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-warning mb-1">Payment verification pending</p>
              <p className="text-xs text-text-muted leading-relaxed">
                Materials unlock once your coordinator verifies your payment.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-sm text-error">Failed to load. Please refresh.</p>
          </div>
        )}

        {status === 'empty' && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <svg className="w-7 h-7 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text-secondary" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                No materials today
              </p>
              <p className="text-xs text-text-muted mt-1">Published daily before 6:00 AM IST.</p>
            </div>
          </div>
        )}

        {materials.map(m => <MaterialCard key={m.id} m={m} />)}
      </div>
    </AppLayout>
  )
}
