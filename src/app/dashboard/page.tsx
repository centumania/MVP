'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { SkeletonDashboard } from '@/src/components/ui/Skeleton'
import type { ExamWindowStatus } from '@/src/types/database'

type TodayExam = {
  dayNumber: number; examId: string; alreadySubmitted: boolean
  score?: number; totalMarks?: number
}

type DashData = {
  paymentPending: boolean
  todayExam: TodayExam | null
  batchTotalDays: number
  leaderboard: { rank: number; score: number; days: number; accuracy: number; percentile: number | null } | null
  xp: number; xpLevel: number; xpInLevel: number; xpToNext: number
  streak: number
  daysAttended: number
  last7: { score: number; totalMarks: number; pct: number }[]
}

function greeting() {
  const h = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ordinal(n: number) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function DashboardPage() {
  const router  = useRouter()
  const [name,  setName]  = useState('Student')
  const [data,  setData]  = useState<DashData | null>(null)
  const [window, setWindow] = useState<ExamWindowStatus | null>(null)
  const [state,  setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchData = useCallback(async (token: string) => {
    try {
      const [dashRes, winRes] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/exam/window'),
      ])
      const dash: DashData = await dashRes.json()
      const win: ExamWindowStatus = await winRes.json()
      setData(dash)
      setWindow(win)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const n = session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student'
      setName(n)
      fetchData(session.access_token)
    })
    const id = setInterval(() => {
      getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
        if (session) fetchData(session.access_token)
      })
    }, 60_000)
    return () => clearInterval(id)
  }, [router, fetchData])

  const firstName = name.split(' ')[0]

  if (state === 'loading') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8"><SkeletonDashboard /></div>
      </AppLayout>
    )
  }

  if (state === 'error') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-sm text-error">Failed to load. <button className="text-primary underline" onClick={() => setState('loading')}>Retry</button></p>
        </div>
      </AppLayout>
    )
  }

  if (data?.paymentPending) {
    return (
      <AppLayout userName={name}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-14 h-14 bg-warning-subtle rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Enrolment pending</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your registration is complete. Contact your coordinator to complete payment and unlock full access.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const d = data!
  const w = window
  const today = d.todayExam
  const lr = d.leaderboard

  const progressPct  = Math.round((d.daysAttended / (d.batchTotalDays || 25)) * 100)
  const dateLabel    = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AppLayout userName={name} batchName="LDC Batch · 2026">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="bg-navy rounded-2xl px-6 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-slate-400 text-sm">{greeting()}</p>
                <h1 className="text-2xl font-semibold text-white mt-0.5">{firstName}</h1>
                <p className="text-slate-400 text-xs mt-1">{dateLabel}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500 mb-0.5">XP Level {d.xpLevel}</p>
                <p className="text-2xl font-semibold text-white font-mono">{d.xp.toLocaleString()}</p>
                <p className="text-xs text-primary">XP</p>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-slate-500">Level {d.xpLevel}</span>
                <span className="text-xs text-slate-500">{d.xpInLevel} / {d.xpToNext} XP to Level {d.xpLevel + 1}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (d.xpInLevel / d.xpToNext) * 100)}%` }}
                />
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Rank',     value: lr ? `#${lr.rank}` : '—',    sub: lr?.percentile ? `Top ${100 - lr.percentile + 1}%` : '' },
                { label: 'Score',    value: lr ? lr.score.toLocaleString() : '—', sub: 'total points' },
                { label: 'Streak',   value: `${d.streak}d`,               sub: d.streak > 0 ? '🔥 keep going' : 'start one' },
                { label: 'Days',     value: `${d.daysAttended}/${d.batchTotalDays}`, sub: `${progressPct}% done` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-white font-mono">{value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                  {sub && <p className="text-[9px] text-primary mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Exam card ─────────────────────────────────────────────── */}
        {w && <ExamCard w={w} today={today} />}

        {/* ── Performance trend ─────────────────────────────────────── */}
        {d.last7.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardLabel>Recent performance</CardLabel>
              {lr && (
                <span className="text-xs text-text-muted font-mono">{lr.accuracy}% avg accuracy</span>
              )}
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {d.last7.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height:     `${Math.max(8, s.pct * 0.6)}px`,
                      background: s.pct >= 80 ? '#10B981' : s.pct >= 60 ? '#0EA5E9' : s.pct >= 40 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                  <span className="text-[10px] text-text-muted font-mono">{s.pct}%</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">{d.last7.length} days ago</span>
              <span className="text-[10px] text-text-muted">Today</span>
            </div>
          </Card>
        )}

        {/* ── Journey progress ──────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardLabel>Journey progress</CardLabel>
            <span className="text-xs font-semibold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2 bg-surface-overlay rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Day 1</span>
            <span className="text-xs text-text-secondary font-medium">
              {d.daysAttended} of {d.batchTotalDays} days completed
            </span>
            <span className="text-xs text-text-muted">Day {d.batchTotalDays}</span>
          </div>
        </Card>

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/leaderboard">
            <Card hoverable className="text-center">
              {lr ? (
                <>
                  <p className="text-2xl font-semibold text-text font-mono">#{lr.rank}</p>
                  <p className="text-sm font-medium text-text mt-1">Leaderboard</p>
                  {lr.percentile && <p className="text-xs text-primary mt-0.5">Top {100 - lr.percentile + 1}% · {ordinal(lr.rank)} place</p>}
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-sm font-medium text-text">Leaderboard</p>
                  <p className="text-xs text-text-muted mt-0.5">See your rank</p>
                </>
              )}
            </Card>
          </Link>
          <Link href="/materials">
            <Card hoverable className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm font-medium text-text">Materials</p>
              <p className="text-xs text-text-muted mt-0.5">Study content</p>
            </Card>
          </Link>
        </div>

      </div>
    </AppLayout>
  )
}

// ── Exam card ──────────────────────────────────────────────────────────

function ExamCard({ w, today }: { w: ExamWindowStatus; today: TodayExam | null }) {
  if (today?.alreadySubmitted) {
    const pct = today.totalMarks ? Math.round(((today.score ?? 0) / today.totalMarks) * 100) : 0
    return (
      <Card>
        <CardLabel className="mb-3">Today&apos;s result</CardLabel>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-semibold text-text font-mono">{today.score}</span>
          <span className="text-text-secondary text-lg mb-0.5">/ {today.totalMarks}</span>
          <span className={`ml-auto text-sm font-semibold ${pct >= 80 ? 'text-success' : pct >= 60 ? 'text-primary' : pct >= 40 ? 'text-warning' : 'text-error'}`}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-surface-overlay rounded-full overflow-hidden mb-3">
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <Link href={`/exam/${today.dayNumber}`}>
          <Button variant="ghost" size="sm" className="-ml-2">View answer key →</Button>
        </Link>
      </Card>
    )
  }

  if (w.isOpen && today) {
    return (
      <Card highlight className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <CardLabel className="text-success">Live now</CardLabel>
          </div>
          <p className="text-2xl font-semibold text-text mb-0.5">Closes in {w.closesIn}</p>
          <p className="text-sm text-text-secondary mb-5">Window closes at 8:30 AM IST. No late submissions.</p>
          <Link href={`/exam/${today.dayNumber}`}>
            <Button size="lg" fullWidth>Attempt exam — Day {today.dayNumber}</Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (!w.isOpen && w.opensIn) {
    return (
      <Card>
        <CardLabel className="mb-3">Next exam</CardLabel>
        <p className="text-2xl font-semibold text-text mb-1">Opens in {w.opensIn}</p>
        <p className="text-sm text-text-secondary">Daily window: 6:00 AM – 8:30 AM IST</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardLabel className="mb-2">Exam status</CardLabel>
      <p className="text-sm text-text-secondary">{w.message}</p>
    </Card>
  )
}
