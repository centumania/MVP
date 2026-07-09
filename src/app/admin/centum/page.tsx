'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { getCentumColor, getRefundTier } from '@/src/types/centum'
import type { CentumIndexLog } from '@/src/types/centum'
import type { Batch } from '@/src/types/database'

type LeaderboardRow = CentumIndexLog & { rank: number; name: string }

// ── Shared styles (match existing admin pages) ─────────────────────
const CARD  = { background: '#FFFFFF', border: '1px solid #E5E7EB' }
const THHD  = { background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }
const TROW  = { borderBottom: '1px solid rgba(229,231,235,0.6)' }

export default function CentumPage() {
  const router = useRouter()

  const [token,       setToken]       = useState<string | null>(null)
  const [batches,     setBatches]     = useState<Batch[]>([])
  const [batchId,     setBatchId]     = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [recalcState, setRecalcState] = useState<
    { phase: 'idle' } | { phase: 'running'; done: number; total: number } | { phase: 'done' }
  >({ phase: 'idle' })

  const loadLeaderboard = useCallback(async (tok: string, bid: string) => {
    setLoading(true)
    const params = bid ? `?batch_id=${bid}` : ''
    const res = await fetch(`/api/centum/leaderboard${params}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      const { leaderboard: data } = await res.json()
      setLeaderboard(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const tok = session.access_token
      setToken(tok)

      // Fetch batches for filter dropdown
      const batchRes = await fetch('/api/admin/batches', {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (batchRes.ok) {
        const { batches: b } = await batchRes.json()
        setBatches(b ?? [])
      }

      await loadLeaderboard(tok, '')
    })
  }, [router, loadLeaderboard])

  useEffect(() => {
    // Deferred via microtask: loadLeaderboard sets state synchronously as its
    // first statement, so calling it directly here would cascade renders.
    if (token) void Promise.resolve().then(() => loadLeaderboard(token, batchId))
  }, [batchId, token, loadLeaderboard])

  async function recalculateAll() {
    if (!token) return
    setRecalcState({ phase: 'running', done: 0, total: 0 })

    // Paginate through all verified students
    const allIds: string[] = []
    let page = 1
    while (true) {
      const res = await fetch(
        `/api/admin/students?status=verified&page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) break
      const d = await res.json()
      const ids = (d.students ?? []).map((s: { id: string }) => s.id)
      allIds.push(...ids)
      if (allIds.length >= (d.total ?? 0)) break
      page++
    }

    setRecalcState({ phase: 'running', done: 0, total: allIds.length })

    for (let i = 0; i < allIds.length; i++) {
      await fetch('/api/centum/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: allIds[i] }),
      })
      setRecalcState({ phase: 'running', done: i + 1, total: allIds.length })
    }

    setRecalcState({ phase: 'done' })
    await loadLeaderboard(token, batchId)
  }

  // ── Refund tier counts ─────────────────────────────────────────────
  const goldCount   = leaderboard.filter(r => r.centum_index >= 95).length
  const silverCount = leaderboard.filter(r => r.centum_index >= 85 && r.centum_index < 95).length
  const bronzeCount = leaderboard.filter(r => r.centum_index >= 75 && r.centum_index < 85).length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text"
            style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Centum Index
          </h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">
            Attendance × 60% + Node Index × 40%
          </p>
        </div>

        {/* Recalculate All */}
        <button
          onClick={recalculateAll}
          disabled={recalcState.phase === 'running'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}
        >
          {recalcState.phase === 'running' ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(2,132,199,0.3)', borderTopColor: '#0284c7' }} />
              Calculating {recalcState.done}/{recalcState.total}…
            </>
          ) : recalcState.phase === 'done' ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Done
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Recalculate All
            </>
          )}
        </button>
      </div>

      {/* ── Section 1: Leaderboard ─────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-4">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">
            Today&apos;s Leaderboard
          </p>
          {/* Batch filter */}
          {batches.length > 0 && (
            <select
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              className="text-xs rounded-lg px-3 py-1.5 focus:outline-none font-mono"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}
            >
              <option value="">All batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="rounded-xl overflow-hidden table-scroll" style={CARD}>
          <table className="w-full text-sm">
            <thead>
              <tr style={THHD}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono w-12">Rank</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Centum</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Attendance (60%)</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Node Index (40%)</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Refund Tier</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={TROW}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: '#FFFFFF', width: j === 1 ? '60%' : '40%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">
                    No Centum Index records for today. Click &quot;Recalculate All&quot; to generate.
                  </td>
                </tr>
              ) : leaderboard.map(row => {
                const col    = getCentumColor(Number(row.centum_index))
                const refund = getRefundTier(Number(row.centum_index))
                return (
                  <tr key={row.id} style={TROW}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(2,132,199,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">#{row.rank}</td>
                    <td className="px-4 py-3 font-medium text-text">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold font-mono text-sm px-2.5 py-1 rounded-lg"
                        style={{ background: `${col}15`, color: col, border: `1px solid ${col}30` }}>
                        {Number(row.centum_index).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden md:table-cell">
                      {Number(row.attendance_index).toFixed(1)}%
                      <span className="text-text-muted ml-1.5">
                        ({row.tests_submitted}/{row.tests_conducted})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary hidden md:table-cell">
                      {Number(row.node_index).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {refund.tier !== 'none' ? (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md uppercase tracking-wider"
                          style={{ background: `${refund.color}15`, color: refund.color, border: `1px solid ${refund.color}30` }}>
                          {refund.label}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted font-mono">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Refund Eligibility ──────────────────────────── */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono mb-4">
          Refund Eligibility
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '50% Refund',  threshold: '95%+',    count: goldCount,   color: '#0284c7' },
            { label: '35% Refund',  threshold: '85–95%',  count: silverCount, color: '#0284c7' },
            { label: '25% Refund',  threshold: '75–85%',  count: bronzeCount, color: '#F59E0B' },
          ].map(({ label, threshold, count, color }) => (
            <div key={label} className="rounded-xl p-5" style={CARD}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">{label}</p>
              </div>
              <p className="text-3xl font-semibold font-mono" style={{ color }}>{count}</p>
              <p className="text-xs text-text-muted mt-1 font-mono">Centum ≥ {threshold}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Formula ─────────────────────────────────────── */}
      <div className="rounded-xl p-5" style={{ ...CARD, borderColor: 'rgba(2,132,199,0.15)' }}>
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono mb-4">
          Formula Reference
        </p>
        <div className="space-y-2 font-mono text-sm text-text-secondary">
          <p>
            <span className="text-text font-semibold">Centum Index</span>
            {' = Attendance Index × 60% + Node Index × 40%'}
          </p>
          <p>
            <span className="text-text font-semibold">Attendance Index</span>
            {' = Tests Submitted ÷ Tests Conducted × 100'}
          </p>
          <p>
            <span className="text-text font-semibold">Node Index</span>
            {' = (Node Completion % × First Attempt Accuracy %) ÷ 100'}
          </p>
        </div>
      </div>

    </div>
  )
}
