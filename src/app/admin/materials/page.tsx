'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Material = {
  id:          string
  dayNumber:   number
  title:       string
  htmlUrl:     string | null
  hasContent:  boolean
  publishedAt: string
  expiresAt:   string
  isExpired:   boolean
}

const CARD  = { background: '#16201a', border: '1px solid #27342b' }
const THHD  = { background: '#1b271f', borderBottom: '1px solid #27342b' }
const TROW  = { borderBottom: '1px solid rgba(39,52,43,0.6)' }

const inputStyle: React.CSSProperties = {
  background: '#16201a', border: '1px solid #27342b', color: '#e8ead8',
  height: 44, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%',
}

function domainOf(url: string | null): string {
  if (!url) return '—'
  try { return new URL(url).hostname } catch { return url.slice(0, 32) }
}

export default function AdminMaterials() {
  const router = useRouter()

  const [token,     setToken]     = useState<string | null>(null)
  const [batchId,   setBatchId]   = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)

  const [form, setForm] = useState({
    dayNumber: '', title: '', htmlUrl: '', publishedAt: '',
  })

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/materials', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) {
      const d = await res.json()
      setMaterials(d.materials ?? [])
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

  // ── Create ────────────────────────────────────────────────────────────────────
  async function createMaterial() {
    if (!token || !batchId) return
    const { dayNumber, title, htmlUrl, publishedAt } = form
    if (!dayNumber || !title) { showToast('Day number and title are required.', false); return }
    if (!htmlUrl?.trim())     { showToast('Hosted HTML URL is required.',        false); return }

    const res = await fetch('/api/admin/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batchId, dayNumber, title, htmlUrl: htmlUrl.trim(), publishedAt: publishedAt || null }),
    })

    if (res.ok) {
      showToast('Material created.')
      closeModal()
      load(token)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to create material.', false)
    }
  }

  // ── Edit (inline URL update) ──────────────────────────────────────────────────
  async function saveEdit(id: string, newUrl: string) {
    if (!token) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ htmlUrl: newUrl }),
    })
    if (res.ok) { setEditId(null); load(token); showToast('URL updated.') }
    else        { showToast('Update failed.', false) }
  }

  async function extendExpiry(id: string) {
    if (!token) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ publishedAt: new Date().toISOString() }),
    })
    if (res.ok) { load(token); showToast('Expiry extended 24 h from now.') }
  }

  async function deleteMaterial(id: string, title: string) {
    if (!token || !confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) { setMaterials(prev => prev.filter(m => m.id !== id)); showToast('Deleted.') }
  }

  function closeModal() {
    setShowAdd(false)
    setForm({ dayNumber: '', title: '', htmlUrl: '', publishedAt: '' })
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{
            background: toast.ok ? '#1b271f' : 'rgba(232,115,107,0.12)',
            color:      toast.ok ? '#e8ead8' : '#e8736b',
            border:     `1px solid ${toast.ok ? '#27342b' : 'rgba(232,115,107,0.25)'}`,
          }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Materials
          </h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">
            {materials.length} materials · paste an HTML URL to publish
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors font-mono"
          style={{ background: '#22C55E', color: '#06140c' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a8e57')}
          onMouseLeave={e => (e.currentTarget.style.background = '#22C55E')}
        >
          + Add Material
        </button>
      </div>

      {/* ── Add modal ─────────────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
          <div className="rounded-xl w-full max-w-md shadow-2xl" style={{ background: '#16201a', border: '1px solid #27342b' }}>

            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #1b271f' }}>
              <h2 className="text-lg font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                Add Study Material
              </h2>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                Paste the hosted HTML URL — students are redirected here after verification.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Day + Publish time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">Day Number</label>
                  <input type="number" placeholder="1"
                    value={form.dayNumber}
                    onChange={e => setForm(p => ({ ...p, dayNumber: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">Publish time (blank = now)</label>
                  <input type="datetime-local"
                    value={form.publishedAt}
                    onChange={e => setForm(p => ({ ...p, publishedAt: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">Title</label>
                <input type="text" placeholder="Day 1 — Tamil History"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  style={inputStyle} />
              </div>

              {/* Hosted HTML URL */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-xs font-bold text-text-muted font-mono uppercase tracking-widest">Hosted HTML URL</label>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
                    style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.20)' }}>
                    Required
                  </span>
                </div>
                <input
                  type="url"
                  placeholder="https://cdn.centumania.in/day-1.html"
                  value={form.htmlUrl}
                  onChange={e => setForm(p => ({ ...p, htmlUrl: e.target.value }))}
                  style={{ ...inputStyle, height: 40 }}
                />
                <p className="text-[10px] text-text-muted mt-1.5 font-mono">
                  Students are redirected to this URL after login + subscription check.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={createMaterial}
                className="flex-1 h-10 text-sm font-semibold rounded-lg font-mono"
                style={{ background: '#22C55E', color: '#06140c' }}>
                Publish Material
              </button>
              <button onClick={closeModal}
                className="flex-1 h-10 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#1b271f', color: '#9aa893', border: '1px solid #27342b' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Materials table ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(74,222,128,0.3)', borderTopColor: '#4ADE80' }} />
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <p className="text-sm text-text-muted font-mono">No materials yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden table-scroll" style={CARD}>
          <table className="w-full text-sm">
            <thead>
              <tr style={THHD}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Day</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Hosted URL</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Expiry</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id} style={{ ...TROW, opacity: m.isExpired ? 0.6 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>

                  <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#4ADE80' }}>D{m.dayNumber}</td>

                  <td className="px-4 py-3 text-text font-medium">{m.title}</td>

                  {/* Hosted URL cell — click to edit inline */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {editId === m.id ? (
                      <form
                        onSubmit={e => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('url') as HTMLInputElement).value; saveEdit(m.id, v) }}
                        className="flex items-center gap-2">
                        <input name="url" type="url" defaultValue={m.htmlUrl ?? ''} autoFocus
                          className="flex-1 text-xs font-mono px-2 py-1 rounded-lg"
                          style={{ background: '#0e1410', border: '1px solid #4ADE80', color: '#e8ead8' }} />
                        <button type="submit" className="text-[11px] font-mono px-2 py-1 rounded-md"
                          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>Save</button>
                        <button type="button" onClick={() => setEditId(null)}
                          className="text-[11px] text-text-muted hover:text-text font-mono">✕</button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setEditId(m.id)}
                        className="flex items-center gap-1.5 group text-left"
                        title={m.htmlUrl ?? 'No URL set'}>
                        {m.hasContent ? (
                          <span className="text-xs text-text-secondary font-mono group-hover:text-primary transition-colors">
                            {domainOf(m.htmlUrl)}
                          </span>
                        ) : (
                          <span className="text-xs font-mono" style={{ color: '#e8736b' }}>No URL — click to add</span>
                        )}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className="opacity-0 group-hover:opacity-60 transition-opacity text-text-muted" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium font-mono"
                      style={m.isExpired
                        ? { background: 'rgba(232,115,107,0.08)', color: '#e8736b', border: '1px solid rgba(232,115,107,0.15)' }
                        : { background: 'rgba(231,177,76,0.08)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.15)' }
                      }>
                      {m.isExpired
                        ? 'Expired'
                        : new Date(m.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {m.isExpired && (
                        <button onClick={() => extendExpiry(m.id)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md font-mono"
                          style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.20)' }}>
                          Extend
                        </button>
                      )}
                      {m.htmlUrl && (
                        <a href={m.htmlUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md transition-colors" style={{ color: '#3a4a3d' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5ec8c0'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(94,200,192,0.08)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLAnchorElement).style.background = '' }}
                          title="Preview URL">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                      <button onClick={() => deleteMaterial(m.id, m.title)}
                        className="p-1.5 rounded-md transition-colors" style={{ color: '#3a4a3d' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8736b'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,115,107,0.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLButtonElement).style.background = '' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
