'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card } from '@/src/components/ui/Card'
import { SkeletonCard } from '@/src/components/ui/Skeleton'
import { materials, getUniqueDays, getMaterialsByDay } from '@/src/data/materials'
import type { Material } from '@/src/data/materials'

type Status = {
  paymentVerified:    boolean
  registrationNumber: string | null
  enrolledDate:       string
  activeDays:         number[]
  testLinks:          Record<number, string>
}

function daysUntilUnlock(enrolledDate: string, dayNumber: number): number {
  const enrolled = new Date(enrolledDate)
  enrolled.setHours(0, 0, 0, 0)
  const unlock = new Date(enrolled)
  unlock.setDate(unlock.getDate() + (dayNumber - 1))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((unlock.getTime() - today.getTime()) / 86_400_000)
}

function DayHeader({ day, status }: { day: number; status: Status }) {
  const daysLeft           = daysUntilUnlock(status.enrolledDate, day)
  const isScheduleUnlocked = daysLeft <= 0
  const isPublished        = status.activeDays.includes(day)
  const isAvailable        = isScheduleUnlocked && isPublished && status.paymentVerified

  let badge: React.ReactNode
  if (!status.paymentVerified) {
    badge = <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(231,177,76,0.12)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.2)' }}>Payment required</span>
  } else if (isAvailable) {
    badge = <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)' }}>Open today</span>
  } else if (isScheduleUnlocked && !isPublished) {
    badge = <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#9aa893' }}>Not published yet</span>
  } else {
    badge = <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#9aa893' }}>Unlocks in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
  }

  return (
    <div className="flex items-center gap-3 mt-6 mb-2">
      <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest font-mono">Day {day}</p>
      {badge}
    </div>
  )
}

function MaterialCard({
  m,
  token,
  registrationNumber,
  isAvailable,
  testLink,
}: {
  m: Material
  token: string
  registrationNumber: string | null
  isAvailable: boolean
  testLink?: string
}) {
  const router = useRouter()
  const [opening, setOpening] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function openMaterial() {
    if (!isAvailable || !registrationNumber) return
    setOpening(true)
    setError(null)
    try {
      const res = await fetch('/api/materials/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setError('Could not open material. Please try again.'); return }
      router.push(`/materials/${registrationNumber}/${m.id}`)
    } catch {
      setError('Could not open material. Please try again.')
    } finally {
      setOpening(false)
    }
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-text" style={{ fontFamily: 'var(--font-inter,Inter,sans-serif)', letterSpacing: '0.01em' }}>
          {m.title}
        </h2>
        {m.description && <p className="text-xs text-text-muted mt-0.5">{m.description}</p>}
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: 'rgba(232,115,107,0.08)', color: '#e8736b', border: '1px solid rgba(232,115,107,0.20)' }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isAvailable ? (
          <button
            onClick={openMaterial}
            disabled={opening}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,rgba(74,222,128,0.12),rgba(94,200,192,0.08))', border: '1px solid rgba(74,222,128,0.25)', color: '#4ADE80' }}
          >
            {opening ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ADE80' }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            )}
            Open Study Material
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #27342b', color: '#9aa893' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Locked
          </div>
        )}

        {m.videoUrl && isAvailable && (
          <a href={m.videoUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(94,200,192,0.08)', border: '1px solid rgba(94,200,192,0.20)', color: '#5ec8c0' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Watch Video
          </a>
        )}

        {m.pdfPath && isAvailable && (
          <a href={m.pdfPath} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(168,139,250,0.08)', border: '1px solid rgba(168,139,250,0.20)', color: '#a88bfa' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            PDF Notes
          </a>
        )}

        {testLink && isAvailable && (
          <a href={testLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(231,177,76,0.08)', border: '1px solid rgba(231,177,76,0.20)', color: '#e7b14c' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Take Test
          </a>
        )}
      </div>
    </Card>
  )
}

function ComingSoonCard({ day }: { day: number }) {
  return (
    <Card>
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#16201a', border: '1px solid #27342b' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa893" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-secondary" style={{ fontFamily: 'var(--font-inter,Inter,sans-serif)' }}>
            Day {day} — Coming Soon
          </p>
          <p className="text-xs text-text-muted mt-0.5">Content will be published before your scheduled day.</p>
        </div>
      </div>
    </Card>
  )
}

export default function MaterialsPage() {
  const router                     = useRouter()
  const [userName,   setUserName]  = useState('')
  const [token,      setToken]     = useState('')
  const [status,     setStatus]    = useState<Status | null>(null)
  const [loading,    setLoading]   = useState(true)
  const [fetchErr,   setFetchErr]  = useState(false)
  const [paymentErr, setPaymentErr]= useState(false)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUserName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '')
      setToken(session.access_token)

      const res = await fetch('/api/materials/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 401) { router.replace('/auth/login'); return }
      if (!res.ok) { setFetchErr(true); setLoading(false); return }

      const data = await res.json() as Status
      if (!data.paymentVerified) setPaymentErr(true)
      setStatus(data)
      setLoading(false)
    })
  }, [router])

  const days = getUniqueDays()

  if (loading) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Study Materials
          </h1>
          <p className="text-sm text-text-muted mt-1">30-day programme · one day unlocks each morning.</p>
        </div>

        {fetchErr && (
          <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(232,115,107,0.08)', border: '1px solid rgba(232,115,107,0.15)' }}>
            <p className="text-sm text-error">Failed to load. Please refresh.</p>
          </div>
        )}

        {paymentErr && (
          <div className="flex items-start gap-4 p-5 rounded-2xl mb-4"
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
                Complete your payment and contact your coordinator to unlock all materials.
              </p>
            </div>
          </div>
        )}

        {status && days.map(day => {
          const dayMaterials   = getMaterialsByDay(day)
          const isStaticLocked = dayMaterials.every(m => m.isStaticLocked)

          if (isStaticLocked) {
            return (
              <div key={day}>
                <DayHeader day={day} status={status} />
                <ComingSoonCard day={day} />
              </div>
            )
          }

          const daysLeft           = daysUntilUnlock(status.enrolledDate, day)
          const isScheduleUnlocked = daysLeft <= 0
          const isPublished        = status.activeDays.includes(day)
          const isAvailable        = isScheduleUnlocked && isPublished && status.paymentVerified

          return (
            <div key={day}>
              <DayHeader day={day} status={status} />
              {dayMaterials.map(m => (
                <div key={m.id} className="mb-3">
                  <MaterialCard
                    m={m}
                    token={token}
                    registrationNumber={status.registrationNumber}
                    isAvailable={isAvailable}
                    testLink={status.testLinks?.[day]}
                  />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </AppLayout>
  )
}
