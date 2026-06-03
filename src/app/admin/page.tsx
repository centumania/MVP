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

function StatCard({ label, value, sub, color = 'blue' }: { label: string; value: string | number; sub?: string; color?: 'blue' | 'green' | 'amber' | 'red' }) {
  const colors = {
    blue:  'bg-[#0EA5E9]/10 text-[#0EA5E9]',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red:   'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <p className={`text-3xl font-semibold font-mono ${color === 'blue' ? 'text-slate-900' : colors[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }

      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setLoading(false); return }
      setStats(await res.json())
      setLoading(false)
    })
  }, [router])

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">{dateLabel}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Students" value={stats?.students.total ?? 0} sub="Registered accounts" />
            <StatCard label="Verified" value={stats?.students.verified ?? 0} sub="Payment confirmed" color="green" />
            <StatCard label="Pending" value={stats?.students.pending ?? 0} sub="Awaiting payment" color="amber" />
            <StatCard label="Today's Exams" value={stats?.submissions.today ?? 0} sub={`of ${stats?.students.verified ?? 0} eligible`} color="blue" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Submissions" value={stats?.submissions.total ?? 0} sub="All time" />
            <StatCard label="Avg Accuracy" value={`${stats?.avgAccuracy ?? 0}%`} sub="Across all exams" color="green" />
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Active Batch</p>
              {stats?.activeBatch ? (
                <>
                  <p className="text-base font-semibold text-slate-900">{stats.activeBatch.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(stats.activeBatch.starts_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(stats.activeBatch.ends_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {stats.activeBatch.total_days} days
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">No active batch</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <p className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</p>
            <div className="flex flex-wrap gap-3">
              {[
                { href: '/admin/students', label: 'Manage Students',  color: 'bg-[#0EA5E9] text-white hover:bg-[#0284C7]' },
                { href: '/admin/payments', label: 'Verify Payments',  color: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' },
                { href: '/admin/exams',    label: 'Manage Exams',     color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { href: '/admin/materials',label: 'Upload Materials', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
              ].map(a => (
                <Link key={a.href} href={a.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${a.color}`}>
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
