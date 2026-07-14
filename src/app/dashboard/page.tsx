'use client'

/**
 * /dashboard — v2 design system.
 * Data layer unchanged from v1: session check + redirect, cached token,
 * login analytics event, parallel fetch of /api/dashboard, /api/insights
 * and /api/current-affairs. Presentation delegated to DashboardView
 * (pure component, also rendered by /dev/dashboard-preview with mocks).
 */
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken, trackEvent } from '@/src/lib/analytics/track'
import { AppShell } from '@/src/components/dashboard-v2/AppShell'
import { DashboardSkeleton } from '@/src/components/dashboard-v2/ui'
import { PaymentGate } from '@/src/components/dashboard-v2/PaymentGate'
import { DashboardView, type DashData, type CurrentAffairsPayload } from '@/src/components/dashboard-v2/DashboardView'
import type { TodayStudyData, TodayStudyMaterial } from '@/src/components/dashboard-v2/TodayStudy'
import { getUniqueDays, getMaterialsByDay } from '@/src/data/materials'
import type { InsightsData } from '@/src/components/dashboard/InsightsCard'

/**
 * Builds the Today's Study hero payload: resolves which programme day is
 * current from /api/materials/status, then pulls per-material progress from
 * /api/study/progress so the hero can say exactly where to continue from.
 * Any failure returns null — the dashboard renders fine without the hero.
 */
async function fetchTodayStudy(token: string): Promise<TodayStudyData> {
  try {
    const res = await fetch('/api/materials/status', { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const status = await res.json() as {
      registrationNumber: string | null
      enrolledDate: string
      activeDays: number[]
    }

    // Today's day = latest catalog day that is published AND schedule-unlocked
    const enrolled = new Date(status.enrolledDate); enrolled.setHours(0, 0, 0, 0)
    const today    = new Date();                    today.setHours(0, 0, 0, 0)
    const unlocked = getUniqueDays().filter(d => {
      const unlock = new Date(enrolled); unlock.setDate(unlock.getDate() + (d - 1))
      return status.activeDays.includes(d) && today >= unlock
    })
    if (unlocked.length === 0) return null
    const day = Math.max(...unlocked)

    const mats = getMaterialsByDay(day).filter(m => !m.isStaticLocked)
    if (mats.length === 0) return null

    const materials: TodayStudyMaterial[] = await Promise.all(mats.map(async m => {
      let nodesCompleted = 0, totalNodes: number | null = m.totalNodes ?? null, accuracyPct = 0, xp = 0
      try {
        const pRes = await fetch(`/api/study/progress?material_id=${encodeURIComponent(m.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (pRes.ok) {
          const p = await pRes.json() as { nodes_completed: number; total_nodes: number | null; first_accuracy_pct: number; xp: number }
          nodesCompleted = p.nodes_completed ?? 0
          totalNodes     = p.total_nodes ?? totalNodes
          accuracyPct    = p.first_accuracy_pct ?? 0
          xp             = p.xp ?? 0
        }
      } catch { /* zeros are fine */ }
      return {
        id: m.id,
        title: m.title,
        subject: m.subject,
        href: status.registrationNumber ? `/materials/${status.registrationNumber}/${m.id}` : '/materials',
        nodesCompleted, totalNodes, accuracyPct, xp,
      }
    }))

    return { day, materials }
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [name, setName] = useState('Student')
  const [data, setData] = useState<DashData | null>(null)
  const [insights, setInsights] = useState<InsightsData>(null)
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffairsPayload>(null)
  const [todayStudy, setTodayStudy] = useState<TodayStudyData>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchData = useCallback(async (token: string) => {
    try {
      const [dashRes, insightsRes, caRes, studyData] = await Promise.all([
        fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/insights', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/current-affairs', { headers: { Authorization: `Bearer ${token}` } }),
        fetchTodayStudy(token),
      ])
      if (!dashRes.ok) { setState('error'); return }
      setData(await dashRes.json())
      if (insightsRes.ok) setInsights(await insightsRes.json())
      if (caRes.ok) setCurrentAffairs(await caRes.json())
      setTodayStudy(studyData)
      setState('ready')
    } catch { setState('error') }
  }, [])

  const loadSession = useCallback(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student')
      setCachedToken(session.access_token)
      trackEvent('login', {})
      fetchData(session.access_token)
    })
  }, [router, fetchData])

  useEffect(() => { loadSession() }, [loadSession])

  const firstName = name.split(' ')[0]

  if (state === 'loading') {
    return (
      <AppShell userName={name}>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6"><DashboardSkeleton /></div>
      </AppShell>
    )
  }

  if (state === 'error') {
    return (
      <AppShell userName={name}>
        <div className="mx-auto flex min-h-64 max-w-2xl flex-col items-center justify-center gap-4 px-4 py-8 sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-200/70">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            Failed to load.{' '}
            <button
              className="font-bold text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-700"
              onClick={() => { setState('loading'); loadSession() }}
            >
              Retry
            </button>
          </p>
        </div>
      </AppShell>
    )
  }

  if (data?.paymentPending) {
    return (
      <AppShell userName={name}>
        <PaymentGate />
      </AppShell>
    )
  }

  return (
    <AppShell userName={name}>
      <DashboardView firstName={firstName} data={data!} insights={insights} currentAffairs={currentAffairs} todayStudy={todayStudy} />
    </AppShell>
  )
}
