'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type OpsData = {
  todayDate: string
  activeBatch: { id: string; name: string } | null
  students: { verified: number }
  dailyTest: { assignmentsGenerated: number; studyQuizSubmitted: number }
  currentAffairs: { publishedToday: number; activeTotal: number }
  centum: { calculatedDate: string | null; top: number; avg: number }
}

const CARD = { background: '#FFFFFF', border: '1px solid #E5E7EB' }

function StatCard({ label, value, sub, accent = 'teal' }: {
  label: string; value: string | number; sub?: string; accent?: 'green' | 'amber' | 'teal' | 'crimson'
}) {
  const accents = {
    green:   { text: '#0284c7', dot: 'rgba(2,132,199,0.6)' },
    amber:   { text: '#F59E0B', dot: 'rgba(245,158,11,0.6)' },
    teal:    { text: '#0284c7', dot: 'rgba(2,132,199,0.6)' },
    crimson: { text: '#EF4444', dot: 'rgba(239,68,68,0.6)' },
  }
  const a = accents[accent]
  return (
    <div className="rounded-xl p-5" style={CARD}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.dot, boxShadow: `0 0 6px ${a.dot}` }} />
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">{label}</p>
      </div>
      <p className="text-3xl font-semibold font-mono" style={{ color: a.text }}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

function ActionButton({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}
    >
      {children}
    </button>
  )
}

export default function OpsCenterPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [data, setData] = useState<OpsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<'assign' | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async (tok: string) => {
    setLoading(true)
    const res = await fetch('/api/admin/ops', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
      await load(session.access_token)
    })
  }, [router, load])

  async function trigger(kind: 'assign') {
    if (!token) return
    setTriggering(kind)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/ops/trigger-assignments', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const body = await res.json().catch(() => ({}))
      setMessage(res.ok
        ? 'Assignment generation triggered.'
        : `Failed: ${body?.error ?? res.statusText}`)
      if (res.ok) await load(token)
    } catch {
      setMessage('Request failed — check network/edge function logs.')
    } finally {
      setTriggering(null)
    }
  }

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Operations Center
        </h1>
        <p className="text-sm text-text-muted mt-0.5 font-mono">{dateLabel}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={CARD}>
              <div className="h-3 rounded w-24 mb-3 bg-gray-100" />
              <div className="h-8 rounded w-16 bg-gray-100" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-text-muted">Couldn't load operations data.</p>
      ) : (
        <>
          {message && (
            <div className="rounded-lg px-4 py-2.5 mb-6 text-sm" style={{ background: 'rgba(2,132,199,0.06)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.15)' }}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Verified students" value={data.students.verified} sub="Eligible for daily test" />
            <StatCard label="Daily test done" value={data.dailyTest.studyQuizSubmitted} sub={`of ${data.students.verified} eligible`} accent="green" />
            <StatCard label="Assignments generated" value={data.dailyTest.assignmentsGenerated} sub="Personalized, today" />
            <StatCard label="Current affairs today" value={data.currentAffairs.publishedToday} sub={`${data.currentAffairs.activeTotal} active total`} accent="amber" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Daily test control */}
            <div className="rounded-xl p-6" style={CARD}>
              <p className="text-sm font-semibold text-text mb-1">Daily test</p>
              <p className="text-xs text-text-muted mb-4">
                Personalized questions are generated nightly at 23:30 IST via QStash. Use this only if the nightly run failed or missed students.
              </p>
              <div className="flex gap-3 flex-wrap">
                <ActionButton onClick={() => trigger('assign')} disabled={triggering === 'assign'}>
                  {triggering === 'assign' ? 'Generating…' : 'Re-generate assignments'}
                </ActionButton>
                <Link href="/admin/exams" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                  Manage exams
                </Link>
              </div>
            </div>

            {/* Current affairs control */}
            <div className="rounded-xl p-6" style={CARD}>
              <p className="text-sm font-semibold text-text mb-1">Current affairs</p>
              <p className="text-xs text-text-muted mb-4">
                Served by the CAIE pipeline, which ingests and publishes automatically. No manual trigger here — monitor the feed and the CAIE workflows.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href="/current-affairs" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                  View feed
                </Link>
              </div>
            </div>
          </div>

          {/* Centum index */}
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-text">Centum index</p>
              <span className="text-xs text-text-muted font-mono">
                {data.centum.calculatedDate
                  ? `Last calculated ${new Date(data.centum.calculatedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  : 'Not yet calculated'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono mb-1">Top score</p>
                <p className="text-2xl font-semibold font-mono" style={{ color: '#0284c7' }}>{data.centum.top || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono mb-1">Batch average</p>
                <p className="text-2xl font-semibold font-mono">{data.centum.avg || '—'}</p>
              </div>
            </div>
            <Link href="/admin/centum" className="inline-block px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
              Open Centum leaderboard &amp; recalculate
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
