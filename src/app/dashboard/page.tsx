'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken, trackEvent } from '@/src/lib/analytics/track'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { SkeletonDashboard } from '@/src/components/ui/Skeleton'
import { ProgressRing } from '@/src/components/ui/ProgressRing'
import { BatchProgress } from '@/src/components/dashboard/BatchProgress'
import { InsightsCard, type InsightsData } from '@/src/components/dashboard/InsightsCard'
import { CentumIndexCard, type CentumData } from '@/src/components/dashboard/CentumIndexCard'
import { CurrentAffairsWidget } from '@/src/components/dashboard/CurrentAffairsWidget'
import type { CurrentAffairsItem } from '@/src/app/api/current-affairs/route'

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
  centumIndex:       number
  nodeScore:         number
  attendanceScore:   number
  accuracyScore:     number
  depthScore:        number
  nodesOpened:       number
  nodesCompleted:    number
  mcqsDone:          number
  mcqsCorrect:       number
  activeDaysInBatch: number
  daysElapsed:       number
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
  if (pct >= 80) return '#22C55E'   // cm-success
  if (pct >= 60) return '#2563EB'   // cm-info
  if (pct >= 40) return '#FBBF24'   // cm-warning
  return '#9CA3AF'                   // neutral (avoid red near exam results)
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
  const [name,     setName]     = useState('Student')
  const [data,     setData]     = useState<DashData | null>(null)
  const [insights, setInsights] = useState<InsightsData>(null)
  const [currentAffairs, setCurrentAffairs] = useState<{ items: CurrentAffairsItem[]; generatedToday: boolean; todayDate: string } | null>(null)
  const [state,    setState]    = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchData = useCallback(async (token: string) => {
    try {
      const [dashRes, insightsRes, caRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/insights', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/current-affairs', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!dashRes.ok) { setState('error'); return }
      setData(await dashRes.json())
      if (insightsRes.ok) setInsights(await insightsRes.json())
      if (caRes.ok) setCurrentAffairs(await caRes.json())
      setState('ready')
    } catch { setState('error') }
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student')
      setCachedToken(session.access_token)
      trackEvent('login', {})
      fetchData(session.access_token)
    })
  }, [router, fetchData])

  const firstName = name.split(' ')[0]

  if (state === 'loading') {
    return <AppLayout userName={name}><div className="max-w-2xl mx-auto px-4 sm:px-6 py-8"><SkeletonDashboard /></div></AppLayout>
  }
  if (state === 'error') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center min-h-64 gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-error-subtle border border-error/20">
            <svg className="w-5 h-5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-sm text-text-secondary">Failed to load.{' '}
            <button className="text-primary font-semibold underline" onClick={() => setState('loading')}>Retry</button>
          </p>
        </div>
      </AppLayout>
    )
  }
  if (data?.paymentPending) {
    return (
      <AppLayout userName={name}>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(246,179,0,0.10)', border: '1px solid rgba(246,179,0,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F6B300] animate-pulse inline-block" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#F6B300' }}>
                Payment Pending
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text mb-2"
              style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', letterSpacing: '0.04em', fontSize: 32 }}>
              COMPLETE YOUR PAYMENT
            </h2>
            <div className="flex items-baseline justify-center gap-1 mb-3">
              <span className="text-lg font-bold" style={{ color: '#9CA3AF' }}>₹</span>
              <span className="font-bold leading-none"
                style={{ fontFamily: 'var(--font-bebas-neue,"Bebas Neue",sans-serif)', fontSize: 64, letterSpacing: '0.04em', color: '#F6B300' }}>
                999
              </span>
              <span className="text-xs font-semibold ml-1" style={{ color: '#6B7280' }}>one-time</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Scan the QR code or use the UPI ID below to pay and unlock full access.
            </p>
          </div>

          {/* QR Card */}
          <div className="rounded-2xl overflow-hidden mb-4"
            style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* QR Code */}
            <div className="flex flex-col items-center py-7 px-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <QrBox />
              <p className="text-xs text-text-muted font-mono mb-1">Scan with any UPI app</p>
              <p className="text-xs font-mono" style={{ color: '#9CA3AF' }}>
                PhonePe · GPay · Paytm · BHIM
              </p>
            </div>

            {/* UPI ID row */}
            <div className="px-5 py-4 flex items-center justify-between gap-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-mono text-text-muted mb-0.5">UPI ID</p>
                <p className="text-sm font-mono font-semibold text-text select-all">
                  anandhamuruugan-1@okicici
                </p>
              </div>
              <CopyButton value="anandhamuruugan-1@okicici" />
            </div>

            {/* Payee name */}
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest font-mono text-text-muted mb-0.5">Pay to</p>
              <p className="text-sm text-text font-medium">Anandh Muruugan</p>
            </div>
          </div>

          {/* After payment note */}
          <div className="rounded-xl px-4 py-3 flex items-start gap-3 mb-4"
            style={{ background: 'rgba(37,51,255,0.06)', border: '1px solid rgba(37,51,255,0.15)' }}>
            <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2533FF" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-text-secondary leading-relaxed">
              After paying, your coordinator will verify the payment and unlock your access — usually within a few hours.
            </p>
          </div>

          <p className="text-center text-xs text-text-muted">
            Already paid?{' '}
            <a href="https://wa.me/917200132957" className="text-primary font-semibold" target="_blank" rel="noopener noreferrer">
              Message us on WhatsApp →
            </a>
          </p>
        </div>
      </AppLayout>
    )
  }

  const d   = data!
  const lr    = d.leaderboard
  const progressPct = Math.round((d.daysAttended / (d.batchTotalDays || 25)) * 100)
  const dateLabel   = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const tipIdx      = new Date().getDate() % TIPS.length
  const daysLeft    = d.batchTotalDays - d.daysAttended

  const statItems = [
    { label: 'Rank',     value: lr ? `#${lr.rank}` : '—',            sub: lr?.percentile ? `top ${100 - lr.percentile + 1}%` : 'unranked', href: '/leaderboard' },
    { label: 'Score',    value: lr ? lr.score.toLocaleString() : '—', sub: 'total points',                                                   href: '/leaderboard' },
    { label: 'Days',     value: `${d.daysAttended}`,                  sub: `of ${d.batchTotalDays} days`,                                    href: '/profile'     },
    { label: 'Accuracy', value: lr ? `${lr.accuracy}%` : '—',        sub: 'avg accuracy',                                                    href: '/insights'    },
  ]

  return (
    <AppLayout userName={name}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── GREETING (slim header) ────────────────────────────── */}
        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-cm-neutral-300)' }}>{greeting()}</p>
            {/* Bebas Neue for name — large, confident */}
            <h1 className="font-bebas text-[42px] leading-none tracking-wide" style={{ color: '#F9FAFB' }}>{firstName}</h1>
            <p className="text-xs mt-1" style={{ color: 'var(--color-cm-neutral-300)' }}>{dateLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {daysLeft > 0 && (
              <span className="text-[11px] text-text-muted tabular">{daysLeft} days to go</span>
            )}
          </div>
        </div>

        {/* ── AI DAILY REVISION TEST ────────────────────────────── */}
        <DailyTestCard />

        {/* ── STATS STRIP — streak + standings ──────────────────── */}
        <Card noPadding>
          <div className="flex items-center gap-4 p-5">
            <div className="shrink-0">
              <ProgressRing
                value={Math.min(100, Math.round((d.daysAttended / (d.batchTotalDays || 30)) * 100))}
                size={84} strokeWidth={6}
                color={d.daysAttended >= 20 ? '#F6B300' : d.daysAttended >= 10 ? '#2533FF' : '#0EA5A0'}
                trackColor="rgba(255,255,255,0.08)"
                label={`${d.daysAttended}d`}
                sublabel="active"
              />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2.5">
              {statItems.map(({ label, value, sub, href }) => (
                <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                  <div className="rounded-xl px-3.5 py-2.5 transition-all duration-150 cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(37,51,255,0.10)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,51,255,0.3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-lg font-bold leading-none tracking-tight tabular" style={{ color: '#F9FAFB' }}>{value}</p>
                    <p className="text-[10px] mt-1 uppercase tracking-wider font-semibold" style={{ color: 'var(--color-cm-neutral-300)' }}>{label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#2533FF' }}>{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* ── QUICK STUDY ACTIONS ────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { href: '/materials',   icon: '📖', label: 'Study Now',    color: '#F6B300', bg: 'rgba(246,179,0,0.08)',   border: 'rgba(246,179,0,0.2)'  },
            { href: '/insights',    icon: '🧠', label: 'AI Insights',  color: '#818CF8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
            { href: '/leaderboard', icon: '🏆', label: 'Leaderboard',  color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'  },
          ].map(({ href, icon, label, color, bg, border }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div
                className="rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer"
                style={{ background: bg, border: `1px solid ${border}`, textAlign: 'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px ${color}25` }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.3 }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── CENTUM INDEX ──────────────────────────────────────── */}
        <CentumIndexCard data={{
          centumIndex:       d.centumIndex       ?? 0,
          nodeScore:         d.nodeScore         ?? 0,
          attendanceScore:   d.attendanceScore   ?? 0,
          accuracyScore:     d.accuracyScore     ?? 0,
          depthScore:        d.depthScore        ?? 0,
          nodesOpened:       d.nodesOpened       ?? 0,
          nodesCompleted:    d.nodesCompleted    ?? 0,
          mcqsDone:          d.mcqsDone          ?? 0,
          mcqsCorrect:       d.mcqsCorrect       ?? 0,
          activeDaysInBatch: d.activeDaysInBatch ?? 0,
          daysElapsed:       d.daysElapsed       ?? 0,
        }} />

        {/* ── BATCH PROGRESS BAR ────────────────────────────────── */}
        <BatchProgress attended={d.daysAttended} total={d.batchTotalDays} pct={progressPct} />

        {/* ── AI STUDY INSIGHTS ─────────────────────────────────── */}
        <InsightsCard data={insights} />

        {/* ── CURRENT AFFAIRS ───────────────────────────────────── */}
        {currentAffairs && (
          <CurrentAffairsWidget
            items={currentAffairs.items}
            generatedToday={currentAffairs.generatedToday}
            todayDate={currentAffairs.todayDate}
          />
        )}

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
            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px dashed var(--color-border)' }}>
              {[
                { col: '#10B981', label: '≥80%' },
                { col: '#0B3D91', label: '60–79%' },
                { col: '#F59E0B', label: '40–59%' },
                { col: '#EF4444', label: '<40%' },
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
                      borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
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
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg2)' }}>
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
            <Card hoverable className="text-center py-5 h-full">
              <BookOpenIcon className="w-7 h-7 text-primary mx-auto mb-2" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Continue Learning</p>
              <p className="text-[10px] text-text-muted mt-1">Study notes & guides</p>
            </Card>
          </Link>
        </div>

        {/* ── DAILY TIP ─────────────────────────────────────────── */}
        <div className="rounded-2xl px-5 py-4 flex items-start gap-4"
          style={{ background: 'rgba(14,165,160,0.08)', border: '1px solid rgba(14,165,160,0.20)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(14,165,160,0.15)', color: '#0EA5A0' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#0EA5A0' }}>
              Today&apos;s tip
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-cm-neutral-100)' }}>{TIPS[tipIdx]}</p>
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors"
      style={{ background: copied ? 'rgba(37,51,255,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: copied ? '#818cf8' : '#9CA3AF' }}>
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function DailyTestCard() {
  const [hovered, setHovered] = useState(false)
  return (
    <>
      <style>{`
        @keyframes cm-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(37,51,255,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(37,51,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,51,255,0); }
        }
      `}</style>
      <Link href="/study/daily-test" style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{
          background: hovered
            ? 'linear-gradient(135deg, rgba(37,51,255,0.18) 0%, rgba(14,165,160,0.12) 100%)'
            : 'linear-gradient(135deg, rgba(37,51,255,0.12) 0%, rgba(14,165,160,0.08) 100%)',
          border: `1px solid ${hovered ? 'rgba(37,51,255,0.45)' : 'rgba(37,51,255,0.25)'}`,
          borderRadius: 16, padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
          transition: 'all 0.2s', transform: hovered ? 'translateY(-1px)' : '',
          boxShadow: hovered ? '0 8px 28px rgba(37,51,255,0.2)' : '0 2px 12px rgba(37,51,255,0.08)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: 'rgba(37,51,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, animation: 'cm-pulse-ring 2s ease-out infinite',
          }}>🧠</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 17, letterSpacing: 1, color: '#fff' }}>
                AI Daily Revision Test
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, padding: '2px 6px', borderRadius: 4, background: 'rgba(37,51,255,0.2)', color: '#818CF8', border: '1px solid rgba(37,51,255,0.3)' }}>AI</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-cm-neutral-300)', lineHeight: 1.5 }}>
              Personalized questions from your weak topics · Generated every night at 11:30 PM IST
            </div>
          </div>
          <div style={{
            flexShrink: 0,
            background: hovered ? 'linear-gradient(135deg,#2533FF,#4F46E5)' : '#2533FF',
            color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700,
            whiteSpace: 'nowrap', transition: 'all 0.2s',
            boxShadow: hovered ? '0 4px 16px rgba(37,51,255,0.4)' : 'none',
          }}>
            Take Test →
          </div>
        </div>
      </Link>
    </>
  )
}

function QrBox() {
  const upiData = 'upi://pay?pa=anandhamuruugan-1@okicici&pn=Anandh Muruugan&cu=INR'
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiData)}&margin=10&color=000000&bgcolor=ffffff`
  const upiLink = 'upi://pay?pa=anandhamuruugan-1@okicici&pn=Anandh%20Muruugan&cu=INR'
  return (
    <a href={upiLink} className="rounded-2xl overflow-hidden mb-4 block"
      style={{ background: '#FFFFFF', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={qrSrc} alt="UPI QR — tap to pay" width={200} height={200}
        style={{ display: 'block' }} />
    </a>
  )
}
