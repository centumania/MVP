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
import type { User } from '@supabase/supabase-js'
import type { ExamWindowStatus } from '@/src/types/database'

type TodayExam = {
  dayNumber: number; examId: string; alreadySubmitted: boolean
  score?: number; totalMarks?: number
}

type DashboardState =
  | { status: 'loading' }
  | { status: 'payment-pending' }
  | { status: 'ready'; window: ExamWindowStatus; today: TodayExam | null }
  | { status: 'error'; message: string }

// ── Greeting (IST-aware) ───────────────────────────────────────────
function greeting() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const h = new Date(Date.now() + IST_OFFSET_MS).getUTCHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]   = useState<User | null>(null)
  const [state, setState] = useState<DashboardState>({ status: 'loading' })

  const fetchData = useCallback(async (token: string) => {
    try {
      const [winRes, todayRes] = await Promise.all([
        fetch('/api/exam/window'),
        fetch('/api/exam/today', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const windowData: ExamWindowStatus = await winRes.json()
      if (todayRes.status === 402) { setState({ status: 'payment-pending' }); return }
      const today = todayRes.ok ? (await todayRes.json() as TodayExam) : null
      setState({ status: 'ready', window: windowData, today })
    } catch {
      setState({ status: 'error', message: 'Failed to load. Please refresh.' })
    }
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUser(session.user)
      fetchData(session.access_token)
    })
    const id = setInterval(() => {
      getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
        if (!session) { router.replace('/auth/login'); return }
        fetchData(session.access_token)
      })
    }, 30_000)
    return () => clearInterval(id)
  }, [router, fetchData])

  const name     = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Student'
  const firstName = name.split(' ')[0]

  if (state.status === 'loading') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <SkeletonDashboard />
        </div>
      </AppLayout>
    )
  }

  if (state.status === 'payment-pending') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-14 h-14 bg-warning-subtle rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
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

  if (state.status === 'error') {
    return (
      <AppLayout userName={name}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-sm text-error">{state.message}</p>
        </div>
      </AppLayout>
    )
  }

  const { window: w, today } = state
  const dayLabel = today ? `Day ${today.dayNumber} of 25` : 'LDC Batch 2026'
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AppLayout userName={name} batchName="LDC Batch · 2026">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Welcome header ───────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">
              {greeting()}, {firstName}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {dayLabel} · {dateLabel}
            </p>
          </div>
          <Badge variant={w.isOpen ? 'success' : 'neutral'} dot>
            {w.isOpen ? 'Exam live' : 'Exam closed'}
          </Badge>
        </div>

        {/* ── Exam status card ─────────────────────────────────── */}
        <ExamCard w={w} today={today} />

        {/* ── Stats row ────────────────────────────────────────── */}
        {today?.alreadySubmitted && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Today's score" value={`${today.score ?? 0}/${today.totalMarks ?? 0}`} icon="📊" />
            <StatCard label="Accuracy" value={
              today.totalMarks
                ? `${Math.round(((today.score ?? 0) / today.totalMarks) * 100)}%`
                : '—'
            } icon="🎯" />
            <StatCard label="Day" value={today ? `${today.dayNumber}/25` : '—'} icon="📅" className="col-span-2 sm:col-span-1" />
          </div>
        )}

        {/* ── Quick actions ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/leaderboard">
            <Card hoverable className="text-center">
              <div className="text-2xl mb-2">🏆</div>
              <p className="text-sm font-medium text-text">Leaderboard</p>
              <p className="text-xs text-text-muted mt-0.5">See your rank</p>
            </Card>
          </Link>
          <Link href="/materials">
            <Card hoverable className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm font-medium text-text">Materials</p>
              <p className="text-xs text-text-muted mt-0.5">Today's content</p>
            </Card>
          </Link>
        </div>

      </div>
    </AppLayout>
  )
}

// ── Exam status card ───────────────────────────────────────────────

function ExamCard({ w, today }: { w: ExamWindowStatus; today: TodayExam | null }) {
  // Already submitted
  if (today?.alreadySubmitted) {
    const pct = today.totalMarks ? Math.round(((today.score ?? 0) / today.totalMarks) * 100) : 0
    return (
      <Card>
        <CardLabel className="mb-3">Today&apos;s result</CardLabel>
        <div className="flex items-end gap-2 mb-1">
          <span className="text-4xl font-semibold text-text font-mono">{today.score}</span>
          <span className="text-text-secondary text-lg mb-0.5">/ {today.totalMarks}</span>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-medium text-text-secondary">{pct}%</span>
        </div>
        <Link href={`/exam/${today.dayNumber}`}>
          <Button variant="ghost" size="sm" className="mt-3 -ml-2">
            View answer key →
          </Button>
        </Link>
      </Card>
    )
  }

  // Window OPEN
  if (w.isOpen && today) {
    return (
      <Card highlight className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <CardLabel className="text-success">Live now</CardLabel>
          </div>
          <p className="text-2xl font-semibold text-text mb-0.5">
            Closes in {w.closesIn}
          </p>
          <p className="text-sm text-text-secondary mb-5">
            The window closes at 8:30 AM IST. No late submissions.
          </p>
          <Link href={`/exam/${today.dayNumber}`}>
            <Button size="lg" fullWidth>
              Attempt exam — Day {today.dayNumber}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // Window CLOSED, before open
  if (!w.isOpen && w.opensIn) {
    return (
      <Card>
        <CardLabel className="mb-3">Next exam</CardLabel>
        <p className="text-2xl font-semibold text-text mb-1">Opens in {w.opensIn}</p>
        <p className="text-sm text-text-secondary">Daily window: 6:00 AM – 8:30 AM IST</p>
        {today?.alreadySubmitted && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link href={`/exam/${today.dayNumber}`}>
              <Button variant="secondary" size="sm">
                Review today&apos;s answer key
              </Button>
            </Link>
          </div>
        )}
      </Card>
    )
  }

  // Default / no exam
  return (
    <Card>
      <CardLabel className="mb-2">Status</CardLabel>
      <p className="text-sm text-text-secondary">{w.message}</p>
    </Card>
  )
}

function StatCard({ label, value, icon, className = '' }: { label: string; value: string; icon: string; className?: string }) {
  return (
    <Card className={className}>
      <CardLabel>{label}</CardLabel>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xl font-semibold text-text font-mono">{value}</span>
      </div>
    </Card>
  )
}
