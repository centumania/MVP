'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { getCentumColor } from '@/src/types/centum'

type Student = {
  id: string; name: string; email: string; phone: string | null
  tier: string | null; payment_verified: boolean; created_at: string
  daysAttended: number
}
type TierValue = 'rookie' | 'warrior' | 'legend' | null

// ── Shared dark table styles ───────────────────────────────────────
const CARD  = { background: '#16201a', border: '1px solid #27342b' }
const THHD  = { background: '#1b271f', borderBottom: '1px solid #27342b' }
const TROW  = { borderBottom: '1px solid rgba(39,52,43,0.6)' }

export default function AdminStudents() {
  const router = useRouter()
  const [token,          setToken]         = useState<string | null>(null)
  const [students,       setStudents]      = useState<Student[]>([])
  const [total,          setTotal]         = useState(0)
  const [loading,        setLoading]       = useState(true)
  const [search,         setSearch]        = useState('')
  const [status,         setStatus]        = useState<'all' | 'verified' | 'pending'>('all')
  const [page,           setPage]          = useState(1)
  const [toast,          setToast]         = useState<string | null>(null)
  const [centumScores,   setCentumScores]  = useState<Record<string, number | null>>({})
  const [calculatingIds, setCalculatingIds] = useState<Set<string>>(new Set())

  const loadStudents = useCallback(async (tok: string, q: string, s: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ search: q, status: s, page: String(p) })
    const res = await fetch(`/api/admin/students?${params}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      const d = await res.json()
      setStudents(d.students)
      setTotal(d.total)
      // Fetch today's centum scores for this page of students
      const centumRes = await fetch('/api/centum/leaderboard', {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (centumRes.ok) {
        const { leaderboard } = await centumRes.json()
        const map: Record<string, number | null> = {}
        for (const entry of leaderboard ?? []) {
          map[entry.user_id] = Number(entry.centum_index)
        }
        setCentumScores(map)
      }
    }
    setLoading(false)
  }, [])

  async function calculateOne(studentId: string) {
    if (!token) return
    setCalculatingIds(prev => new Set(prev).add(studentId))
    try {
      const res = await fetch('/api/centum/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: studentId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCentumScores(prev => ({ ...prev, [studentId]: Number(data.centum_index) }))
        showToast('Centum Index updated')
      } else {
        showToast('Calculation failed')
      }
    } finally {
      setCalculatingIds(prev => {
        const n = new Set(prev)
        n.delete(studentId)
        return n
      })
    }
  }

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
      loadStudents(session.access_token, '', 'all', 1)
    })
  }, [router, loadStudents])

  useEffect(() => {
    const t = setTimeout(() => {
      if (token) loadStudents(token, search, status, page)
    }, 300)
    return () => clearTimeout(t)
  }, [search, status, page, token, loadStudents])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function verifyPayment(id: string) {
    if (!token) return
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_verified: true }),
    })
    if (res.ok) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, payment_verified: true } : s))
      showToast('Payment verified')
    }
  }

  async function updateTier(id: string, tier: TierValue) {
    if (!token) return
    await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tier }),
    })
    setStudents(prev => prev.map(s => s.id === id ? { ...s, tier } : s))
  }

  async function deleteStudent(id: string, name: string) {
    if (!token) return
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) { setStudents(prev => prev.filter(s => s.id !== id)); setTotal(t => t - 1); showToast('Student deleted') }
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{ background: '#1b271f', color: '#e8ead8', border: '1px solid #27342b' }}>
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Students
          </h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">{total} total students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-xs h-11 px-3 text-sm rounded-lg text-text font-mono placeholder-text-muted focus:outline-none"
          style={{ background: '#16201a', border: '1px solid #27342b' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = '#27342b')}
        />
        {(['all', 'verified', 'pending'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize font-mono"
            style={status === s
              ? { background: '#22C55E', color: '#06140c', border: '1px solid #22C55E' }
              : { background: '#16201a', color: '#9aa893', border: '1px solid #27342b' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden table-scroll" style={CARD}>
        <table className="w-full text-sm">
          <thead>
            <tr style={THHD}>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Student</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Tier</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Days</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Centum</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} style={TROW}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded animate-pulse" style={{ background: '#1b271f', width: j === 0 ? '80%' : '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-muted">
                  No students found
                </td>
              </tr>
            ) : students.map(s => (
              <tr key={s.id} style={TROW}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-text">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs hidden md:table-cell">{s.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  {s.payment_verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium font-mono"
                      style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.20)' }}>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium font-mono"
                      style={{ background: 'rgba(231,177,76,0.08)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.20)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#e7b14c' }} />Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <select
                    value={s.tier ?? ''}
                    onChange={e => updateTier(s.id, (e.target.value || null) as TierValue)}
                    className="text-xs rounded-md px-2 py-1 focus:outline-none font-mono"
                    style={{ background: '#1b271f', border: '1px solid #27342b', color: '#9aa893' }}
                  >
                    <option value="">—</option>
                    <option value="rookie">Rookie</option>
                    <option value="warrior">Warrior</option>
                    <option value="legend">Legend</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs hidden lg:table-cell">{s.daysAttended}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {(() => {
                    const score = centumScores[s.id]
                    if (score == null) return <span className="text-xs text-text-muted font-mono">—</span>
                    const col = getCentumColor(score)
                    return (
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                        style={{ background: `${col}18`, color: col, border: `1px solid ${col}30` }}>
                        {score.toFixed(1)}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell font-mono">
                  {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/admin/students/${s.id}`}
                      className="p-1.5 rounded-md transition-colors hidden lg:flex items-center"
                      title="View student detail"
                      style={{ color: '#3a4a3d' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#4ADE80'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(74,222,128,0.08)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLAnchorElement).style.background = '' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </Link>
                    <button
                      onClick={() => calculateOne(s.id)}
                      disabled={calculatingIds.has(s.id)}
                      title="Recalculate Centum Index"
                      className="p-1.5 rounded-md transition-colors hidden lg:flex items-center disabled:opacity-40"
                      style={{ color: '#3a4a3d' }}
                      onMouseEnter={e => { if (!calculatingIds.has(s.id)) { (e.currentTarget as HTMLButtonElement).style.color = '#5ec8c0'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(94,200,192,0.08)' } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLButtonElement).style.background = '' }}>
                      {calculatingIds.has(s.id) ? (
                        <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                          style={{ borderColor: 'rgba(94,200,192,0.3)', borderTopColor: '#5ec8c0' }} />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                      )}
                    </button>
                    {!s.payment_verified && (
                      <button
                        onClick={() => verifyPayment(s.id)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors font-mono"
                        style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.20)' }}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => deleteStudent(s.id, s.name)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: '#3a4a3d' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8736b'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,115,107,0.08)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLButtonElement).style.background = '' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #27342b' }}>
            <p className="text-xs text-text-muted font-mono">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-40 transition-colors font-mono"
                style={{ border: '1px solid #27342b', background: '#1b271f', color: '#9aa893' }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-40 transition-colors font-mono"
                style={{ border: '1px solid #27342b', background: '#1b271f', color: '#9aa893' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
