'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Stats = {
  students:       { total: number; verified: number; pending: number }
  submissions:    { total: number; today: number }
  avgAccuracy:    number
  activeBatch:    { name: string; total_days: number; starts_on: string; ends_on: string } | null
  recentActivity: { submitted_at: string; score: number; total_marks: number }[]
}

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = 'green' }: {
  label: string; value: string | number; sub?: string; accent?: 'green' | 'amber' | 'teal' | 'crimson'
}) {
  const accents = {
    green:   { text: '#0B3D91', bg: 'rgba(11,61,145,0.08)', dot: 'rgba(11,61,145,0.6)' },
    amber:   { text: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  dot: 'rgba(245,158,11,0.6)' },
    teal:    { text: '#0B3D91', bg: 'rgba(11,61,145,0.08)',  dot: 'rgba(11,61,145,0.6)' },
    crimson: { text: '#EF4444', bg: 'rgba(239,68,68,0.08)', dot: 'rgba(239,68,68,0.6)' },
  }
  const a = accents[accent]
  return (
    <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.dot, boxShadow: `0 0 6px ${a.dot}` }} />
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">{label}</p>
      </div>
      <p className="text-3xl font-semibold font-mono" style={{ color: a.text }}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [avgCentum,  setAvgCentum]  = useState<number>(0)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const tok = session.access_token
      const [statsRes, centumRes] = await Promise.all([
        fetch('/api/admin/stats',          { headers: { Authorization: `Bearer ${tok}` } }),
        fetch('/api/centum/leaderboard',   { headers: { Authorization: `Bearer ${tok}` } }),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (centumRes.ok) {
        const { leaderboard } = await centumRes.json()
        if (leaderboard?.length > 0) {
          const avg = leaderboard.reduce((a: number, r: { centum_index: number }) => a + Number(r.centum_index), 0) / leaderboard.length
          setAvgCentum(Math.round(avg * 10) / 10)
        }
      }
      setLoading(false)
    })
  }, [router])

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Admin Overview
        </h1>
        <p className="text-sm text-text-muted mt-0.5 font-mono">{dateLabel}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <div className="h-3 rounded w-24 mb-3" style={{ background: '#FFFFFF' }} />
              <div className="h-8 rounded w-16" style={{ background: '#FFFFFF' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Students" value={stats?.students.total ?? 0}    sub="Registered accounts" accent="teal" />
            <StatCard label="Verified"        value={stats?.students.verified ?? 0} sub="Payment confirmed"   accent="green" />
            <StatCard label="Pending"         value={stats?.students.pending ?? 0}  sub="Awaiting payment"    accent="amber" />
            <StatCard label="Today's Exams"   value={stats?.submissions.today ?? 0} sub={`of ${stats?.students.verified ?? 0} eligible`} accent="green" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Submissions" value={stats?.submissions.total ?? 0} sub="All time" accent="teal" />
            <StatCard label="Avg Accuracy"      value={`${stats?.avgAccuracy ?? 0}%`} sub="Across all exams" accent="green" />
            <StatCard label="Avg Centum Index"  value={avgCentum > 0 ? avgCentum : 0} sub="Today across all students" accent="teal" />
            <div className="col-span-2 rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono mb-3">Active Batch</p>
              {stats?.activeBatch ? (
                <>
                  <p className="text-base font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                    {stats.activeBatch.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1 font-mono">
                    {new Date(stats.activeBatch.starts_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(stats.activeBatch.ends_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {stats.activeBatch.total_days} days
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted">No active batch</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl p-6 mb-8" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <p className="text-sm font-semibold text-text mb-4">Quick Actions</p>
            <div className="flex flex-wrap gap-3">
              {[
                { href: '/admin/students', label: 'Manage Students',  primary: true },
                { href: '/admin/payments', label: 'Verify Payments',  primary: false, amber: true },
                { href: '/admin/exams',    label: 'Manage Exams',     primary: false },
                { href: '/admin/materials',label: 'Upload Materials', primary: false },
              ].map(a => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={a.primary
                    ? { background: '#10B981', color: '#FFFFFF' }
                    : a.amber
                    ? { background: 'rgba(245,158,11,0.10)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.20)' }
                    : { background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }
                  }
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
