'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type ContentType = 'pdf' | 'html' | null

type Material = {
  id:          string
  dayNumber:   number
  title:       string
  htmlUrl:     string | null
  pdfKey:      string | null
  testLink:    string | null
  contentType: ContentType
  hasContent:  boolean
  publishedAt: string
  expiresAt:   string
  isExpired:   boolean
}

const CARD = { background: '#FFFFFF', border: '1px solid #E5E7EB' }
const THHD = { background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }
const TROW = { borderBottom: '1px solid rgba(229,231,235,0.6)' }

const inputStyle: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827',
  height: 44, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%',
}

function domainOf(url: string | null): string {
  if (!url) return '—'
  try { return new URL(url).hostname } catch { return url.slice(0, 30) }
}

function pdfName(key: string | null): string {
  if (!key) return '—'
  const parts = key.split('/')
  const filename = parts[parts.length - 1] ?? key
  // Strip UUID prefix (format: uuid-originalname.pdf)
  const noUuid = filename.replace(/^[0-9a-f-]{36}-/, '')
  return noUuid.length > 30 ? noUuid.slice(0, 28) + '…' : noUuid
}

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadPdf(
  file: File,
  token: string,
  onProgress: (pct: number) => void,
): Promise<{ key?: string; error?: string }> {
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText)
        if (xhr.status === 201) resolve({ key: body.key })
        else resolve({ error: body.error ?? `Upload failed (${xhr.status})` })
      } catch {
        resolve({ error: 'Upload failed — invalid response.' })
      }
    }
    xhr.onerror = () => resolve({ error: 'Network error during upload.' })
    xhr.open('POST', '/api/admin/materials/upload-pdf')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(form)
  })
}

// ── Tab pill ──────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 text-xs font-semibold font-mono rounded-lg transition-colors"
      style={active
        ? { background: 'rgba(2,132,199,0.12)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.25)' }
        : { background: 'transparent', color: '#9CA3AF', border: '1px solid transparent' }}
    >
      {label}
    </button>
  )
}

