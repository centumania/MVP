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

export default function AdminMaterials() {
  const router   = useRouter()
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
    if (res.ok) {
      const d = await res.json()
      setMaterials(d.materials)
      setBatchId(d.batchId)
    }
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
      showToast('Material created')
      setShowAdd(false)
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

  return (
    <div className="p-8 max-w-5xl">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{toast}</div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Materials</h1>
          <p className="text-sm text-slate-500 mt-0.5">{materials.length} materials in active batch</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[#0EA5E9] text-white text-sm font-medium rounded-lg hover:bg-[#0284C7] transition-colors"
        >
          + Add Material
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Add Study Material</h2>
            <div className="space-y-3">
              {[
                { label: 'Day Number', field: 'dayNumber', type: 'number', placeholder: '1' },
                { label: 'Title',      field: 'title',     type: 'text',   placeholder: 'Day 1 — Tamil History' },
                { label: 'YouTube / Video URL (optional)', field: 'videoUrl', type: 'url', placeholder: 'https://youtube.com/watch?v=…' },
                { label: 'PDF Key (S3 object key, optional)', field: 'pdfKey', type: 'text', placeholder: 'materials/day-1.pdf' },
                { label: 'PPT Key (S3 object key, optional)', field: 'pptKey', type: 'text', placeholder: 'materials/day-1.pptx' },
                { label: 'Publish time (blank = now)',  field: 'publishedAt', type: 'datetime-local', placeholder: '' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-slate-900"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={createMaterial} className="flex-1 h-9 bg-[#0EA5E9] text-white text-sm font-medium rounded-lg hover:bg-[#0284C7] transition-colors">Create</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 h-9 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Materials list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-5 h-5 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">No materials. Add the first one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Day</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Content</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Expiry</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materials.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${m.isExpired ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-700">D{m.dayNumber}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{m.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      {m.hasVideo && <span className="px-1.5 py-0.5 bg-[#0EA5E9]/10 text-[#0369A1] text-xs rounded">Video</span>}
                      {m.hasPDF   && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded">PDF</span>}
                      {m.hasPPT   && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded">PPT</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${m.isExpired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                      {m.isExpired ? 'Expired' : new Date(m.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {m.isExpired && (
                        <button
                          onClick={() => extendExpiry(m.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md hover:bg-emerald-100 transition-colors border border-emerald-100"
                        >
                          Extend
                        </button>
                      )}
                      <button
                        onClick={() => deleteMaterial(m.id, m.title)}
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
        </div>
      )}
    </div>
  )
}
