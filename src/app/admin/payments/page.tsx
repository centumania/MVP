'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Student = {
  id: string; name: string; email: string; phone: string | null
  tier: string | null; payment_verified: boolean; created_at: string
  daysAttended: number
}

export default function AdminPayments() {
  const router = useRouter()
  const [token,    setToken]   = useState<string | null>(null)
  const [pending,  setPending]  = useState<Student[]>([])
  const [verified, setVerified] = useState<Student[]>([])
  const [loading,  setLoading] = useState(true)
  const [tab,      setTab]     = useState<'pending' | 'verified'>('pending')
  const [toast,    setToast]   = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async (tok: string) => {
    const [pendRes, verRes] = await Promise.all([
      fetch('/api/admin/students?status=pending&page=1', { headers: { Authorization: `Bearer ${tok}` } }),
      fetch('/api/admin/students?status=verified&page=1', { headers: { Authorization: `Bearer ${tok}` } }),
    ])
    if (pendRes.ok) { const d = await pendRes.json(); setPending(d.students) }
    if (verRes.ok)  { const d = await verRes.json();  setVerified(d.students) }
    setLoading(false)
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
      load(session.access_token)
    })
  }, [router, load])

  async function verify(id: string) {
    if (!token) return
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_verified: true }),
    })
    if (res.ok) {
      const student = pending.find(s => s.id === id)!
      setPending(prev => prev.filter(s => s.id !== id))
      setVerified(prev => [{ ...student, payment_verified: true }, ...prev])
      showToast(`${student.name} — payment verified`)
    }
  }

  async function revoke(id: string) {
    if (!token || !confirm('Revoke payment verification?')) return
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_verified: false }),
    })
    if (res.ok) {
      const student = verified.find(s => s.id === id)!
      setVerified(prev => prev.filter(s => s.id !== id))
      setPending(prev => [{ ...student, payment_verified: false }, ...prev])
      showToast('Verification revoked')
    }
  }

  const list = tab === 'pending' ? pending : verified

  return (
    <div className="p-8 max-w-5xl">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{toast}</div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          <span className="text-amber-600 font-medium">{pending.length} pending</span>
          {' · '}
          <span className="text-emerald-600 font-medium">{verified.length} verified</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        {(['pending', 'verified'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'pending' ? `Pending (${pending.length})` : `Verified (${verified.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-5 h-5 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">
            {tab === 'pending' ? 'No pending payments.' : 'No verified students.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {tab === 'pending' && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p className="text-xs text-amber-700 font-medium">{pending.length} students waiting for payment verification</p>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Registered</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tab === 'pending' ? (
                      <button
                        onClick={() => verify(s.id)}
                        className="px-4 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Verify Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => revoke(s.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
