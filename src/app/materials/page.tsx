'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { SkeletonCard } from '@/src/components/ui/Skeleton'
import { getUniqueDays, getMaterialsByDay, getProgramMeta } from '@/src/data/materials'
import type { Material } from '@/src/data/materials'

type Status = {
  paymentVerified:    boolean
  registrationNumber: string | null
  enrolledDate:       string
  activeDays:         number[]
  testLinks:          Record<number, string>
}

// Free preview days for unpaid students — Days 1–2 open, Day 3+ locked.
// Must match FREE_DAYS in src/app/api/materials/open/[id]/route.ts (server gate).
const FREE_DAYS = 2

// ── Design tokens — aligned with the study modules' visual language ──
const INK       = '#1A1A2E'   // module "centum-card" navy
const INK_SOFT  = '#111827'
const PAPER     = '#FFFFFF'
const HAIRLINE  = '#E7E5E0'
const MUTED     = '#6B7280'
const FAINT     = '#9CA3AF'
const GREEN     = '#16A34A'
const AMBER     = '#B45309'

function daysUntilUnlock(enrolledDate: string, dayNumber: number): number {
  const enrolled = new Date(enrolledDate)
  enrolled.setHours(0, 0, 0, 0)
  const unlock = new Date(enrolled)
  unlock.setDate(unlock.getDate() + (dayNumber - 1))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((unlock.getTime() - today.getTime()) / 86_400_000)
}

function StatusPill({ tone, children }: { tone: 'open' | 'locked' | 'pending'; children: React.ReactNode }) {
  const c = tone === 'open'
    ? { bg: 'rgba(22,163,74,0.08)',  fg: GREEN,   bd: 'rgba(22,163,74,0.22)',  dot: GREEN }
    : tone === 'pending'
    ? { bg: 'rgba(217,119,6,0.08)',  fg: '#d97706', bd: 'rgba(217,119,6,0.22)', dot: '#d97706' }
    : { bg: '#F4F3F0',               fg: MUTED,   bd: HAIRLINE,                dot: '#C4C2BD' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {children}
    </span>
  )
}

function DayHeader({ day, status }: { day: number; status: Status }) {
  const daysLeft           = daysUntilUnlock(status.enrolledDate, day)
  const isScheduleUnlocked = daysLeft <= 0
  const isPublished        = status.activeDays.includes(day)
  // Days 1–2 are the free preview — open to every registered student
  const isAvailable        = isScheduleUnlocked && isPublished && (status.paymentVerified || day <= FREE_DAYS)

  let badge: React.ReactNode
  if (!status.paymentVerified && day > FREE_DAYS) {
    badge = <StatusPill tone="pending">Payment required</StatusPill>
  } else if (isAvailable) {
    badge = <StatusPill tone="open">Open now</StatusPill>
  } else if (isScheduleUnlocked && !isPublished) {
    badge = <StatusPill tone="locked">Not published yet</StatusPill>
  } else {
    badge = <StatusPill tone="locked">Unlocks in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</StatusPill>
  }

  return (
    <div className="flex items-center gap-3 mt-10 mb-4 first:mt-2">
      <p className="text-[11px] font-extrabold uppercase shrink-0" style={{ color: INK_SOFT, letterSpacing: '0.18em' }}>
        Day {String(day).padStart(2, '0')}
      </p>
      {badge}
      <div className="flex-1 h-px" style={{ background: HAIRLINE }} />
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
    <div
      className="rounded-[20px] transition-all duration-200 hover:-translate-y-[2px]"
      style={{
        background: PAPER,
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 1px 2px rgba(17,24,39,0.04), 0 10px 30px rgba(17,24,39,0.05)',
        padding: '22px 24px 20px',
      }}
    >
      {/* Eyebrow row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        {m.subject && (
          <p className="text-[10px] font-extrabold uppercase" style={{ color: AMBER, letterSpacing: '0.16em' }}>
            {m.subject}
          </p>
        )}
        <span className="text-[9px] font-extrabold uppercase px-2 py-[3px] rounded-md shrink-0"
          style={{ background: INK, color: '#A5B4FC', letterSpacing: '0.14em' }}>
          Centum Path
        </span>
      </div>

      {/* Title + description */}
      <h2 className="text-[17px] font-bold leading-snug" style={{ color: INK_SOFT, letterSpacing: '-0.01em' }}>
        {m.title}
      </h2>
      {m.description && (
        <p className="text-[13px] leading-relaxed mt-1.5 max-w-[60ch]" style={{ color: MUTED }}>
          {m.description}
        </p>
      )}

      {/* Feature chips */}
      {m.features && m.features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3.5">
          {m.features.map(f => (
            <span key={f} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: '#F7F6F3', border: `1px solid ${HAIRLINE}`, color: '#4B5563' }}>
              {f}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(220,38,38,0.06)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.20)' }}>
          {error}
        </div>
      )}

      {/* Divider + action row */}
      <div className="h-px mt-4 mb-4" style={{ background: HAIRLINE }} />
      <div className="flex flex-wrap items-center gap-3">
        {isAvailable ? (
          <button
            onClick={openMaterial}
            disabled={opening}
            className="group flex items-center gap-2.5 pl-5 pr-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-60 hover:opacity-95 active:scale-[0.99]"
            style={{ background: INK, color: '#FFFFFF', boxShadow: '0 6px 18px rgba(26,26,46,0.22)' }}
          >
            {opening ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.35)', borderTopColor: '#FFFFFF' }} />
            ) : (
              <span>Begin studying</span>
            )}
            {!opening && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"
                className="transition-transform duration-150 group-hover:translate-x-0.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#F7F6F3', border: `1px solid ${HAIRLINE}`, color: FAINT }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Locked
          </div>
        )}

        {m.videoUrl && isAvailable && (
          <a href={m.videoUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(14,165,160,0.07)', border: '1px solid rgba(14,165,160,0.18)', color: '#0EA5A0' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Watch Video
          </a>
        )}

        {m.pdfPath && isAvailable && (
          <a href={m.pdfPath} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', color: '#6366f1' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            PDF Notes
          </a>
        )}

        {testLink && isAvailable && (
          <a href={testLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)', color: '#d97706' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Take Test
          </a>
        )}

        <div className="flex-1" />

        {/* Trust microcopy */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-medium" style={{ color: FAINT }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Progress feeds your Centum Index
        </div>
      </div>
    </div>
  )
}

