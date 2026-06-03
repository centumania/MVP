'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Student = {
  id: string; name: string; email: string; phone: string | null
  tier: string | null; payment_verified: boolean; created_at: string
  daysAttended: number
}

type TierValue = 'rookie' | 'warrior' | 'legend' | null

export default function AdminStudents() {
  const router = useRouter()
  const [token,    setToken]   = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [total,    setTotal]   = useState(0)
  const [loading,  setLoading] = useState(true)
  const [search,   setSearch]  = useState('')
  const [status,   setStatus]  = useState<'all' | 'verified' | 'pending'>('all')
  const [page,     setPage]    = useState(1)
  const [toast,    setToast]   = useState<string | null>(null)

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
    }
    setLoading(false)
  }, [])

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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

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
    if (res.ok) {
      setStudents(prev => prev.filter(s => s.id !== id))
      setTotal(t => t - 1)
      showToast('Student deleted')
    }
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-8 max-w-7xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="search"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 max-w-xs h-9 px-3 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
        />
        {(['all', 'verified', 'pending'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize ${status === s ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Days</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '80%' : '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  No students found
                </td>
              </tr>
            ) : students.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{s.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  {s.payment_verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-100">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <select
                    value={s.tier ?? ''}
                    onChange={e => updateTier(s.id, (e.target.value || null) as TierValue)}
                    className="text-xs text-slate-600 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
                  >
                    <option value="">—</option>
                    <option value="rookie">Rookie</option>
                    <option value="warrior">Warrior</option>
                    <option value="legend">Legend</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs hidden lg:table-cell">{s.daysAttended}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell">
                  {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {!s.payment_verified && (
                      <button
                        onClick={() => verifyPayment(s.id)}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md hover:bg-emerald-100 transition-colors border border-emerald-100"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => deleteStudent(s.id, s.name)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
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
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
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
