'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import type { CAIEUserStats } from '@/src/lib/caie/types'

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const
const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   '#10B981',
  medium: '#F6B300',
  hard:   '#EF4444',
}

function StatBar({ label, attempted, correct, color }: {
  label: string; attempted: number; correct: number; color: string
}) {
  const pct = attempted > 0 ? Math.round(100 * correct / attempted) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold capitalize" style={{ color }}>{label}</span>
        <span className="text-[11px]" style={{ color: '#6B7280' }}>
          {correct}/{attempted} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function AccuracyRing({ pct }: { pct: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F6B300' : '#EF4444'

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8"/>
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" fill="#F9FAFB" fontSize="18" fontWeight="700">{pct}%</text>
      <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">accuracy</text>
    </svg>
  )
}

export default function ProgressPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('Student')
  const [stats, setStats]   = useState<CAIEUserStats | null>(null)
  const [state, setState]   = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const name = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setUserName(name)

      try {
        const res = await fetch('/api/caie/attempts/stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) { setState('error'); return }
        const data: CAIEUserStats = await res.json()
        setStats(data)
        setState(data.total_attempted === 0 ? 'empty' : 'ready')
      } catch { setState('error') }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppLayout userName={userName}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/current-affairs"
            className="text-sm"
            style={{ color: '#6B7280' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline -mt-0.5 mr-1">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Current Affairs
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#111827' }}>
          My Progress
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          MCQ practice performance across all current affairs
        </p>

        {state === 'loading' && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-24 animate-pulse"
                style={{ background: '#F9FAFB' }} />
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[15px] font-semibold" style={{ color: '#EF4444' }}>Failed to load</p>
          </div>
        )}

        {state === 'empty' && (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: '#111827' }}>
              No attempts yet
            </p>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
              Answer MCQs on any event to start tracking your progress.
            </p>
            <Link
              href="/current-affairs"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#0284c7', color: '#fff' }}
            >
              Browse events
            </Link>
          </div>
        )}

        {state === 'ready' && stats && (
          <div className="space-y-5">

            {/* Overall card */}
            <div className="rounded-2xl p-6"
              style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div className="flex items-center gap-6">
                <AccuracyRing pct={stats.accuracy} />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-1"
                      style={{ color: 'rgba(0,0,0,0.35)' }}>Attempted</p>
                    <p className="text-2xl font-bold" style={{ color: '#111827' }}>
                      {stats.total_attempted}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-1"
                      style={{ color: 'rgba(0,0,0,0.35)' }}>Correct</p>
                    <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                      {stats.total_correct}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-1"
                      style={{ color: 'rgba(0,0,0,0.35)' }}>Wrong</p>
                    <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                      {stats.total_attempted - stats.total_correct}
                    </p>
                  </div>
                </div>
              </div>
              {stats.total_attempted - stats.total_correct > 0 && (
                <Link
                  href="/current-affairs/revision"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Revise {stats.total_attempted - stats.total_correct} wrong answer{stats.total_attempted - stats.total_correct === 1 ? '' : 's'}
                </Link>
              )}
            </div>

            {/* By difficulty */}
            {Object.keys(stats.by_difficulty).length > 0 && (
              <div className="rounded-2xl p-6"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-4"
                  style={{ color: 'rgba(0,0,0,0.35)' }}>By Difficulty</p>
                <div className="space-y-4">
                  {DIFFICULTY_ORDER
                    .filter(d => stats.by_difficulty[d])
                    .map(d => (
                      <StatBar
                        key={d}
                        label={d}
                        attempted={stats.by_difficulty[d].attempted}
                        correct={stats.by_difficulty[d].correct}
                        color={DIFFICULTY_COLOR[d]}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* By exam type */}
            {Object.keys(stats.by_exam_type).length > 0 && (
              <div className="rounded-2xl p-6"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-4"
                  style={{ color: 'rgba(0,0,0,0.35)' }}>By Exam</p>
                <div className="space-y-4">
                  {Object.entries(stats.by_exam_type)
                    .sort(([, a], [, b]) => b.attempted - a.attempted)
                    .map(([et, s]) => (
                      <StatBar
                        key={et}
                        label={et.replace('_', ' ')}
                        attempted={s.attempted}
                        correct={s.correct}
                        color="#0284c7"
                      />
                    ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </AppLayout>
  )
}
