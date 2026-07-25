'use client'

/**
 * Admin · Student Intelligence — Rajan's watchtower.
 * Every student's engagement at a glance, at-risk students surfaced first, with
 * one-tap WhatsApp / email nudge links so a coordinator can act immediately —
 * even before the automated notification engine ships.
 */
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Health = 'healthy' | 'watch' | 'at_risk' | 'never_started'
interface StudentIntel {
  id: string; name: string; email: string | null; phone: string | null
  registrationNumber: string | null; paymentVerified: boolean; createdAt: string
  lastActiveAt: string | null; daysSinceActive: number | null
  engagementScore: number; materialsOpened: number; nodesCompleted: number
  mcqsCompleted: number; mcqAccuracy: number | null; studySessions: number
  centumIndex: number | null; attendanceIndex: number | null
  health: Health; reasons: string[]; priority: number
}
interface Payload {
  generatedAt: string
  summary: { total: number; paid: number; atRisk: number; watch: number; neverStarted: number; healthy: number; paidAtRisk: number }
  students: StudentIntel[]
}

const CARD = { background: '#FFFFFF', border: '1px solid #E5E7EB' }

const HEALTH: Record<Health, { label: string; fg: string; bg: string; dot: string }> = {
  at_risk:       { label: 'At risk',       fg: '#B91C1C', bg: 'rgba(239,68,68,0.08)',  dot: '#EF4444' },
  never_started: { label: 'Never started', fg: '#9A3412', bg: 'rgba(234,88,12,0.08)',  dot: '#EA580C' },
  watch:         { label: 'Watch',         fg: '#B45309', bg: 'rgba(245,158,11,0.10)', dot: '#F59E0B' },
  healthy:       { label: 'Healthy',       fg: '#15803D', bg: 'rgba(34,197,94,0.08)',  dot: '#22C55E' },
}

function fmtLast(days: number | null): string {
  if (days === null) return 'never'
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

// Prefilled, personal nudge — coordinator sends with one tap.
function waLink(phone: string | null, name: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const num = digits.length === 10 ? `91${digits}` : digits
  const text = encodeURIComponent(`Hi ${name.split(' ')[0]}, Rajan here from CentuMania 👋 Noticed you've been away — your daily test and streak are waiting. Shall I help you get back on track today?`)
  return `https://wa.me/${num}?text=${text}`
}
function mailLink(email: string | null, name: string): string | null {
  if (!email) return null
  const subject = encodeURIComponent('Your CentuMania streak is waiting 🎯')
  const body = encodeURIComponent(`Hi ${name.split(' ')[0]},\n\nWe noticed you've been away from CentuMania. Your daily test and study modules are ready whenever you are — consistency is what builds your Centum Index.\n\nJump back in: https://centumania.co.in/dashboard\n\n— Team CentuMania`)
  return `mailto:${email}?subject=${subject}&body=${body}`
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'danger' | 'warn' | 'ok' }) {
  const color = tone === 'danger' ? '#EF4444' : tone === 'warn' ? '#F59E0B' : tone === 'ok' ? '#22C55E' : '#0284c7'
  return (
    <div className="rounded-xl p-4" style={CARD}>
      <p className="text-[10px] font-semibold uppercase tracking-widest font-mono" style={{ color: '#6B7280' }}>{label}</p>
      <p className="mt-1.5 text-3xl font-semibold font-mono" style={{ color }}>{value}</p>
    </div>
  )
}

export default function StudentIntelPage() {
  const router = useRouter()
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'attention' | 'all'>('attention')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession()
    if (!session) { router.replace('/auth/login'); return }
    const res = await fetch('/api/admin/students-intel', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const needsAttention = (s: StudentIntel) => s.health === 'at_risk' || s.health === 'never_started' || s.health === 'watch'
  const rows = (data?.students ?? []).filter(s => filter === 'all' ? true : needsAttention(s))

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#111827', fontFamily: 'var(--font-fraunces,serif)' }}>Student Intelligence</h1>
          <p className="text-sm mt-0.5 font-mono" style={{ color: '#6B7280' }}>
            Who&apos;s engaged, who&apos;s drifting — refreshed live from activity data.
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB' }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl p-4 animate-pulse" style={CARD}><div className="h-3 w-16 bg-gray-100 rounded mb-3" /><div className="h-7 w-10 bg-gray-100 rounded" /></div>)}
        </div>
      ) : !data ? (
        <p className="text-sm" style={{ color: '#6B7280' }}>Couldn&apos;t load student data.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="Students" value={data.summary.total} />
            <StatCard label="Paid" value={data.summary.paid} tone="ok" />
            <StatCard label="Paid at-risk" value={data.summary.paidAtRisk} tone="danger" />
            <StatCard label="At risk" value={data.summary.atRisk} tone="danger" />
            <StatCard label="Never started" value={data.summary.neverStarted} tone="warn" />
            <StatCard label="Healthy" value={data.summary.healthy} tone="ok" />
          </div>

          <div className="flex items-center gap-2 mb-3">
            {(['attention', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
                style={filter === f ? { background: '#111827', color: '#fff' } : { background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                {f === 'attention' ? 'Needs attention' : 'All students'}
              </button>
            ))}
            <span className="text-[12px] font-mono ml-1" style={{ color: '#9CA3AF' }}>{rows.length} shown</span>
          </div>

          <div className="rounded-xl overflow-hidden" style={CARD}>
            {rows.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm" style={{ color: '#6B7280' }}>
                🎉 Nobody needs chasing right now — everyone&apos;s active.
              </p>
            ) : rows.map((s, i) => {
              const h = HEALTH[s.health]
              const wa = waLink(s.phone, s.name)
              const mail = mailLink(s.email, s.name)
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid #F3F4F6' }}>
                  {/* identity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold" style={{ color: '#111827' }}>{s.name}</span>
                      {s.paymentVerified
                        ? <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.10)', color: '#15803D' }}>Paid</span>
                        : <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: '#F3F4F6', color: '#6B7280' }}>Unpaid</span>}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: h.bg, color: h.fg }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: h.dot }} /> {h.label}
                      </span>
                    </div>
                    <p className="text-[11.5px] mt-0.5 font-mono truncate" style={{ color: '#9CA3AF' }}>
                      {s.registrationNumber ?? '—'} · last active {fmtLast(s.daysSinceActive)}
                      {s.reasons.length > 0 && <span style={{ color: '#B45309' }}> · {s.reasons[0]}</span>}
                    </p>
                  </div>
                  {/* metrics */}
                  <div className="flex items-center gap-4 shrink-0 text-center">
                    {[['Centum', s.centumIndex ?? '—'], ['Modules', s.materialsOpened], ['Nodes', s.nodesCompleted], ['Acc', s.mcqAccuracy != null ? `${s.mcqAccuracy}%` : '—']].map(([l, v]) => (
                      <div key={l as string}>
                        <p className="text-[13px] font-bold tabular-nums" style={{ color: '#111827' }}>{v as React.ReactNode}</p>
                        <p className="text-[9px] uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{l as string}</p>
                      </div>
                    ))}
                  </div>
                  {/* nudge actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold"
                        style={{ background: 'rgba(37,211,102,0.10)', color: '#128C3E', border: '1px solid rgba(37,211,102,0.25)' }}>
                        WhatsApp
                      </a>
                    )}
                    {mail && (
                      <a href={mail}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-bold"
                        style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] font-mono" style={{ color: '#9CA3AF' }}>
            Generated {new Date(data.generatedAt).toLocaleString('en-IN')} · nudge links are prefilled &amp; personal — automated sending ships in the next phase.
          </p>
        </>
      )}
    </div>
  )
}
