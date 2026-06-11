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

function MaterialCard({ m, token }: { m: Material; token: string }) {
  const [now, setNow]         = useState(() => Date.now())
  const [opening, setOpening] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const ms     = new Date(m.expiresAt).getTime() - now
  const urgent = ms > 0 && ms < 2 * 3600 * 1000

  async function openMaterial() {
    setOpening(true)
    setError(null)
    try {
      const res = await fetch(`/api/materials/open/${m.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 402) { setError('Your payment is pending. Contact your coordinator.'); return }
      if (res.status === 404) { setError('This material is no longer available.'); return }
      if (res.status === 401) { setError('Session expired. Please refresh the page.'); return }

      if (res.ok) {
        const { url } = await res.json()
        window.open(url, '_blank', 'noopener')
      }
    } catch {
      setError('Could not open material. Please try again.')
    } finally {
      setOpening(false)
    }
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
                style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.20)' }}>
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

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: 'rgba(232,115,107,0.08)', color: '#e8736b', border: '1px solid rgba(232,115,107,0.20)' }}>
          {error}
        </div>
      )}

      {m.hasContent ? (
        <button
          onClick={openMaterial}
          disabled={opening}
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg,rgba(74,222,128,0.12),rgba(94,200,192,0.08))',
            border: '1px solid rgba(74,222,128,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(74,222,128,0.15)' }}>
              {opening ? (
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ADE80' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-primary">Open Study Material</p>
              <p className="text-xs text-text-muted mt-0.5">Opens in a new tab</p>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #27342b' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa893" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p className="text-sm text-text-muted">Content not yet published.</p>
        </div>
      )}
    </Card>
  )
}

export default function MaterialsPage() {
  const router                          = useRouter()
  const [userName, setUserName]         = useState('')
  const [token,    setToken]            = useState('')
  const [materials, setMaterials]       = useState<Material[]>([])
  const [loading,   setLoading]         = useState(true)
  const [status,    setStatus]          = useState<'ok' | 'payment' | 'empty' | 'error'>('ok')

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUserName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '')
      setToken(session.access_token)

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
            style={{ background: 'rgba(231,177,76,0.08)', border: '1px solid rgba(231,177,76,0.18)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(231,177,76,0.12)' }}>
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
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(232,115,107,0.08)', border: '1px solid rgba(232,115,107,0.15)' }}>
            <p className="text-sm text-error">Failed to load. Please refresh.</p>
          </div>
        )}

        {status === 'empty' && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: '#16201a', border: '1px solid #27342b' }}>
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

        {materials.map(m => <MaterialCard key={m.id} m={m} token={token} />)}
      </div>
    </AppLayout>
  )
}
