'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Material = {
  id: string; dayNumber: number; title: string
  hasVideo: boolean; hasPDF: boolean; hasPPT: boolean
  videoUrl: string | null; pdfKey: string | null; pptKey: string | null
  publishedAt: string; expiresAt: string; isExpired: boolean
}

const CARD = { background: '#16201a', border: '1px solid #27342b' }
const THHD = { background: '#1b271f', borderBottom: '1px solid #27342b' }
const TROW = { borderBottom: '1px solid rgba(39,52,43,0.6)' }

export default function AdminMaterials() {
  const router = useRouter()
  const [token,     setToken]    = useState<string | null>(null)
  const [batchId,   setBatchId]  = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]  = useState(true)
  const [toast,     setToast]    = useState<string | null>(null)
  const [showAdd,   setShowAdd]  = useState(false)
  const [form, setForm] = useState({ dayNumber: '', title: '', videoUrl: '', pdfKey: '', pptKey: '', publishedAt: '' })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/materials', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) { const d = await res.json(); setMaterials(d.materials); setBatchId(d.batchId) }
    setLoading(false)
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
      load(session.access_token)
    })
  }, [router, load])

  async function createMaterial() {
    if (!token || !batchId) return
    const { dayNumber, title, videoUrl, pdfKey, pptKey, publishedAt } = form
    if (!dayNumber || !title) { showToast('Day number and title required'); return }
    if (!videoUrl && !pdfKey && !pptKey) { showToast('At least one content source required'); return }
    const res = await fetch('/api/admin/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batchId, dayNumber, title, videoUrl: videoUrl || null, pdfKey: pdfKey || null, pptKey: pptKey || null, publishedAt: publishedAt || null }),
    })
    if (res.ok) {
      showToast('Material created'); setShowAdd(false)
      setForm({ dayNumber: '', title: '', videoUrl: '', pdfKey: '', pptKey: '', publishedAt: '' })
      load(token)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed')
    }
  }

  async function deleteMaterial(id: string, title: string) {
    if (!token || !confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/admin/materials/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) { setMaterials(prev => prev.filter(m => m.id !== id)); showToast('Deleted') }
  }

  async function extendExpiry(id: string) {
    if (!token) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ publishedAt: new Date().toISOString() }),
    })
    if (res.ok) { load(token); showToast('Expiry extended 24 hours from now') }
  }

  const inputStyle = { background: '#16201a', border: '1px solid #27342b', color: '#e8ead8', height: 36, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%' }

  return (
    <div className="p-8 max-w-5xl">

      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{ background: '#1b271f', color: '#e8ead8', border: '1px solid #27342b' }}>
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>Materials</h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">{materials.length} materials in active batch</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors font-mono"
          style={{ background: '#3fae6a', color: '#06140c' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a8e57')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3fae6a')}
        >
          + Add Material
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="rounded-xl w-full max-w-md p-6 shadow-2xl" style={{ background: '#16201a', border: '1px solid #27342b' }}>
            <h2 className="text-lg font-semibold text-text mb-5" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
              Add Study Material
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Day Number',                                field: 'dayNumber',   type: 'number',         placeholder: '1' },
                { label: 'Title',                                      field: 'title',       type: 'text',           placeholder: 'Day 1 — Tamil History' },
                { label: 'YouTube / Video URL (optional)',              field: 'videoUrl',    type: 'url',            placeholder: 'https://youtube.com/watch?v=…' },
                { label: 'PDF Key (S3 object key, optional)',           field: 'pdfKey',      type: 'text',           placeholder: 'materials/day-1.pdf' },
                { label: 'PPT Key (S3 object key, optional)',           field: 'pptKey',      type: 'text',           placeholder: 'materials/day-1.pptx' },
                { label: 'Publish time (blank = now)',                  field: 'publishedAt', type: 'datetime-local', placeholder: '' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-text-muted mb-1 font-mono">{label}</label>
                  <input
                    type={type} placeholder={placeholder}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={createMaterial}
                className="flex-1 h-9 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#3fae6a', color: '#06140c' }}>
                Create
              </button>
              <button onClick={() => setShowAdd(false)}
                className="flex-1 h-9 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#1b271f', color: '#9aa893', border: '1px solid #27342b' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(111,207,143,0.3)', borderTopColor: '#6fcf8f' }} />
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <p className="text-sm text-text-muted">No materials. Add the first one above.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          <table className="w-full text-sm">
            <thead>
              <tr style={THHD}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Day</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Content</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Expiry</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id} style={{ ...TROW, opacity: m.isExpired ? 0.6 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#6fcf8f' }}>D{m.dayNumber}</td>
                  <td className="px-4 py-3 text-text font-medium">{m.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      {m.hasVideo && (
                        <span className="px-1.5 py-0.5 text-xs rounded font-mono"
                          style={{ background: 'rgba(111,207,143,0.08)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.15)' }}>
                          Video
                        </span>
                      )}
                      {m.hasPDF && (
                        <span className="px-1.5 py-0.5 text-xs rounded font-mono"
                          style={{ background: 'rgba(232,115,107,0.08)', color: '#e8736b', border: '1px solid rgba(232,115,107,0.15)' }}>
                          PDF
                        </span>
                      )}
                      {m.hasPPT && (
                        <span className="px-1.5 py-0.5 text-xs rounded font-mono"
                          style={{ background: 'rgba(94,200,192,0.08)', color: '#5ec8c0', border: '1px solid rgba(94,200,192,0.15)' }}>
                          PPT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium font-mono"
                      style={m.isExpired
                        ? { background: 'rgba(232,115,107,0.08)', color: '#e8736b', border: '1px solid rgba(232,115,107,0.15)' }
                        : { background: 'rgba(231,177,76,0.08)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.15)' }
                      }>
                      {m.isExpired ? 'Expired' : new Date(m.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {m.isExpired && (
                        <button
                          onClick={() => extendExpiry(m.id)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors font-mono"
                          style={{ background: 'rgba(111,207,143,0.10)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }}
                        >
                          Extend
                        </button>
                      )}
                      <button
                        onClick={() => deleteMaterial(m.id, m.title)}
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
        </div>
      )}
    </div>
  )
}
