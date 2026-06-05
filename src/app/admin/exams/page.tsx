'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

type Exam = {
  id: string; day_number: number; title: string; exam_date: string
  open_time: string; close_time: string; is_active: boolean
  questionCount: number; submissionCount: number
}

type Question = {
  id?: string; question_text: string; option_a: string; option_b: string
  option_c: string; option_d: string; correct_answer: 'A'|'B'|'C'|'D'
  explanation: string; marks: number
}

const EMPTY_Q: Question = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', explanation: '', marks: 1 }
const CARD = { background: '#16201a', border: '1px solid #27342b' }
const THHD = { background: '#1b271f', borderBottom: '1px solid #27342b' }
const TROW = { borderBottom: '1px solid rgba(39,52,43,0.6)' }

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
  const [newExam, setNewExam] = useState({ dayNumber: '', title: '', examDate: '', openTime: '00:30', closeTime: '03:00' })

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
    const { dayNumber, title, examDate, openTime, closeTime } = newExam
    if (!dayNumber || !title || !examDate) { showToast('Fill all required fields'); return }
    const open  = new Date(`${examDate}T${openTime}:00+05:30`)
    const close = new Date(`${examDate}T${closeTime}:00+05:30`)
    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batchId, dayNumber: Number(dayNumber), title, examDate, openTime: open.toISOString(), closeTime: close.toISOString() }),
    })
    if (res.ok) {
      showToast('Exam created'); setShowCreate(false)
      setNewExam({ dayNumber: '', title: '', examDate: '', openTime: '00:30', closeTime: '03:00' })
      loadExams(token)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to create exam')
    }
  }

  const inputStyle = { background: '#16201a', border: '1px solid #27342b', color: '#e8ead8', height: 36, borderRadius: 8, padding: '0 12px', fontSize: 14, width: '100%' }

  return (
    <div className="p-8 max-w-6xl">

      {toast && (
        <div className="fixed top-4 right-4 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
          style={{ background: '#1b271f', color: '#e8ead8', border: '1px solid #27342b' }}>
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
          style={{ background: '#3fae6a', color: '#06140c' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a8e57')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3fae6a')}
        >
          + New Exam
        </button>
      </div>

      {/* Create exam modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="rounded-xl w-full max-w-md p-6 shadow-2xl" style={{ background: '#16201a', border: '1px solid #27342b' }}>
            <h2 className="text-lg font-semibold text-text mb-5" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>Create Exam</h2>
            <div className="space-y-4">
              {[
                { label: 'Day Number (1–25)', field: 'dayNumber', type: 'number', placeholder: '1' },
                { label: 'Title',             field: 'title',     type: 'text',   placeholder: 'Day 1 — General Knowledge' },
                { label: 'Exam Date (IST)',    field: 'examDate',  type: 'date',   placeholder: '' },
                { label: 'Opens at (IST)',     field: 'openTime',  type: 'time',   placeholder: '' },
                { label: 'Closes at (IST)',    field: 'closeTime', type: 'time',   placeholder: '' },
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
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createExam}
                className="flex-1 h-9 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#3fae6a', color: '#06140c' }}>
                Create
              </button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 h-9 text-sm font-medium rounded-lg font-mono"
                style={{ background: '#1b271f', color: '#9aa893', border: '1px solid #27342b' }}>
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
            style={{ borderColor: 'rgba(111,207,143,0.3)', borderTopColor: '#6fcf8f' }} />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          <table className="w-full text-sm">
            <thead>
              <tr style={THHD}>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Day</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-widest font-mono">Questions</th>
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
                  <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#6fcf8f' }}>D{exam.day_number}</td>
                  <td className="px-4 py-3 text-text font-medium">{exam.title}</td>
                  <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell font-mono">
                    {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-mono"
                      style={exam.questionCount > 0
                        ? { background: 'rgba(111,207,143,0.08)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }
                        : { background: 'rgba(231,177,76,0.08)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.20)' }
                      }>
                      {exam.questionCount} Qs
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono text-xs hidden lg:table-cell">{exam.submissionCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openQuestions(exam)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors font-mono"
                      style={{ background: 'rgba(111,207,143,0.08)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.15)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(111,207,143,0.16)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(111,207,143,0.08)')}
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
            style={{ background: '#141d17', borderLeft: '1px solid #27342b' }}>

            <div className="sticky top-0 px-6 py-4 flex items-center justify-between"
              style={{ background: '#141d17', borderBottom: '1px solid #27342b' }}>
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
                  style={{ background: '#1b271f', color: '#9aa893', border: '1px solid #27342b' }}>
                  + Add
                </button>
                <button
                  onClick={saveQuestions} disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 font-mono"
                  style={{ background: '#3fae6a', color: '#06140c' }}>
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
                    style={{ borderColor: 'rgba(111,207,143,0.3)', borderTopColor: '#6fcf8f' }} />
                </div>
              ) : questions.map((q, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#16201a', border: '1px solid #27342b' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-text-muted px-2 py-0.5 rounded-md font-mono"
                      style={{ background: '#1b271f', border: '1px solid #27342b' }}>
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
                      style={{ background: '#1b271f', border: '1px solid #27342b', color: '#e8ead8' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(111,207,143,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27342b')}
                    />
                    {(['A','B','C','D'] as const).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQ(i, 'correct_answer', opt)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors font-mono"
                          style={q.correct_answer === opt
                            ? { background: '#3fae6a', color: '#06140c', boxShadow: '0 0 8px rgba(63,174,106,0.5)' }
                            : { background: '#1b271f', border: '1px solid #27342b', color: '#6b7a63' }
                          }>
                          {opt}
                        </button>
                        <input
                          placeholder={`Option ${opt}`}
                          value={(q as Record<string,unknown>)[`option_${opt.toLowerCase()}`] as string}
                          onChange={e => updateQ(i, `option_${opt.toLowerCase()}` as keyof Question, e.target.value)}
                          className="flex-1 h-8 px-3 text-sm rounded-lg focus:outline-none"
                          style={{ background: '#1b271f', border: '1px solid #27342b', color: '#e8ead8' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(111,207,143,0.5)')}
                          onBlur={e => (e.currentTarget.style.borderColor = '#27342b')}
                        />
                      </div>
                    ))}
                    <textarea
                      placeholder="Explanation (shown after submission, optional)…"
                      value={q.explanation}
                      onChange={e => updateQ(i, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg resize-none focus:outline-none"
                      style={{ background: '#1b271f', border: '1px solid #27342b', color: '#9aa893' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(111,207,143,0.4)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#27342b')}
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
