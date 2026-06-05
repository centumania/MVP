'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Student = {
  id: string; name: string; email: string; phone: string | null
  tier: string | null; payment_verified: boolean; created_at: string
  daysAttended: number
}

const CARD = { background: '#16201a', border: '1px solid #27342b' }
const TROW = { borderBottom: '1px solid rgba(39,52,43,0.6)' }
const THHD = { background: '#1b271f', borderBottom: '1px solid #27342b' }

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
      fetch('/api/admin/students?status=pending&page=1',  { headers: { Authorization: `Bearer ${tok}` } }),
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
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{ background: '#1b271f', color: '#e8ead8', border: '1px solid #27342b' }}>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Payments
        </h1>
        <p className="text-sm text-text-muted mt-0.5 font-mono">
          <span style={{ color: '#e7b14c' }}>{pending.length} pending</span>
          {' · '}
          <span style={{ color: '#6fcf8f' }}>{verified.length} verified</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit mb-6" style={{ background: '#1b271f' }}>
        {(['pending', 'verified'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize font-mono"
            style={tab === t
              ? { background: '#16201a', color: '#e8ead8', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
              : { color: '#6b7a63' }
            }
          >
            {t === 'pending' ? `Pending (${pending.length})` : `Verified (${verified.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(111,207,143,0.3)', borderTopColor: '#6fcf8f' }} />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <p className="text-sm text-text-muted">
            {tab === 'pending' ? 'No pending payments.' : 'No verified students.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          {tab === 'pending' && (
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ background: 'rgba(231,177,76,0.06)', borderBottom: '1px solid rgba(231,177,76,0.15)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#e7b14c' }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="text-xs font-medium font-mono" style={{ color: '#e7b14c' }}>
                {pending.length} students waiting for payment verification
              </p>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr style={THHD}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Student</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Registered</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id} style={TROW}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{s.name}</p>
                    <p className="text-xs text-text-muted">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs hidden md:table-cell">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-muted hidden lg:table-cell font-mono">
                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tab === 'pending' ? (
                      <button
                        onClick={() => verify(s.id)}
                        className="px-4 py-1.5 text-xs font-medium rounded-lg transition-colors font-mono"
                        style={{ background: '#3fae6a', color: '#06140c' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#2a8e57')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#3fae6a')}
                      >
                        Verify Payment
                      </button>
                    ) : (
                      <button
                        onClick={() => revoke(s.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors font-mono"
                        style={{ background: '#1b271f', color: '#9aa893', border: '1px solid #27342b' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,115,107,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#1b271f')}
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
