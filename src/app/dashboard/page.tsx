'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { ExamWindowStatus } from '@/src/types/database'

// ── Types ─────────────────────────────────────────────────────────

type TodayExam = {
  dayNumber:        number
  examId:           string
  alreadySubmitted: boolean
  score?:           number
  totalMarks?:      number
}

type DashboardState =
  | { status: 'loading' }
  | { status: 'payment-pending' }
  | { status: 'ready'; window: ExamWindowStatus; today: TodayExam | null }
  | { status: 'error'; message: string }

// ── Component ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]   = useState<User | null>(null)
  const [state, setState] = useState<DashboardState>({ status: 'loading' })

  // Fetch window + today's exam together
  const fetchDashboardData = useCallback(async (token: string) => {
    try {
      const [windowRes, todayRes] = await Promise.all([
        fetch('/api/exam/window'),
        fetch('/api/exam/today', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const windowData: ExamWindowStatus = await windowRes.json()

      if (!todayRes.ok) {
        if (todayRes.status === 402) {
          setState({ status: 'payment-pending' })
          return
        }
        // No exam today or other non-fatal error
        setState({ status: 'ready', window: windowData, today: null })
        return
      }

      const todayData: TodayExam = await todayRes.json()
      setState({ status: 'ready', window: windowData, today: todayData })
    } catch {
      setState({ status: 'error', message: 'Failed to load dashboard. Please refresh.' })
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login')
        return
      }
      setUser(session.user)
      fetchDashboardData(session.access_token)
    })

    // Refresh data when window status might change (every 30s)
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) fetchDashboardData(session.access_token)
      })
    }, 30_000)

    return () => clearInterval(interval)
  }, [router, fetchDashboardData])

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <p className="text-muted font-subheading uppercase tracking-widest text-sm animate-pulse">
          Loading…
        </p>
      </div>
    )
  }

  // ── Payment pending ──────────────────────────────────────────────
  if (state.status === 'payment-pending') {
    return (
      <div className="min-h-screen bg-carbon px-6 py-8 flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div className="text-5xl mb-6">🔒</div>
          <h2 className="font-headline text-3xl text-gold mb-3">PAYMENT PENDING</h2>
          <p className="text-muted text-base leading-relaxed">
            Your registration is complete. Contact your coordinator to complete payment
            and get full access.
          </p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────
  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-carbon px-6 py-8 flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-error text-center">{state.message}</p>
        </div>
      </div>
    )
  }

  // ── Ready ────────────────────────────────────────────────────────
  const { window: examWindow, today } = state

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-4">

        {/* Day counter */}
        {today && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-muted font-subheading uppercase tracking-widest text-xs">
              Day {today.dayNumber} of 25
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* Exam status card */}
        <ExamStatusCard window={examWindow} today={today} />

        {/* IST time — debug aid */}
        <p className="text-center text-muted/50 text-xs font-body">
          Server time: {examWindow.serverTimeIST}
        </p>

      </main>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function Header({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const name = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Student'
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-border">
      <span className="font-headline text-2xl text-gold tracking-wider">CENTUMANIA</span>
      <div className="flex items-center gap-3">
        <span className="text-muted text-sm font-body hidden sm:inline">{name}</span>
        <button
          onClick={onLogout}
          className="text-muted text-sm font-subheading uppercase tracking-wide hover:text-offwhite transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

function ExamStatusCard({
  window: examWindow,
  today,
}: {
  window: ExamWindowStatus
  today: TodayExam | null
}) {
  // ── Already submitted ────────────────────────────────────────────
  if (today?.alreadySubmitted) {
    const pct = today.totalMarks
      ? Math.round((today.score! / today.totalMarks) * 100)
      : 0
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <p className="text-muted font-subheading uppercase tracking-widest text-xs mb-3">
          Today&apos;s Result
        </p>
        <div className="flex items-end gap-2 mb-1">
          <span className="font-headline text-6xl text-gold">{today.score}</span>
          <span className="text-muted text-xl mb-1">/ {today.totalMarks}</span>
        </div>
        <p className="text-muted text-sm">{pct}% accuracy</p>
        <Link
          href={`/exam/${today.dayNumber}`}
          className="mt-4 inline-block text-gold text-sm font-subheading uppercase tracking-wide hover:underline"
        >
          View answer key →
        </Link>
      </div>
    )
  }

  // ── Window OPEN ──────────────────────────────────────────────────
  if (examWindow.isOpen && today) {
    return (
      <div className="bg-surface border-2 border-gold rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          <span className="font-subheading uppercase tracking-widest text-gold text-xs">
            Exam Live
          </span>
        </div>
        <p className="font-headline text-4xl text-offwhite mb-1">
          Closes in {examWindow.closesIn}
        </p>
        <p className="text-muted text-sm mb-6">Do not miss the window.</p>
        <Link
          href={`/exam/${today.dayNumber}`}
          className="block w-full bg-gold text-carbon font-subheading font-bold uppercase tracking-widest py-4 rounded-xl text-center text-lg hover:bg-gold-dark transition-colors"
        >
          Attempt Now
        </Link>
      </div>
    )
  }

  // ── Window CLOSED — before opening ──────────────────────────────
  if (!examWindow.isOpen && examWindow.opensIn) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <p className="text-muted font-subheading uppercase tracking-widest text-xs mb-3">
          Next Exam
        </p>
        <p className="font-headline text-4xl text-offwhite mb-1">
          Opens in {examWindow.opensIn}
        </p>
        <p className="text-muted text-sm">6:00 AM – 8:30 AM daily. Be ready.</p>
      </div>
    )
  }

  // ── Missed / No exam / Cohort end ────────────────────────────────
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <p className="text-muted font-subheading uppercase tracking-widest text-xs mb-2">
        Status
      </p>
      <p className="text-offwhite text-base">{examWindow.message}</p>
    </div>
  )
}
