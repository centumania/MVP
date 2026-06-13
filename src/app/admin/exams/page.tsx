'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Exam = {
  id: string; day_number: number; title: string; exam_date: string
  open_time: string; close_time: string; is_active: boolean
  linkUrl: string | null
  questionCount: number; submissionCount: number
}

type Question = {
  id?: string; question_text: string; option_a: string; option_b: string
  option_c: string; option_d: string; correct_answer: 'A'|'B'|'C'|'D'
  explanation: string; marks: number
}

const EMPTY_Q: Question = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', marks: 1 }
const CARD = { background: '#FFFFFF', border: '1px solid #E5E7EB' }
const THHD = { background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }
const TROW = { borderBottom: '1px solid rgba(229,231,235,0.6)' }

export default function AdminExams() {
  const router = useRouter()
  const [token,    setToken]   = useState<string | null>(null)
  const [batchId,  setBatchId] = useState<string | null>(null)
  const [exams,    setExams]   = useState<Exam[]>([])
  const [loading,  setLoading] = useState(true)
  const [selected, setSelected] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([{ ...EMPTY_Q }])
  const [qLoading,  setQLoading]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newExam, setNewExam] = useState({ dayNumber: '', title: '', examDate: '', linkUrl: '' })
  const [editLinkId,  setEditLinkId]  = useState<string | null>(null)
  const [editLinkVal, setEditLinkVal] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const loadExams = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/exams', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) { const d = await res.json(); setExams(d.exams); setBatchId(d.batchId) }
    setLoading(false)
  }, [])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
      loadExams(session.access_token)
    })
  }, [router, loadExams])

  async function openQuestions(exam: Exam) {
    if (!token) return
    setSelected(exam); setQLoading(true)
    const res = await fetch(`/api/admin/exams/${exam.id}/questions`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const d = await res.json()
      setQuestions(d.questions.length > 0 ? d.questions : [{ ...EMPTY_Q }])
    }
    setQLoading(false)
  }

  function updateQ(i: number, field: keyof Question, val: string | number) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q))
  }

  async function saveQuestions() {
    if (!token || !selected) return
    setSaving(true)
    const res = await fetch(`/api/admin/exams/${selected.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questions: questions.map((q, i) => ({ ...q, sort_order: i })), mode: 'replace' }),
    })
    setSaving(false)
    if (res.ok) {
      const d = await res.json()
      showToast(`Saved ${d.inserted} questions`)
      setExams(prev => prev.map(e => e.id === selected.id ? { ...e, questionCount: d.inserted } : e))
      setSelected(null)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Save failed')
    }
  }

  async function createExam() {
    if (!token || !batchId) return
    const { dayNumber, title, examDate, linkUrl } = newExam
    if (!dayNumber || !title || !examDate) { showToast('Fill all required fields'); return }
    const open  = new Date(`${examDate}T00:00:00+05:30`)
    const close = new Date(`${examDate}T23:59:59+05:30`)
    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batchId, dayNumber: Number(dayNumber), title, examDate, openTime: open.toISOString(), closeTime: close.toISOString(), linkUrl: linkUrl.trim() || null }),
    })
    if (res.ok) {
      showToast('Exam created'); setShowCreate(false)
      setNewExam({ dayNumber: '', title: '', examDate: '', linkUrl: '' })
      loadExams(token)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to create exam')
    }
  }

  async function saveLink(examId: string) {
    if (!token) return
    const res = await fetch(`/api/admin/exams/${examId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ linkUrl: editLinkVal.trim() || null }),
    })
    if (res.ok) {
      setEditLinkId(null)
      setExams(prev => prev.map(e => e.id === examId ? { ...e, linkUrl: editLinkVal.trim() || null } : e))
      showToast('Link saved.')
    } else {
      showToast('Failed to save link.')
    }
  }

  const inputStyle = { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827', height: 44, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%' }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">

      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{ background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB' }}>
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>Exams</h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">{exams.length} exams in active batch</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors font-mono"
          style={{ background: '#10B981', color: '#FFFFFF' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a8e57')}
          onMouseLeave={e => (e.currentTarget.style.background = '#10B981')}
        >
          + New Exam
        </button>
      </div>

      {/* Create exam modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="rounded-xl w-full max-w-md p-6 shadow-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <h2 className="text-lg font-semibold text-text mb-5" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>Create Exam</h2>
            <div className="space-y-4">
              {[
                { label: 'Day Number (1–25)', field: 'dayNumber', type: 'number', placeholder: '1' },
                { label: 'Title',             field: 'title',     type: 'text',   placeholder: 'Day 1 — General Knowledge' },
                { label: 'Exam Date (IST)',    field: 'examDate',  type: 'date',   placeholder: '' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">{label}</label>
                  <input
                    type={type} placeholder={placeholder}
                    value={newExam[field as keyof typeof newExam]}
                    onChange={e => setNewExam(prev => ({ ...prev, [field]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 font-mono">
                  Test Link <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://forms.gle/…"
                  value={newExam.linkUrl}
                  onChange={e => setNewExam(prev => ({ ...prev, linkUrl: e.target.value }))}
                  style={inputStyle}
                />
                <p className="text-[10px] text-text-muted mt-1 font-mono">
                  Students see an &quot;Open Test Link&quot; button on the exam page.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createExam}
                className="flex-1 h-11 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#10B981', color: '#FFFFFF' }}>
                Create
              </button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 h-11 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exams table */}
      {loading ? (
        <div className="rounded-xl p-8 text-center" style={CARD}>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(11,61,145,0.3)', borderTopColor: '#0B3D91' }} />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden table-scroll" style={CARD}>
          <table className="w-full text-sm">
            <thead>
              <tr style={THHD}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Day</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Questions</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Test Link</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden lg:table-cell">Submissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted">No exams. Create one above.</td></tr>
              ) : exams.map(exam => (
                <tr key={exam.id} style={TROW}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#0B3D91' }}>D{exam.day_number}</td>
                  <td className="px-4 py-3 text-text font-medium">{exam.title}</td>
                  <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell font-mono">
                    {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-mono"
                      style={exam.questionCount > 0
                        ? { background: 'rgba(11,61,145,0.08)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.20)' }
                        : { background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.20)' }
                      }>
                      {exam.questionCount} Qs
                    </span>
                  </td>
                  {/* Test Link cell */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {editLinkId === exam.id ? (
                      <div className="flex items-center gap-1.5 min-w-[200px]">
                        <input
                          type="url" autoFocus
                          value={editLinkVal}
                          onChange={e => setEditLinkVal(e.target.value)}
                          placeholder="https://forms.gle/…"
                          className="flex-1 text-xs font-mono px-2 py-1.5 rounded-lg"
                          style={{ background: '#F8FAFC', border: '1px solid rgba(11,61,145,0.4)', color: '#111827', minWidth: 0 }}
                          onKeyDown={e => { if (e.key === 'Enter') saveLink(exam.id); if (e.key === 'Escape') setEditLinkId(null) }}
                        />
                        <button type="button" onClick={() => saveLink(exam.id)}
                          className="text-[11px] font-mono px-2 py-1.5 rounded-md shrink-0"
                          style={{ background: 'rgba(11,61,145,0.12)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.20)' }}>
                          Save
                        </button>
                        <button type="button" onClick={() => setEditLinkId(null)}
                          className="text-[11px] text-text-muted font-mono py-1.5 shrink-0">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditLinkId(exam.id); setEditLinkVal(exam.linkUrl ?? '') }}
                        className="flex items-center gap-1.5 group text-left"
                        title={exam.linkUrl ?? 'Click to add test link'}>
                        {exam.linkUrl ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706', border: '1px solid rgba(245,158,11,0.25)' }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                              </svg>
                              LINK
                            </span>
                            <span className="text-[10px] font-mono truncate max-w-[120px] group-hover:text-primary transition-colors" style={{ color: '#9CA3AF' }}>
                              {(() => { try { return new URL(exam.linkUrl).hostname } catch { return exam.linkUrl.slice(0, 20) } })()}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-text-muted group-hover:text-primary transition-colors">+ Add link</span>
                        )}
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className="opacity-0 group-hover:opacity-60 transition-opacity text-text-muted shrink-0" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-3 text-text-muted font-mono text-xs hidden lg:table-cell">{exam.submissionCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openQuestions(exam)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors font-mono"
                      style={{ background: 'rgba(11,61,145,0.08)', color: '#0B3D91', border: '1px solid rgba(11,61,145,0.15)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(11,61,145,0.16)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(11,61,145,0.08)')}
                    >
                      {exam.questionCount > 0 ? 'Edit Questions' : 'Add Questions'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Question editor drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-2xl h-full overflow-y-auto shadow-2xl flex flex-col"
            style={{ background: '#F1F5F9', borderLeft: '1px solid #E5E7EB' }}>

            <div className="sticky top-0 px-6 py-4 flex items-center justify-between"
              style={{ background: '#F1F5F9', borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <p className="font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                  Day {selected.day_number} — Questions
                </p>
                <p className="text-xs text-text-muted mt-0.5 font-mono">{questions.length} questions</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuestions(prev => [...prev, { ...EMPTY_Q }])}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg font-mono"
                  style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                  + Add
                </button>
                <button
                  onClick={saveQuestions} disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 font-mono"
                  style={{ background: '#10B981', color: '#FFFFFF' }}>
                  {saving ? 'Saving…' : 'Save All'}
                </button>
                <button onClick={() => setSelected(null)} className="p-1.5 text-text-muted hover:text-text">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {qLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'rgba(11,61,145,0.3)', borderTopColor: '#0B3D91' }} />
                </div>
              ) : questions.map((q, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-text-muted px-2 py-0.5 rounded-md font-mono"
                      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                      Q{i + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-error hover:text-error/80 font-mono">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <textarea
                      placeholder="Question text…"
                      value={q.question_text}
                      onChange={e => updateQ(i, 'question_text', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg resize-none focus:outline-none"
                      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(11,61,145,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                    />
                    {(['A','B','C','D'] as const).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQ(i, 'correct_answer', opt)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors font-mono"
                          style={q.correct_answer === opt
                            ? { background: '#10B981', color: '#FFFFFF', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }
                            : { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#9CA3AF' }
                          }>
                          {opt}
                        </button>
                        <input
                          placeholder={`Option ${opt}`}
                          value={(q as Record<string,unknown>)[`option_${opt.toLowerCase()}`] as string}
                          onChange={e => updateQ(i, `option_${opt.toLowerCase()}` as keyof Question, e.target.value)}
                          className="flex-1 h-11 px-3 text-sm rounded-lg focus:outline-none"
                          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(11,61,145,0.5)')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                        />
                      </div>
                    ))}
                    <textarea
                      placeholder="Explanation (shown after submission, optional)…"
                      value={q.explanation}
                      onChange={e => updateQ(i, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg resize-none focus:outline-none"
                      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(11,61,145,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
