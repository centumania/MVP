'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonCard } from '@/src/components/ui/Skeleton'

type Material = {
  id: string; dayNumber: number; title: string
  hasPDF: boolean; hasPPT: boolean; hasVideo: boolean; hasMindMap: boolean
  videoUrl: string | null; publishedAt: string; expiresAt: string
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

function isLocalEmbed(url: string | null): boolean {
  return !!url && url.startsWith('/study/')
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function MaterialCard({ m }: { m: Material }) {
  const [expanded, setExpanded] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const ms      = new Date(m.expiresAt).getTime() - now
  const urgent  = ms > 0 && ms < 2 * 3600 * 1000
  const isEmbed = isLocalEmbed(m.videoUrl)
  const ytId    = m.videoUrl && !isEmbed ? getYouTubeId(m.videoUrl) : null

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono">Day {m.dayNumber}</p>
          <h2 className="text-base font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            {m.title}
          </h2>
        </div>
        <Badge variant={urgent ? 'error' : 'warning'} dot>{timeUntil(m.expiresAt, now)}</Badge>
      </div>

      {isEmbed && m.videoUrl && (
        <div className="mb-4">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center gap-3 py-8 rounded-xl transition-all"
              style={{ background: 'rgba(111,207,143,0.05)', border: '1px solid rgba(111,207,143,0.15)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6fcf8f" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <div className="text-left">
                <p className="text-sm font-semibold text-primary">Open Interactive Study Map</p>
                <p className="text-xs text-text-muted mt-0.5">Mind map with Study · Revise · Quiz modes</p>
              </div>
            </button>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #27342b' }}>
              <div className="flex items-center justify-between px-3 py-2"
                style={{ background: '#1b271f', borderBottom: '1px solid #27342b' }}>
                <span className="text-xs font-mono text-text-muted">{m.title}</span>
                <button onClick={() => setExpanded(false)}
                  className="text-xs text-text-muted hover:text-text transition-colors px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  ✕ Close
                </button>
              </div>
              <iframe src={m.videoUrl} className="w-full" style={{ height: '75vh', border: 'none' }} title={m.title} />
            </div>
          )}
          <a href={m.videoUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary-hover transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Open in full tab →
          </a>
        </div>
      )}

      {ytId && (
        <div className="relative w-full rounded-xl overflow-hidden mb-4" style={{ paddingTop: '56.25%', background: '#16201a' }}>
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={m.title} />
        </div>
      )}

      {m.hasVideo && m.videoUrl && !ytId && !isEmbed && (
        <a href={m.videoUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 mb-4 text-sm text-primary hover:text-primary-hover transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Watch video →
        </a>
      )}

      {m.hasMindMap && (
        <Link
          href={`/materials/mindmap/${m.id}`}
          className="flex items-center justify-between p-4 rounded-xl mb-4 transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,rgba(111,207,143,0.12),rgba(94,200,192,0.08))', border: '1px solid rgba(111,207,143,0.20)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(111,207,143,0.15)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6fcf8f" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <circle cx="4" cy="6" r="2"/><line x1="6" y1="6" x2="9" y2="10.5"/>
                <circle cx="20" cy="6" r="2"/><line x1="18" y1="6" x2="15" y2="10.5"/>
                <circle cx="4" cy="18" r="2"/><line x1="6" y1="18" x2="9" y2="13.5"/>
                <circle cx="20" cy="18" r="2"/><line x1="18" y1="18" x2="15" y2="13.5"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Open Interactive Study Map</p>
              <p className="text-xs text-text-muted mt-0.5">Full-screen mind map · Study · Revise · Quiz</p>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6fcf8f" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {isEmbed && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary"
            style={{ background: 'rgba(111,207,143,0.08)', border: '1px solid rgba(111,207,143,0.15)' }}>
            Interactive
          </span>
        )}
        {m.hasMindMap && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary"
            style={{ background: 'rgba(111,207,143,0.08)', border: '1px solid rgba(111,207,143,0.15)' }}>
            Interactive
          </span>
        )}
        {m.hasPDF && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(232,115,107,0.08)', border: '1px solid rgba(232,115,107,0.15)', color: '#e8736b' }}>
            PDF — via coordinator
          </span>
        )}
        {m.hasPPT && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(94,200,192,0.08)', border: '1px solid rgba(94,200,192,0.15)', color: '#5ec8c0' }}>
            Slides — via coordinator
          </span>
        )}
      </div>
    </Card>
  )
}

export default function MaterialsPage() {
  const router      = useRouter()
  const [userName, setUserName]   = useState('')
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading]     = useState(true)
  const [status, setStatus]       = useState<'ok' | 'payment' | 'empty' | 'error'>('ok')

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

        {materials.map(m => <MaterialCard key={m.id} m={m} />)}
      </div>
    </AppLayout>
  )
}
