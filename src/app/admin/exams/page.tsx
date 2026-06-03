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

export default function AdminExams() {
  const router = useRouter()
  const [token,    setToken]   = useState<string | null>(null)
  const [batchId,  setBatchId] = useState<string | null>(null)
  const [exams,    setExams]   = useState<Exam[]>([])
  const [loading,  setLoading] = useState(true)
  const [selected, setSelected] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([{ ...EMPTY_Q }])
  const [qLoading, setQLoading] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newExam, setNewExam] = useState({ dayNumber: '', title: '', examDate: '', openTime: '00:30', closeTime: '03:00' })

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  const loadExams = useCallback(async (tok: string) => {
    const res = await fetch('/api/admin/exams', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) {
      const d = await res.json()
      setExams(d.exams)
      setBatchId(d.batchId)
    }
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
    setSelected(exam)
    setQLoading(true)
    const res = await fetch(`/api/admin/exams/${exam.id}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const d = await res.json()
      setQuestions(d.questions.length > 0 ? d.questions : [{ ...EMPTY_Q }])
    }
    setQLoading(false)
  }

  function updateQ(i: number, field: keyof Question, val: string | number) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q))
  }

  function addQuestion() {
    setQuestions(prev => [...prev, { ...EMPTY_Q }])
  }

  function removeQuestion(i: number) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveQuestions() {
    if (!token || !selected) return
    setSaving(true)
    const res = await fetch(`/api/admin/exams/${selected.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        questions: questions.map((q, i) => ({ ...q, sort_order: i })),
        mode: 'replace',
      }),
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

    // Convert IST times to UTC for storage
    const open  = new Date(`${examDate}T${openTime}:00+05:30`)
    const close = new Date(`${examDate}T${closeTime}:00+05:30`)

    const res = await fetch('/api/admin/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        batchId, dayNumber: Number(dayNumber), title, examDate,
        openTime: open.toISOString(), closeTime: close.toISOString(),
      }),
    })
    if (res.ok) {
      showToast('Exam created')
      setShowCreate(false)
      setNewExam({ dayNumber: '', title: '', examDate: '', openTime: '00:30', closeTime: '03:00' })
      loadExams(token)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? 'Failed to create exam')
    }
  }

  return (
    <div className="p-8 max-w-6xl">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Exams</h1>
          <p className="text-sm text-slate-500 mt-0.5">{exams.length} exams in active batch</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#0EA5E9] text-white text-sm font-medium rounded-lg hover:bg-[#0284C7] transition-colors"
        >
          + New Exam
        </button>
      </div>

      {/* Create exam modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Create Exam</h2>
            <div className="space-y-4">
              {[
                { label: 'Day Number (1–25)', field: 'dayNumber', type: 'number', placeholder: '1' },
                { label: 'Title',             field: 'title',     type: 'text',   placeholder: 'Day 1 — General Knowledge' },
                { label: 'Exam Date (IST)',    field: 'examDate',  type: 'date',   placeholder: '' },
                { label: 'Opens at (IST)',     field: 'openTime',  type: 'time',   placeholder: '' },
                { label: 'Closes at (IST)',    field: 'closeTime', type: 'time',   placeholder: '' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={newExam[field as keyof typeof newExam]}
                    onChange={e => setNewExam(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-slate-900"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createExam} className="flex-1 h-9 bg-[#0EA5E9] text-white text-sm font-medium rounded-lg hover:bg-[#0284C7] transition-colors">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 h-9 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Exams table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-5 h-5 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Day</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Questions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Submissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {exams.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No exams. Create one above.</td></tr>
              ) : exams.map(exam => (
                <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-slate-700">D{exam.day_number}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">{exam.title}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${exam.questionCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {exam.questionCount} Qs
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden lg:table-cell">{exam.submissionCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openQuestions(exam)}
                      className="px-3 py-1.5 bg-[#0EA5E9]/10 text-[#0369A1] text-xs font-medium rounded-md hover:bg-[#0EA5E9]/20 transition-colors"
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Day {selected.day_number} — Questions</p>
                <p className="text-xs text-slate-400 mt-0.5">{questions.length} questions</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addQuestion} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors">+ Add</button>
                <button
                  onClick={saveQuestions}
                  disabled={saving}
                  className="px-3 py-1.5 bg-[#0EA5E9] text-white text-xs font-medium rounded-lg hover:bg-[#0284C7] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save All'}
                </button>
                <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {qLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : questions.map((q, i) => (
                <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">Q{i + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <textarea
                      placeholder="Question text…"
                      value={q.question_text}
                      onChange={e => updateQ(i, 'question_text', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white resize-none text-slate-900"
                    />
                    {(['A','B','C','D'] as const).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQ(i, 'correct_answer', opt)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${q.correct_answer === opt ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-slate-500 hover:border-emerald-300'}`}
                        >
                          {opt}
                        </button>
                        <input
                          placeholder={`Option ${opt}`}
                          value={(q as Record<string,unknown>)[`option_${opt.toLowerCase()}`] as string}
                          onChange={e => updateQ(i, `option_${opt.toLowerCase()}` as keyof Question, e.target.value)}
                          className="flex-1 h-8 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] bg-white text-slate-900"
                        />
                      </div>
                    ))}
                    <textarea
                      placeholder="Explanation (shown after submission, optional)…"
                      value={q.explanation}
                      onChange={e => updateQ(i, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] bg-white resize-none text-slate-600 placeholder-slate-400"
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
