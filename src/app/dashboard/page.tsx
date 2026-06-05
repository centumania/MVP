'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonDashboard } from '@/src/components/ui/Skeleton'
import { ProgressRing } from '@/src/components/ui/ProgressRing'
import { ExamCard } from '@/src/components/dashboard/ExamCard'
import { BatchProgress } from '@/src/components/dashboard/BatchProgress'
import type { ExamWindowStatus } from '@/src/types/database'

// ── Types ──────────────────────────────────────────────────────────
type HistoryItem = { dayNumber: number | null; score: number; totalMarks: number; pct: number; submittedAt: string }
type TodayExam = { dayNumber: number; examId: string; alreadySubmitted: boolean; score?: number; totalMarks?: number }
type DashData = {
  paymentPending: boolean
  todayExam: TodayExam | null
  batchTotalDays: number
  leaderboard: { rank: number; score: number; days: number; accuracy: number; percentile: number | null } | null
  xp: number; xpLevel: number; xpInLevel: number; xpToNext: number
  streak: number; daysAttended: number
  last7: { score: number; totalMarks: number; pct: number }[]
  history: HistoryItem[]
}

// ── Helpers ────────────────────────────────────────────────────────
function greeting() {
  const h = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours()
  if (h < 5)  return 'Rise and grind'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Still grinding'
}
function ordinal(n: number) {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
function scoreColor(pct: number): string {
  if (pct >= 80) return '#6fcf8f'
  if (pct >= 60) return '#5ec8c0'
  if (pct >= 40) return '#e7b14c'
  return '#e8736b'
}

// ── Daily tips ─────────────────────────────────────────────────────
const TIPS = [
  'Review previous mistakes before each exam — not new topics.',
  'Attempt every question; eliminate obviously wrong options first.',
  'Read the question stem twice before looking at options.',
  'If stuck, mark and come back. Never leave a question blank.',
  'Sleep 7+ hours before exam day. Recall drops 40% on poor sleep.',
  'Revise notes within 24 hours. Retention jumps from 30% to 80%.',
  'Confidence matters. Every question you attempted is a win.',
]

// ── Page ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [name,   setName]   = useState('Student')
  const [data,   setData]   = useState<DashData | null>(null)
  const [window, setWindow] = useState<ExamWindowStatus | null>(null)
  const [state,  setState]  = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchData = useCallback(async (token: string) => {
    try {
      const [dashRes, winRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/exam/window'),
      ])
      if (!dashRes.ok) { setState('error'); return }
      setData(await dashRes.json())
      setWindow(await winRes.json())
      setState('ready')
    } catch { setState('error') }
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student')
      fetchData(session.access_token)
    })
    // Only poll the window endpoint every 30s — avoid full dashboard refetch on each tick
    const id = setInterval(async () => {
      const winRes = await fetch('/api/exam/window')
      if (winRes.ok) setWindow(await winRes.json())
    }, 30_000)
    return () => clearInterval(id)
  }, [router, fetchData])

  const firstName = name.split(' ')[0]

  if (state === 'loading') {
    return <AppLayout userName={name}><div className="max-w-2xl mx-auto px-4 sm:px-6 py-8"><SkeletonDashboard /></div></AppLayout>
  }
  if (state === 'error') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center min-h-64 gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.20)' }}>
            <svg className="w-5 h-5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-sm text-text-secondary">Failed to load.{' '}
            <button className="text-primary underline" onClick={() => setState('loading')}>Retry</button>
          </p>
        </div>
      </AppLayout>
    )
  }
  if (data?.paymentPending) {
    return (
      <AppLayout userName={name}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(231,177,76,0.10)', border: '1px solid rgba(231,177,76,0.20)' }}>
            <svg className="w-7 h-7 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Enrolment pending
          </h2>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Your registration is complete. Contact your coordinator to complete payment and unlock full access.
          </p>
        </div>
      </AppLayout>
    )
  }

  const d   = data!
  const w   = window
  const today = d.todayExam
  const lr    = d.leaderboard
  const progressPct = Math.round((d.daysAttended / (d.batchTotalDays || 25)) * 100)
  const xpPct       = Math.round((d.xpInLevel / d.xpToNext) * 100)
  const dateLabel   = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const tipIdx      = new Date().getDate() % TIPS.length
  const daysLeft    = d.batchTotalDays - d.daysAttended

  const statItems = [
    { label: 'Rank',     value: lr ? `#${lr.rank}` : '—',            sub: lr?.percentile ? `top ${100 - lr.percentile + 1}%` : 'unranked' },
    { label: 'Score',    value: lr ? lr.score.toLocaleString() : '—', sub: 'total points' },
    { label: 'Streak',   value: `${d.streak}`,                        sub: `day${d.streak !== 1 ? 's' : ''} 🔥` },
    { label: 'Progress', value: `${d.daysAttended}/${d.batchTotalDays}`, sub: `${progressPct}% done` },
  ]

  return (
    <AppLayout userName={name} batchName="LDC Batch · 2026">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#112215 0%,#0d1c10 60%,#112219 100%)', border: '1px solid rgba(111,207,143,0.12)' }}>
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle,#6fcf8f,transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle,#3fae6a,transparent 70%)' }} />

          <div className="relative p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1 font-mono">{greeting()}</p>
                <h1 className="text-2xl font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                  {firstName}
                </h1>
                <p className="text-xs text-text-muted mt-1 font-mono">{dateLabel}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {w && (
                  <Badge variant={w.isOpen ? 'success' : 'neutral'} dot>
                    {w.isOpen ? 'Exam live' : 'Closed'}
                  </Badge>
                )}
                {daysLeft > 0 && (
                  <span className="text-[10px] font-mono text-text-muted">{daysLeft} days left</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="shrink-0">
                <ProgressRing
                  value={xpPct} size={84} strokeWidth={5}
                  color="#6fcf8f" trackColor="rgba(111,207,143,0.10)"
                  label={`Lv${d.xpLevel}`} sublabel={`${d.xpInLevel}xp`}
                />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2.5">
                {statItems.map(({ label, value, sub }) => (
                  <div key={label} className="rounded-2xl px-3.5 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-lg font-bold text-text font-mono leading-none tracking-tight">{value}</p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-mono">{label}</p>
                    <p className="text-[10px] text-primary/70 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── EXAM CARD ─────────────────────────────────────────── */}
        {w && <ExamCard w={w} today={today} />}

        {/* ── BATCH PROGRESS BAR ────────────────────────────────── */}
        <BatchProgress attended={d.daysAttended} total={d.batchTotalDays} pct={progressPct} />

        {/* ── PERFORMANCE TREND + EXAM HISTORY ─────────────────── */}
        {d.last7.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Performance trend</CardLabel>
              <span className="text-xs text-text-muted font-mono">last {d.last7.length} exams</span>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {d.last7.map((s, i) => {
                const barH = Math.max(8, (s.pct / 100) * 64)
                const col  = scoreColor(s.pct)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] text-text-muted font-mono">{s.pct}%</span>
                    <div className="w-full rounded-t-md"
                      style={{ height: barH, background: col, opacity: 0.85 }} />
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px dashed #27342b' }}>
              {[
                { col: '#6fcf8f', label: '≥80%' },
                { col: '#5ec8c0', label: '60–79%' },
                { col: '#e7b14c', label: '40–59%' },
                { col: '#e8736b', label: '<40%' },
              ].map(({ col, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: col }} />
                  <span className="text-[9px] text-text-muted font-mono">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── EXAM HISTORY TABLE ────────────────────────────────── */}
        {d.history && d.history.length > 0 && (
          <Card noPadding>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <CardLabel>Exam history</CardLabel>
              <span className="text-[10px] font-mono text-text-muted">{d.history.length} submissions</span>
            </div>
            <div>
              {d.history.map((h, i) => {
                const col = scoreColor(h.pct)
                const date = new Date(h.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-3 transition-colors"
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(39,52,43,0.7)' : undefined,
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono text-sm font-bold"
                      style={{ background: `${col}15`, color: col, border: `1px solid ${col}30` }}>
                      D{h.dayNumber ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text font-mono" style={{ color: col }}>
                          {h.score}/{h.totalMarks}
                        </span>
                        <span className="text-xs text-text-muted font-mono">({h.pct}%)</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: col }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono shrink-0">{date}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/leaderboard">
            <Card hoverable className="text-center py-5">
              {lr ? (
                <>
                  <p className="text-3xl font-bold text-text font-mono tracking-tight">#{lr.rank}</p>
                  <p className="text-xs font-semibold text-primary mt-1 uppercase tracking-widest font-mono">Leaderboard</p>
                  {lr.percentile && <p className="text-[10px] text-text-muted mt-1">{ordinal(lr.rank)} · top {100 - lr.percentile + 1}%</p>}
                </>
              ) : (
                <>
                  <TrophyIcon className="w-7 h-7 text-text-muted mx-auto mb-2" />
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest font-mono">Leaderboard</p>
                </>
              )}
            </Card>
          </Link>
          <Link href="/materials">
            <Card hoverable className="text-center py-5">
              <BookOpenIcon className="w-7 h-7 text-primary mx-auto mb-2" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest font-mono">Materials</p>
              <p className="text-[10px] text-text-muted mt-1">Bio Map + more</p>
            </Card>
          </Link>
        </div>

        {/* ── DAILY TIP ─────────────────────────────────────────── */}
        <div className="rounded-2xl px-5 py-4 flex items-start gap-4"
          style={{ background: 'rgba(94,200,192,0.06)', border: '1px solid rgba(94,200,192,0.15)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(94,200,192,0.12)', color: '#5ec8c0' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest font-mono mb-1" style={{ color: '#5ec8c0' }}>
              Today&apos;s tip
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{TIPS[tipIdx]}</p>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

// ExamCard and BatchProgress are now in src/components/dashboard/

// ── Icons ──────────────────────────────────────────────────────────
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  )
}
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}