function ComingSoonCard({ day }: { day: number }) {
  return (
    <div className="rounded-[20px] px-6 py-5"
      style={{ background: 'transparent', border: `1px dashed #D6D3CD` }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#F7F6F3', border: `1px solid ${HAIRLINE}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#4B5563' }}>Day {String(day).padStart(2, '0')} — Coming Soon</p>
          <p className="text-xs mt-0.5" style={{ color: FAINT }}>Content will be published before your scheduled day.</p>
        </div>
      </div>
    </div>
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
  const [programId,  setProgramId] = useState<string>('LDC')

  useEffect(() => {
    // The student's program comes from onboarding (/welcome) → their plan.
    try {
      const onb = JSON.parse(localStorage.getItem('cm_onboarding') || '{}')
      const map: Record<string, string> = { SSC: 'SSC', LDC: 'LDC', Banking: 'Banking' }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
      if (onb?.exam && map[onb.exam]) setProgramId(map[onb.exam])
    } catch { /* default LDC */ }
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

  const program = getProgramMeta(programId)
  const days   = getUniqueDays(programId)
  const maxDay = days.length ? Math.max(...days) : 0

  if (loading) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16">

        {/* ── Page header ── */}
        <div className="mb-2">
          <p className="text-[10px] font-extrabold uppercase mb-2" style={{ color: AMBER, letterSpacing: '0.22em' }}>
            CentuMania · {program.name} · {program.days}-Day Plan
          </p>
          <h1 className="text-[28px] font-extrabold leading-tight" style={{ color: INK_SOFT, letterSpacing: '-0.02em' }}>
            Study Modules
          </h1>
          <p className="text-[13.5px] mt-2 leading-relaxed max-w-[52ch]" style={{ color: MUTED }}>
            One day unlocks each morning. Every first attempt you make is recorded once —
            and builds your <span className="font-semibold" style={{ color: INK_SOFT }}>Centum Index</span>.
          </p>
        </div>

        {fetchErr && (
          <div className="p-4 rounded-2xl my-4" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.20)' }}>
            <p className="text-sm" style={{ color: '#DC2626' }}>Failed to load. Please refresh.</p>
          </div>
        )}

        {paymentErr && days.some(d => d > 1) && (
          <div className="flex items-start gap-4 p-5 rounded-2xl my-4"
            style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.20)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(217,119,6,0.12)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#d97706' }}>Payment verification pending</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                Complete your payment and contact your coordinator to unlock all modules.
              </p>
            </div>
          </div>
        )}

        {status && days.map(day => {
          const dayMaterials   = getMaterialsByDay(day, programId)
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
          // Days 1–2 are the free preview — open to every registered student
          const isAvailable        = isScheduleUnlocked && isPublished && (status.paymentVerified || day <= FREE_DAYS)

          return (
            <div key={day}>
              <DayHeader day={day} status={status} />
              <div className="space-y-4">
                {dayMaterials.map(m => (
                  <MaterialCard
                    key={m.id}
                    m={m}
                    token={token}
                    registrationNumber={status.registrationNumber}
                    isAvailable={isAvailable}
                    testLink={status.testLinks?.[day]}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* ── Next unlock teaser ── */}
        {status && maxDay > 0 && (
          <div className="flex items-center gap-3 mt-10 mb-4">
            <p className="text-[11px] font-extrabold uppercase shrink-0" style={{ color: FAINT, letterSpacing: '0.18em' }}>
              Day {String(maxDay + 1).padStart(2, '0')}
            </p>
            <StatusPill tone="locked">Publishes at 6:00 AM IST</StatusPill>
            <div className="flex-1 h-px" style={{ background: HAIRLINE }} />
          </div>
        )}
        {status && maxDay > 0 && (
          <div className="rounded-[20px] px-6 py-5" style={{ border: '1px dashed #D6D3CD' }}>
            <p className="text-sm font-bold" style={{ color: '#4B5563' }}>Tomorrow&apos;s material is being prepared</p>
            <p className="text-xs mt-0.5" style={{ color: FAINT }}>
              A new day of the programme opens every morning. Finish today&apos;s Centum Path to keep your streak alive.
            </p>
          </div>
        )}

        {/* ── Trust footer ── */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p className="text-[11px] font-medium" style={{ color: FAINT }}>
            First-attempt accuracy is recorded once and never rewritten — that is what makes the Centum Index trustworthy.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
