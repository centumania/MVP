'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Material = {
  id:          string
  dayNumber:   number
  title:       string
  hasVideo:    boolean
  hasPDF:      boolean
  hasPPT:      boolean
  hasMindMap:  boolean
  videoUrl:    string | null
  pdfKey:      string | null
  pptKey:      string | null
  htmlKey:     string | null
  publishedAt: string
  expiresAt:   string
  isExpired:   boolean
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

const CARD = { background: '#16201a', border: '1px solid #27342b' }
const THHD = { background: '#1b271f', borderBottom: '1px solid #27342b' }
const TROW = { borderBottom: '1px solid rgba(39,52,43,0.6)' }

const inputStyle: React.CSSProperties = {
  background: '#16201a', border: '1px solid #27342b', color: '#e8ead8',
  height: 36, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%',
}

export default function AdminMaterials() {
  const router      = useRouter()
  const htmlInputRef = useRef<HTMLInputElement>(null)

  const [token,     setToken]    = useState<string | null>(null)
  const [batchId,   setBatchId]  = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]  = useState(true)
  const [toast,     setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [showAdd,   setShowAdd]  = useState(false)

  // Form state
  const [form, setForm] = useState({
    dayNumber: '', title: '', videoUrl: '', pdfKey: '', pptKey: '', publishedAt: '',
  })
  // HTML upload state
  const [htmlKey,      setHtmlKey]      = useState<string>('')
  const [htmlFileName, setHtmlFileName] = useState<string>('')
  const [uploadState,  setUploadState]  = useState<UploadState>('idle')
  const [uploadError,  setUploadError]  = useState<string>('')

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

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

  // ── HTML file upload ──────────────────────────────────────────────────────────
  async function handleHtmlFile(file: File) {
    if (!token) return
    if (!file.name.endsWith('.html')) {
      setUploadError('Only .html files are accepted.')
      setUploadState('error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5 MB limit.')
      setUploadState('error')
      return
    }

    setUploadState('uploading')
    setUploadError('')
    setHtmlFileName(file.name)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/admin/materials/upload-html', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })

    if (res.ok) {
      const { key } = await res.json()
      setHtmlKey(key)
      setUploadState('done')
    } else {
      const err = await res.json().catch(() => ({}))
      setUploadError(err.error ?? 'Upload failed. Please try again.')
      setUploadState('error')
    }
  }

  function clearHtml() {
    setHtmlKey('')
    setHtmlFileName('')
    setUploadState('idle')
    setUploadError('')
    if (htmlInputRef.current) htmlInputRef.current.value = ''
  }

  // ── Create material ───────────────────────────────────────────────────────────
  async function createMaterial() {
    if (!token || !batchId) return
    const { dayNumber, title, videoUrl, pdfKey, pptKey, publishedAt } = form
    if (!dayNumber || !title) { showToast('Day number and title are required.', false); return }
    if (!videoUrl && !pdfKey && !pptKey && !htmlKey) {
      showToast('Add at least one content source — MindMap HTML, Video, PDF, or PPT.', false); return
    }

    const res = await fetch('/api/admin/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        batchId, dayNumber, title,
        videoUrl:    videoUrl || null,
        pdfKey:      pdfKey   || null,
        pptKey:      pptKey   || null,
        htmlKey:     htmlKey  || null,
        publishedAt: publishedAt || null,
      }),
    })

    if (res.ok) {
      showToast('Material created successfully.')
      closeModal()
      load(token)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to create material.', false)
    }
  }

  async function deleteMaterial(id: string, title: string) {
    if (!token || !confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) { setMaterials(prev => prev.filter(m => m.id !== id)); showToast('Deleted.') }
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

  function closeModal() {
    setShowAdd(false)
    setForm({ dayNumber: '', title: '', videoUrl: '', pdfKey: '', pptKey: '', publishedAt: '' })
    clearHtml()
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{
            background: toast.ok ? '#1b271f' : 'rgba(232,115,107,0.12)',
            color: toast.ok ? '#e8ead8' : '#e8736b',
            border: `1px solid ${toast.ok ? '#27342b' : 'rgba(232,115,107,0.25)'}`,
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
            {materials.length} materials in active batch
          </p>
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

      {/* ── Add modal ─────────────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
          <div className="rounded-xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
            style={{ background: '#16201a', border: '1px solid #27342b' }}>

            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #1b271f' }}>
              <h2 className="text-lg font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                Add Study Material
              </h2>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                Upload a MindMap HTML file as the primary interactive content.
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

              {/* ── MindMap HTML Upload ──────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-bold text-text-muted font-mono uppercase tracking-widest">
                    MindMap HTML
                  </label>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
                    style={{ background: 'rgba(111,207,143,0.10)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }}>
                    PRIMARY
                  </span>
                </div>

                {uploadState === 'done' ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(111,207,143,0.06)', border: '1px solid rgba(111,207,143,0.20)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6fcf8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="text-xs text-primary flex-1 truncate font-mono">{htmlFileName}</span>
                    <button onClick={clearHtml}
                      className="text-[11px] text-text-muted hover:text-error transition-colors font-mono">
                      ✕ Remove
                    </button>
                  </div>

                ) : uploadState === 'uploading' ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #27342b' }}>
                    <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin shrink-0"
                      style={{ borderTopColor: '#6fcf8f' }} />
                    <span className="text-xs text-text-muted font-mono">Uploading {htmlFileName}…</span>
                  </div>

                ) : (
                  <label
                    className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg cursor-pointer transition-all"
                    style={{ border: '2px dashed #27342b', background: 'rgba(255,255,255,0.01)' }}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(111,207,143,0.5)'; e.currentTarget.style.background = 'rgba(111,207,143,0.04)' }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = '#27342b'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}
                    onDrop={e => {
                      e.preventDefault()
                      e.currentTarget.style.borderColor = '#27342b'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.01)'
                      const file = e.dataTransfer.files[0]
                      if (file) handleHtmlFile(file)
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a4a3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div className="text-center">
                      <p className="text-xs font-medium text-text-secondary">Drop your HTML MindMap here</p>
                      <p className="text-[11px] text-text-muted mt-0.5">or click to browse · .html · max 5 MB</p>
                    </div>
                    <input ref={htmlInputRef} type="file" accept=".html,text/html" className="sr-only"
                      onChange={e => { const file = e.target.files?.[0]; if (file) handleHtmlFile(file) }} />
                  </label>
                )}

                {uploadState === 'error' && (
                  <p className="text-xs mt-1.5 font-mono" style={{ color: '#e8736b' }}>⚠ {uploadError}</p>
                )}
              </div>

              {/* Optional extras divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: '#27342b' }} />
                <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Optional extras</span>
                <div className="flex-1 h-px" style={{ background: '#27342b' }} />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">YouTube / Video URL</label>
                <input type="url" placeholder="https://youtube.com/watch?v=…"
                  value={form.videoUrl}
                  onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                  style={inputStyle} />
              </div>

              {/* PDF + PPT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">PDF Storage Key</label>
                  <input type="text" placeholder="materials/day-1.pdf"
                    value={form.pdfKey}
                    onChange={e => setForm(p => ({ ...p, pdfKey: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">PPT Storage Key</label>
                  <input type="text" placeholder="materials/day-1.pptx"
                    value={form.pptKey}
                    onChange={e => setForm(p => ({ ...p, pptKey: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={createMaterial} disabled={uploadState === 'uploading'}
                className="flex-1 h-10 text-sm font-semibold rounded-lg font-mono transition-opacity disabled:opacity-40"
                style={{ background: '#3fae6a', color: '#06140c' }}>
                Create Material
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
            style={{ borderColor: 'rgba(111,207,143,0.3)', borderTopColor: '#6fcf8f' }} />
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <p className="text-sm text-text-muted">No materials yet. Add the first one above.</p>
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
                    <div className="flex items-center gap-1 flex-wrap">
                      {m.hasMindMap && (
                        <span className="px-1.5 py-0.5 text-xs rounded font-mono"
                          style={{ background: 'rgba(111,207,143,0.10)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }}>
                          MindMap
                        </span>
                      )}
                      {m.hasVideo && (
                        <span className="px-1.5 py-0.5 text-xs rounded font-mono"
                          style={{ background: 'rgba(94,200,192,0.08)', color: '#5ec8c0', border: '1px solid rgba(94,200,192,0.15)' }}>
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
                          style={{ background: 'rgba(231,177,76,0.08)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.15)' }}>
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
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors font-mono"
                          style={{ background: 'rgba(111,207,143,0.10)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }}>
                          Extend
                        </button>
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