// ── Content type badge ────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ContentType }) {
  if (!type) return <span className="text-xs font-mono" style={{ color: '#EF4444' }}>No content</span>
  if (type === 'pdf') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
      style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      PDF
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
      style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      URL
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminMaterials() {
  const router = useRouter()

  const [token,     setToken]     = useState<string | null>(null)
  const [batchId,   setBatchId]   = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  // ── Add modal state ────────────────────────────────────────────────────────
  const [showAdd,   setShowAdd]   = useState(false)
  const [addTab,    setAddTab]    = useState<'pdf' | 'url'>('pdf')
  const [form,      setForm]      = useState({ dayNumber: '', title: '', htmlUrl: '', testLink: '', publishedAt: '' })
  const [pdfFile,   setPdfFile]   = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Inline edit state ──────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null)

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

  // ── Upload PDF step ────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!pdfFile || !token) return
    setUploadPct(0)
    const result = await uploadPdf(pdfFile, token, setUploadPct)
    if (result.error) { showToast(result.error, false); setUploadPct(null); return }
    setUploadedKey(result.key ?? null)
    setUploadPct(null)
    showToast('PDF uploaded. Now fill in the details and publish.')
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  async function createMaterial() {
    if (!token || !batchId) return
    const { dayNumber, title, htmlUrl, testLink, publishedAt } = form
    if (!dayNumber || !title) { showToast('Day number and title are required.', false); return }

    if (addTab === 'pdf' && !uploadedKey) { showToast('Upload a PDF first.', false); return }
    if (addTab === 'url' && !htmlUrl?.trim()) { showToast('Paste a URL.', false); return }

    const body: Record<string, string | null> = {
      batchId, dayNumber, title,
      htmlUrl:     addTab === 'url' ? htmlUrl.trim() : null,
      pdfKey:      addTab === 'pdf' ? (uploadedKey ?? null) : null,
      testLink:    testLink?.trim() || null,
      publishedAt: publishedAt || null,
    }

    const res = await fetch('/api/admin/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    if (res.ok) { showToast('Material published.'); closeModal(); load(token) }
    else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to publish.', false)
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  async function saveEdit(id: string, patch: Record<string, string | null>) {
    if (!token) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
    if (res.ok) { setEditId(null); load(token); showToast('Updated.') }
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
    if (!token || !confirm(`Delete "${title}"? This also removes the uploaded PDF from storage.`)) return
    const res = await fetch(`/api/admin/materials/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) { setMaterials(prev => prev.filter(m => m.id !== id)); showToast('Deleted.') }
    else        { showToast('Delete failed.', false) }
  }

  function closeModal() {
    setShowAdd(false)
    setForm({ dayNumber: '', title: '', htmlUrl: '', testLink: '', publishedAt: '' })
    setPdfFile(null)
    setUploadPct(null)
    setUploadedKey(null)
    setAddTab('pdf')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{
            background: toast.ok ? '#FFFFFF' : 'rgba(239,68,68,0.12)',
            color:      toast.ok ? '#111827' : '#EF4444',
            border:     `1px solid ${toast.ok ? '#E5E7EB' : 'rgba(239,68,68,0.25)'}`,
          }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Materials
          </h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">
            {materials.length} materials · upload PDF or paste URL
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors font-mono shrink-0"
          style={{ background: '#10B981', color: '#FFFFFF' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0A357D')}
          onMouseLeave={e => (e.currentTarget.style.background = '#10B981')}
        >
          + Add Material
        </button>
      </div>

      {/* ── Add modal ──────────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl w-full max-w-md shadow-2xl my-auto" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>

            {/* Modal header */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #FFFFFF' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                    Add Study Material
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">
                    Upload a PDF or paste an external URL.
                  </p>
                </div>
                <button onClick={closeModal} className="text-text-muted hover:text-text p-1 transition-colors" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Content type tabs */}
              <div className="flex gap-1 mt-4 p-1 rounded-lg" style={{ background: '#FFFFFF' }}>
                <Tab label="📄  Upload PDF"  active={addTab === 'pdf'} onClick={() => setAddTab('pdf')} />
                <Tab label="🔗  Paste URL"   active={addTab === 'url'} onClick={() => setAddTab('url')} />
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* ── PDF tab ──────────────────────────────────────────────── */}
              {addTab === 'pdf' && (
                <div>
                  {/* Step 1: pick file */}
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">
                    Step 1 — Select PDF (max 20 MB)
                  </label>

                  {uploadedKey ? (
                    /* Uploaded ✓ */
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                      style={{ background: 'rgba(2,132,199,0.06)', border: '1px solid rgba(2,132,199,0.20)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="text-xs text-primary font-mono truncate">{pdfName(uploadedKey)}</span>
                      </div>
                      <button type="button" onClick={() => { setUploadedKey(null); setPdfFile(null) }}
                        className="text-xs text-text-muted hover:text-text font-mono shrink-0">
                        Change
                      </button>
                    </div>
                  ) : (
                    /* File picker + upload button */
                    <div className="space-y-2">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 py-5 rounded-lg cursor-pointer transition-colors"
                        style={{ border: '1.5px dashed #E5E7EB' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(2,132,199,0.3)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="12" y1="18" x2="12" y2="12"/>
                          <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                        {pdfFile
                          ? <span className="text-xs text-text-secondary font-mono">{pdfFile.name}</span>
                          : <span className="text-xs text-text-muted font-mono">Click to select PDF</span>
                        }
                        {pdfFile && (
                          <span className="text-[10px] text-text-muted font-mono">
                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }}
                      />

                      {/* Upload progress */}
                      {uploadPct !== null && (
                        <div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#FFFFFF' }}>
                            <div
                              className="h-full rounded-full transition-all duration-200"
                              style={{ width: `${uploadPct}%`, background: '#0284c7' }}
                            />
                          </div>
                          <p className="text-[10px] text-text-muted font-mono mt-1 text-right">{uploadPct}%</p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!pdfFile || uploadPct !== null}
                        className="w-full h-9 text-sm font-medium rounded-lg font-mono transition-opacity disabled:opacity-40"
                        style={{ background: 'rgba(2,132,199,0.12)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.25)' }}
                      >
                        {uploadPct !== null ? `Uploading… ${uploadPct}%` : '⬆ Upload PDF'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── URL tab ───────────────────────────────────────────────── */}
              {addTab === 'url' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">
                    Content URL (HTML page or direct PDF link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://cdn.centumania.in/day-1.html"
                    value={form.htmlUrl}
                    onChange={e => setForm(p => ({ ...p, htmlUrl: e.target.value }))}
                    style={{ ...inputStyle, height: 40 }}
                  />
                  <p className="text-[10px] text-text-muted mt-1.5 font-mono">
                    Students open this URL in the secure in-app viewer after auth check.
                  </p>
                </div>
              )}

              {/* ── Common fields (both tabs) ──────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">
                    {addTab === 'pdf' ? 'Step 2 — Day Number' : 'Day Number'}
                  </label>
                  <input type="number" placeholder="1" min={1} max={25}
                    value={form.dayNumber}
                    onChange={e => setForm(p => ({ ...p, dayNumber: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">Publish time</label>
                  <input type="datetime-local"
                    value={form.publishedAt}
                    onChange={e => setForm(p => ({ ...p, publishedAt: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">Title</label>
                <input type="text" placeholder="Day 1 — Tamil History"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">
                  Test Link <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://forms.gle/…"
                  value={form.testLink}
                  onChange={e => setForm(p => ({ ...p, testLink: e.target.value }))}
                  style={{ ...inputStyle, height: 40 }}
                />
                <p className="text-[10px] text-text-muted mt-1 font-mono">
                  Students see a &quot;Take Today&apos;s Test&quot; button linking here.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={createMaterial}
                disabled={!form.dayNumber || !form.title || (addTab === 'pdf' ? !uploadedKey : !form.htmlUrl?.trim()) && !form.testLink?.trim()}
                className="flex-1 h-10 text-sm font-semibold rounded-lg font-mono transition-opacity disabled:opacity-40"
                style={{ background: '#10B981', color: '#FFFFFF' }}
              >
                Publish
              </button>
              <button onClick={closeModal}
                className="flex-1 h-10 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Storage setup notice ─────────────────────────────────────────── */}
      <div className="mb-5 px-4 py-3 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-xs text-text-muted font-mono leading-relaxed">
          <span className="text-warning font-bold">PDF upload requires setup:</span>{' '}
          Go to Supabase Dashboard → Storage → Create bucket named{' '}
          <span className="text-text font-semibold">centumania-materials</span>{' '}
          and set it to <span className="text-text font-semibold">Private</span>. Do this once before uploading PDFs.
        </p>
      </div>

      {/* ── Materials table ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-xl p-12 text-center" style={CARD}>
          <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(2,132,199,0.3)', borderTopColor: '#0284c7' }} />
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
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono w-12">Day</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Content</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Expiry</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id} style={{ ...TROW, opacity: m.isExpired ? 0.6 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(2,132,199,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>

                  {/* Day */}
                  <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#0284c7' }}>D{m.dayNumber}</td>

                  {/* Title */}
                  <td className="px-4 py-3 text-text font-medium max-w-[160px]">
                    <span className="block truncate">{m.title}</span>
                    {/* Type badge on mobile (hidden on md+) */}
                    <span className="md:hidden mt-0.5 inline-block">
                      <TypeBadge type={m.contentType} />
                    </span>
                  </td>

                  {/* Content cell — click to edit inline */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {editId === m.id ? (
                      <InlineEdit
                        material={m}
                        token={token!}
                        onSave={saveEdit}
                        onCancel={() => setEditId(null)}
                      />
                    ) : (
                      <div className="space-y-1">
                        <button
                          onClick={() => setEditId(m.id)}
                          className="flex items-center gap-2 group text-left"
                          title={m.pdfKey ?? m.htmlUrl ?? 'No content — click to add'}>
                          <TypeBadge type={m.contentType} />
                          <span className="text-xs text-text-secondary font-mono group-hover:text-primary transition-colors truncate max-w-[120px]">
                            {m.contentType === 'pdf'
                              ? pdfName(m.pdfKey)
                              : m.htmlUrl
                              ? domainOf(m.htmlUrl)
                              : 'Click to add'}
                          </span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className="opacity-0 group-hover:opacity-60 transition-opacity text-text-muted shrink-0" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {m.testLink && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706', border: '1px solid rgba(245,158,11,0.25)' }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                              </svg>
                              TEST
                            </span>
                            <span className="text-[10px] font-mono truncate max-w-[100px]" style={{ color: '#9CA3AF' }}>
                              {domainOf(m.testLink)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium font-mono whitespace-nowrap"
                      style={m.isExpired
                        ? { background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }
                        : { background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.15)' }
                      }>
                      {m.isExpired
                        ? 'Expired'
                        : new Date(m.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {m.isExpired && (
                        <button onClick={() => extendExpiry(m.id)}
                          className="px-2 py-1.5 text-xs font-medium rounded-md font-mono"
                          style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }}>
                          Extend
                        </button>
                      )}
                      {/* Preview link — only for HTML URLs (PDFs need signed URL, can't preview directly) */}
                      {m.htmlUrl && (
                        <a href={m.htmlUrl} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md transition-colors" style={{ color: '#3a4a3d' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0284c7'; (e.currentTarget as HTMLElement).style.background = 'rgba(2,132,199,0.08)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLElement).style.background = '' }}
                          title="Preview URL">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                      <button onClick={() => deleteMaterial(m.id, m.title)}
                        className="p-1.5 rounded-md transition-colors" style={{ color: '#3a4a3d' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a4a3d'; (e.currentTarget as HTMLElement).style.background = '' }}
                        title={`Delete ${m.title}`}>
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

// ── Inline edit sub-component ─────────────────────────────────────────────────
function InlineEdit({
  material, token,
  onSave, onCancel,
}: {
  material: Material
  token: string
  onSave: (id: string, patch: Record<string, string | null>) => void
  onCancel: () => void
}) {
  const [mode, setMode]     = useState<'pdf' | 'url'>(material.contentType === 'pdf' ? 'pdf' : 'url')
  const [urlVal, setUrlVal] = useState(material.htmlUrl ?? '')
  const [testLinkVal, setTestLinkVal] = useState(material.testLink ?? '')
  const [pdfFile, setPdfFile]   = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!pdfFile || !token) return
    setUploadPct(0)
    const result = await uploadPdf(pdfFile, token, setUploadPct)
    setUploadPct(null)
    if (result.error) { alert(result.error); return }
    setUploadedKey(result.key ?? null)
  }

  function handleSave() {
    const patch: Record<string, string | null> = {
      testLink: testLinkVal.trim() || null,
    }
    if (mode === 'url') patch.htmlUrl = urlVal.trim() || null
    else if (uploadedKey) patch.pdfKey = uploadedKey
    onSave(material.id, patch)
  }

  const canSave = mode === 'url' ? urlVal.trim().length > 0 : !!uploadedKey

  return (
    <div className="space-y-2 py-1 min-w-[220px]">
      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#FFFFFF' }}>
        <Tab label="PDF" active={mode === 'pdf'} onClick={() => setMode('pdf')} />
        <Tab label="URL" active={mode === 'url'} onClick={() => setMode('url')} />
      </div>

      {mode === 'url' ? (
        <input
          type="url" autoFocus
          value={urlVal}
          onChange={e => setUrlVal(e.target.value)}
          placeholder="https://…"
          className="w-full text-xs font-mono px-2 py-1.5 rounded-lg"
          style={{ background: '#F8FAFC', border: '1px solid #0284c7', color: '#111827' }}
        />
      ) : uploadedKey ? (
        <div className="flex items-center gap-2 text-xs font-mono px-2 py-1.5 rounded-lg"
          style={{ background: 'rgba(2,132,199,0.06)', border: '1px solid rgba(2,132,199,0.20)' }}>
          <span className="text-primary truncate flex-1">{pdfName(uploadedKey)}</span>
          <button type="button" onClick={() => { setUploadedKey(null); setPdfFile(null) }} className="text-text-muted hover:text-text">✕</button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full text-xs font-mono py-1.5 rounded-lg transition-colors"
            style={{ border: '1px dashed #E5E7EB', color: '#6B7280' }}>
            {pdfFile ? pdfFile.name : 'Select PDF…'}
          </button>
          {uploadPct !== null && (
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#FFFFFF' }}>
              <div className="h-full rounded-full" style={{ width: `${uploadPct}%`, background: '#0284c7' }} />
            </div>
          )}
          {pdfFile && uploadPct === null && (
            <button type="button" onClick={handleUpload}
              className="w-full text-xs font-mono py-1 rounded-md"
              style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }}>
              ⬆ Upload
            </button>
          )}
        </div>
      )}

      <div>
        <p className="text-[10px] text-text-muted font-mono mb-1">Test link (optional)</p>
        <input
          type="url"
          value={testLinkVal}
          onChange={e => setTestLinkVal(e.target.value)}
          placeholder="https://forms.gle/…"
          className="w-full text-xs font-mono px-2 py-1.5 rounded-lg"
          style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', color: '#111827' }}
        />
      </div>

      <div className="flex gap-1.5">
        <button type="button" onClick={handleSave} disabled={!canSave && !testLinkVal.trim()}
          className="flex-1 text-[11px] font-mono py-1.5 rounded-md transition-opacity disabled:opacity-40"
          style={{ background: 'rgba(2,132,199,0.12)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.20)' }}>
          Save
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 text-[11px] text-text-muted hover:text-text font-mono py-1.5 rounded-md transition-colors"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
