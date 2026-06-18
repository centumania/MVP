'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { getCentumColor, getRefundTier } from '@/src/types/centum'
import type { CentumIndexLog } from '@/src/types/centum'
import type { Profile } from '@/src/types/database'

type StudentDetail = {
  profile:     Profile
  submissions: { id: string; score: number; total_marks: number; submitted_at: string; exam_id: string }[]
  stats:       { daysAttended: number; totalScore: number; accuracy: number }
}

type LatestCentum = CentumIndexLog | null

// ── Shared styles (match existing admin pages) ─────────────────────
const CARD = { background: '#FFFFFF', border: '1px solid #E5E7EB' }

export default function StudentDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [token,          setToken]         = useState<string | null>(null)
  const [student,        setStudent]       = useState<StudentDetail | null>(null)
  const [latestCentum,   setLatestCentum]  = useState<LatestCentum>(null)
  const [history,        setHistory]       = useState<CentumIndexLog[]>([])
  const [loading,        setLoading]       = useState(true)
  const [calculating,    setCalculating]   = useState(false)
  const [toast,          setToast]         = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchCentumData = useCallback(async (tok: string) => {
    const [reportRes, histRes] = await Promise.all([
      fetch(`/api/centum/leaderboard`,           { headers: { Authorization: `Bearer ${tok}` } }),
      fetch(`/api/centum/student/${id}`,         { headers: { Authorization: `Bearer ${tok}` } }),
    ])
    if (reportRes.ok) {
      const { leaderboard } = await reportRes.json()
      const entry = (leaderboard ?? []).find((r: CentumIndexLog) => r.user_id === id) ?? null
      setLatestCentum(entry)
    }
    if (histRes.ok) {
      const { history: h } = await histRes.json()
      setHistory(h ?? [])
    }
  }, [id])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const tok = session.access_token
      setToken(tok)

      const [studentRes] = await Promise.all([
        fetch(`/api/admin/students/${id}`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetchCentumData(tok),
      ])

      if (!studentRes.ok) { router.replace('/admin/students'); return }
      setStudent(await studentRes.json())
      setLoading(false)
    })
  }, [id, router, fetchCentumData])

  async function recalculate() {
    if (!token) return
    setCalculating(true)
    try {
      const res = await fetch('/api/centum/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: id }),
      })
      if (res.ok) {
        showToast('Centum Index recalculated')
        await fetchCentumData(token)
      } else {
        showToast('Calculation failed')
      }
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={CARD}>
              <div className="h-4 rounded w-1/3 mb-3" style={{ background: '#FFFFFF' }} />
              <div className="h-8 rounded w-1/4"      style={{ background: '#FFFFFF' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!student) return null

  const { profile, submissions, stats } = student
  const centum  = latestCentum
  const refund  = centum ? getRefundTier(Number(centum.centum_index)) : null
  const centCol = centum ? getCentumColor(Number(centum.centum_index)) : '#6B7280'

  const tierColors: Record<string, string> = {
    rookie:  '#6B7280',
    warrior: '#F59E0B',
    legend:  '#6fcf8f',
  }
  const tierCol = profile.tier ? (tierColors[profile.tier] ?? '#6B7280') : '#6B7280'

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{ background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB' }}>
          {toast}
        </div>
      )}

      {/* Back */}
      <div className="mb-6">
        <Link href="/admin/students"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Students
        </Link>
      </div>

      {/* ── Profile header ─────────────────────────────────────── */}
      <div className="rounded-xl p-6 mb-6" style={CARD}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text mb-1"
              style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
              {profile.name}
            </h1>
            <p className="text-sm text-text-muted font-mono">{profile.email}</p>
            {profile.phone && (
              <p className="text-xs text-text-muted font-mono mt-0.5">{profile.phone}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={profile.payment_verified
                ? { background: 'rgba(111,207,143,0.08)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }
                : { background: 'rgba(245,158,11,0.08)',  color: '#F59E0B', border: '1px solid rgba(245,158,11,0.20)' }
              }>
              {profile.payment_verified ? 'Verified' : 'Pending'}
            </span>
            {profile.tier && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md uppercase tracking-wider capitalize"
                style={{ background: `${tierCol}15`, color: tierCol, border: `1px solid ${tierCol}30` }}>
                {profile.tier}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: '1px solid #E5E7EB' }}>
          {[
            { label: 'Days Attended', value: String(stats.daysAttended) },
            { label: 'Total Score',   value: String(stats.totalScore) },
            { label: 'Accuracy',      value: `${stats.accuracy}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono mb-1">{label}</p>
              <p className="text-xl font-bold text-text font-mono">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Centum Index Breakdown ─────────────────────────────── */}
      <div className="rounded-xl p-6 mb-6" style={CARD}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">
            Centum Index Breakdown
          </p>
          <button
            onClick={recalculate}
            disabled={calculating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 font-mono"
            style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
            {calculating ? (
              <>
                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(11,61,145,0.3)', borderTopColor: '#0B3D91' }} />
                Calculating…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Recalculate
              </>
            )}
          </button>
        </div>

        {!centum ? (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted mb-3">No Centum Index calculated yet for today.</p>
            <button
              onClick={recalculate}
              disabled={calculating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'rgba(11,61,145,0.08)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.20)' }}>
              Calculate Now
            </button>
          </div>
        ) : (
          <>
            {/* Big score + refund badge */}
            <div className="flex items-center gap-5 mb-5">
              <div>
                <p className="text-5xl font-bold font-mono tracking-tight" style={{ color: centCol }}>
                  {Number(centum.centum_index).toFixed(1)}
                </p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono mt-1">Centum Index</p>
              </div>
              {refund && (
                <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-lg uppercase tracking-wider"
                  style={{ background: `${refund.color}15`, color: refund.color, border: `1px solid ${refund.color}30` }}>
                  {refund.label}
                </span>
              )}
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Attendance */}
              <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono mb-1.5">
                  Attendance Index (×60%)
                </p>
                <p className="text-2xl font-bold font-mono text-text">
                  {Number(centum.attendance_index).toFixed(1)}%
                </p>
                <p className="text-xs text-text-muted font-mono mt-1">
                  Tests: {centum.tests_submitted}/{centum.tests_conducted} submitted
                </p>
              </div>

              {/* Node Index */}
              <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono mb-1.5">
                  Node Index (×40%)
                </p>
                <p className="text-2xl font-bold font-mono text-text">
                  {Number(centum.node_index).toFixed(1)}
                </p>
                <p className="text-xs text-text-muted font-mono mt-1">
                  Nodes: {centum.nodes_completed}/{centum.nodes_assigned} completed
                </p>
                <p className="text-xs text-text-muted font-mono">
                  1st attempt accuracy: {Number(centum.first_attempt_acc_pct).toFixed(1)}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Last 7 days ────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-6" style={CARD}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">
              Last 7 Days
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Date</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Centum</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Attendance</th>
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Node Index</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const col = getCentumColor(Number(h.centum_index))
                return (
                  <tr key={h.id} style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(229,231,235,0.6)' : undefined }}>
                    <td className="px-5 py-3 text-xs text-text-muted font-mono">
                      {new Date(h.calculated_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                        style={{ background: `${col}15`, color: col, border: `1px solid ${col}30` }}>
                        {Number(h.centum_index).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary font-mono hidden md:table-cell">
                      {Number(h.attendance_index).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary font-mono hidden md:table-cell">
                      {Number(h.node_index).toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Exam history ───────────────────────────────────────── */}
      {submissions.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">
              Exam Submissions
            </p>
          </div>
          <div>
            {submissions.slice(0, 10).map((s, i) => {
              const pct = s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0
              const col = pct >= 80 ? '#6fcf8f' : pct >= 60 ? '#0B3D91' : pct >= 40 ? '#F59E0B' : '#EF4444'
              return (
                <div key={s.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(229,231,235,0.6)' : undefined }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono"
                    style={{ background: `${col}15`, color: col, border: `1px solid ${col}30` }}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text font-mono">
                      {s.score} / {s.total_marks}
                      <span className="text-text-muted font-normal ml-2 text-xs">({pct}%)</span>
                    </p>
                    <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(17,24,39,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono shrink-0">
                    {new Date(s.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
