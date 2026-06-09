'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { Badge } from '@/src/components/ui/Badge'
import type { QuestionForClient, ExamSubmitResult, AnswerOption } from '@/src/types/database'

type ExamData = {
  exam: { id: string; dayNumber: number; title: string; openTime: string; closeTime: string }
  questions: QuestionForClient[]
  alreadySubmitted: boolean
  submission: { id: string; score: number; total_marks: number } | null
  windowStatus: { isOpen: boolean; closesIn: string | null; message: string }
}
type Phase = 'loading' | 'window-closed' | 'already-submitted' | 'exam' | 'submitting' | 'results' | 'error'
const OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D']

// score → color mapping (bio-map palette)
function scoreColor(pct: number) {
  if (pct >= 80) return '#6fcf8f'
  if (pct >= 60) return '#5ec8c0'
  if (pct >= 40) return '#e7b14c'
  return '#e8736b'
}

function useCountdown(closeTime: string | null) {
  const [remaining, setRemaining] = useState<string>('')
  const [urgent, setUrgent]       = useState(false)
  useEffect(() => {
    if (!closeTime) return
    const tick = () => {
      const ms = new Date(closeTime).getTime() - Date.now()
      if (ms <= 0) { setRemaining('00:00'); setUrgent(true); return }
      const m = Math.floor(ms / 60_000)
      const s = Math.floor((ms % 60_000) / 1000)
      setRemaining(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
      setUrgent(ms < 5 * 60_000)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [closeTime])
  return { remaining, urgent }
}

export default function ExamPage() {
  const router = useRouter()
  const { day } = useParams() as { day: string }

  const [token, setToken]       = useState<string | null>(null)
  const [phase, setPhase]       = useState<Phase>('loading')
  const [data, setData]         = useState<ExamData | null>(null)
  const [answers, setAnswers]   = useState<Record<string, AnswerOption>>({})
  const [flagged, setFlagged]   = useState<Set<string>>(new Set())
  const [activeQ, setActiveQ]   = useState(0)
  const [result, setResult]     = useState<ExamSubmitResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const questionRefs            = useRef<(HTMLDivElement | null)[]>([])

  const { remaining, urgent } = useCountdown(phase === 'exam' && data ? data.exam.closeTime : null)

  const loadExam = useCallback(async (tok: string) => {
    const res = await fetch(`/api/exam/${day}`, { headers: { Authorization: `Bearer ${tok}` } })
    if (res.status === 401) { router.replace('/auth/login'); return }
    if (res.status === 402) { router.replace('/dashboard');  return }
    if (res.status === 403) {
      const b = await res.json(); setPhase('window-closed'); setErrorMsg(b?.windowStatus?.message ?? 'Exam window is not open.'); return
    }
    if (!res.ok) { setPhase('error'); setErrorMsg('Failed to load exam.'); return }
    const d: ExamData = await res.json()
    setData(d); setPhase(d.alreadySubmitted ? 'already-submitted' : 'exam')
  }, [day, router])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token); loadExam(session.access_token)
    })
  }, [router, loadExam])

  function toggleFlag(id: string) {
    setFlagged(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })
  }
  function scrollTo(idx: number) {
    setActiveQ(idx)
    questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  async function handleSubmit() {
    if (!data || !token) return
    const unanswered = data.questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      if (!confirm(`${unanswered.length} question${unanswered.length > 1 ? 's' : ''} unanswered. Submit anyway?`)) return
    } else {
      if (!confirm('Submit your exam? This cannot be undone.')) return
    }
    setPhase('submitting')
    const res = await fetch('/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ examId: data.exam.id, answers }),
    })
    if (res.status === 409) { loadExam(token); return }
    if (res.status === 403) { setPhase('window-closed'); setErrorMsg('Exam window has closed.'); return }
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      setPhase('error'); setErrorMsg(b?.error ?? 'Submission failed.'); return
    }
    setResult(await res.json()); setPhase('results')
  }

  // ── Loading / Submitting ──────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0e1410' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#6fcf8f', boxShadow: '0 0 12px rgba(111,207,143,0.3)' }} />
        <p className="text-sm text-text-muted">
          {phase === 'submitting' ? 'Submitting your answers…' : 'Loading exam…'}
        </p>
      </div>
    )
  }

  // ── Window Closed / Error ─────────────────────────────────────
  if (phase === 'window-closed' || phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0e1410' }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={phase === 'error'
            ? { background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.20)' }
            : { background: 'rgba(154,168,147,0.06)', border: '1px solid #27342b' }}>
          {phase === 'window-closed'
            ? <svg className="w-7 h-7 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            : <svg className="w-7 h-7 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
        </div>
        <h2 className="text-xl font-bold text-text mb-2" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          {phase === 'window-closed' ? 'Exam closed' : 'Something went wrong'}
        </h2>
        <p className="text-sm text-text-muted max-w-xs mb-6">{errorMsg}</p>
        <Button onClick={() => router.push('/dashboard')} variant="secondary">Back to dashboard</Button>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────
  if (phase === 'results' && result) {
    return <ResultsScreen result={result} dayNumber={data?.exam.dayNumber ?? 0} examId={data?.exam.id ?? ''} />
  }

  // ── Already Submitted ─────────────────────────────────────────
  if (phase === 'already-submitted' && data?.submission) {
    const pct = data.submission.total_marks
      ? Math.round((data.submission.score / data.submission.total_marks) * 100)
      : 0
    const col = scoreColor(pct)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0e1410' }}>
        <Badge variant="success" className="mb-5">Submitted</Badge>
        <h2 className="text-2xl font-bold text-text mb-3" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Day {data.exam.dayNumber} complete
        </h2>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-7xl font-bold font-mono tracking-tight" style={{ color: col }}>{data.submission.score}</span>
          <span className="text-2xl text-text-muted">/ {data.submission.total_marks}</span>
        </div>
        <p className="text-sm font-bold mb-8" style={{ color: col }}>{pct}%</p>
        <Button onClick={() => router.push('/dashboard')}>Back to dashboard</Button>
      </div>
    )
  }

  if (!data) return null
  const questions = data.questions
  const answered  = Object.keys(answers).length
  const total     = questions.length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e1410' }}>

      {/* ── STICKY HEADER ───────────────────────────────────────── */}
      <header className="sticky top-0 z-20"
        style={{ background: 'rgba(14,20,16,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #27342b' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')}
              className="p-1.5 -ml-1.5 rounded-lg transition-colors shrink-0"
              style={{ color: '#6b7a63' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8ead8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7a63'; (e.currentTarget as HTMLButtonElement).style.background = '' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text truncate tracking-tight">{data.exam.title}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                Day {data.exam.dayNumber} · {answered}/{total} answered
              </p>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 shrink-0 font-mono text-sm font-bold px-3 py-1.5 rounded-xl border transition-all`}
            aria-live="polite"
            aria-atomic="true"
            style={urgent
              ? { background: 'rgba(232,115,107,0.10)', border: '1px solid rgba(232,115,107,0.30)', color: '#e8736b', boxShadow: '0 0 12px rgba(232,115,107,0.20)' }
              : { background: 'rgba(255,255,255,0.03)', border: '1px solid #27342b', color: '#9aa893' }
            }>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {remaining || data.windowStatus.closesIn || '--:--'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5" style={{ background: 'rgba(111,207,143,0.08)' }}>
          <div className="h-full transition-all duration-300"
            style={{ width: `${(answered / total) * 100}%`, background: 'linear-gradient(90deg,#6fcf8f,#3fae6a)', boxShadow: '0 0 6px rgba(111,207,143,0.5)' }} />
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 lg:flex lg:gap-6">

        {/* ── Questions ─────────────────────────────────────────── */}
        <div className="flex-1 space-y-4">
          {questions.map((q, i) => {
            const sel       = answers[q.id] ?? null
            const isFlagged = flagged.has(q.id)
            const isActive  = activeQ === i
            const optText: Record<AnswerOption, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }

            return (
              <div
                key={q.id}
                ref={el => { questionRefs.current[i] = el }}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: '#16201a',
                  border: `1px solid ${isActive ? 'rgba(111,207,143,0.25)' : '#27342b'}`,
                  boxShadow: isActive ? '0 0 20px rgba(111,207,143,0.06)' : undefined,
                }}
                onClick={() => setActiveQ(i)}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-text-muted px-2 py-1 rounded-lg uppercase tracking-widest font-mono"
                      style={{ background: '#1b271f', border: '1px solid #27342b' }}>
                      Q{i + 1}
                    </span>
                    {q.marks > 1 && <span className="text-[10px] text-text-muted font-semibold font-mono">{q.marks} marks</span>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFlag(q.id) }}
                    title={isFlagged ? 'Remove flag' : 'Flag for review'}
                    className="p-1.5 rounded-lg transition-all"
                    style={isFlagged
                      ? { background: 'rgba(231,177,76,0.12)', color: '#e7b14c', border: '1px solid rgba(231,177,76,0.25)' }
                      : { color: '#3a4a3d' }
                    }>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                      <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                  </button>
                </div>

                <p id={`q-${q.id}`} className="text-sm text-text leading-relaxed mb-4 font-medium">{q.question_text}</p>

                <div className="space-y-2" role="radiogroup" aria-labelledby={`q-${q.id}`}>
                  {OPTIONS.map(opt => {
                    const isSelected = sel === opt
                    return (
                      <button
                        key={opt}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={e => { e.stopPropagation(); setAnswers(p => ({ ...p, [q.id]: opt })); setActiveQ(i) }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-150 text-sm"
                        style={isSelected ? {
                          background: 'rgba(111,207,143,0.10)',
                          border: '1px solid rgba(111,207,143,0.35)',
                          boxShadow: '0 0 12px rgba(111,207,143,0.10)',
                          color: '#6fcf8f',
                        } : {
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid #27342b',
                          color: '#9aa893',
                        }}
                      >
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all font-mono"
                          style={isSelected ? {
                            background: '#3fae6a',
                            color: '#06140c',
                            boxShadow: '0 0 8px rgba(63,174,106,0.5)',
                          } : {
                            background: '#1b271f',
                            border: '1px solid #27342b',
                            color: '#3a4a3d',
                          }}>
                          {opt}
                        </span>
                        <span className={isSelected ? 'text-primary font-medium' : 'text-text-secondary'}>
                          {optText[opt]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ── Submit Section ─────────────────────────────────── */}
          <div className="pb-6">
            <div className="rounded-2xl p-5" style={{ background: '#16201a', border: '1px solid #27342b' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-text">Ready to submit?</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {total - answered > 0
                      ? `${total - answered} question${total - answered > 1 ? 's' : ''} unanswered`
                      : 'All questions answered ✓'}
                  </p>
                </div>
                {flagged.size > 0 && <Badge variant="warning">{flagged.size} flagged</Badge>}
              </div>
              <Button onClick={handleSubmit} fullWidth size="lg">Submit Exam</Button>
              <p className="text-[10px] text-text-muted text-center mt-2.5 tracking-wide">
                Submissions cannot be changed after this point.
              </p>
            </div>
          </div>
        </div>

        {/* ── Desktop Navigator ─────────────────────────────────── */}
        <aside className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-20 rounded-2xl p-4" style={{ background: '#16201a', border: '1px solid #27342b' }}>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-3 font-mono">Navigator</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id]
                const isFlagged  = flagged.has(q.id)
                const isActive   = activeQ === i
                return (
                  <button key={q.id} onClick={() => scrollTo(i)} title={`Q${i + 1}`}
                    className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all duration-150 font-mono"
                    style={isFlagged ? {
                      background: 'rgba(231,177,76,0.12)',
                      border: '1px solid rgba(231,177,76,0.25)',
                      color: '#e7b14c',
                      outline: isActive ? '2px solid rgba(231,177,76,0.5)' : undefined,
                    } : isAnswered ? {
                      background: 'linear-gradient(135deg,#6fcf8f,#3fae6a)',
                      color: '#06140c',
                      boxShadow: isActive ? '0 0 8px rgba(111,207,143,0.5)' : undefined,
                      outline: isActive ? '2px solid rgba(111,207,143,0.5)' : undefined,
                    } : {
                      background: '#1b271f',
                      border: '1px solid #27342b',
                      color: '#3a4a3d',
                      outline: isActive ? '2px solid rgba(154,168,147,0.3)' : undefined,
                    }}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-1.5 pt-3" style={{ borderTop: '1px solid #27342b' }}>
              {[
                { bg: 'linear-gradient(135deg,#6fcf8f,#3fae6a)',  label: 'Answered', text: '#06140c' },
                { bg: 'rgba(231,177,76,0.12)', label: 'Flagged',  text: '#e7b14c',  border: 'rgba(231,177,76,0.25)' },
                { bg: '#1b271f',               label: 'Skipped',  text: '#3a4a3d',  border: '#27342b' },
              ].map(({ bg, label, border }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md shrink-0"
                    style={{ background: bg, border: border ? `1px solid ${border}` : undefined }} />
                  <span className="text-[10px] text-text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Results Screen ─────────────────────────────────────────────────
function ResultsScreen({ result, dayNumber, examId }: { result: ExamSubmitResult; dayNumber: number; examId: string }) {
  const { score, total, percentage, answerKey } = result
  const router = useRouter()

  const col   = percentage >= 80 ? '#6fcf8f' : percentage >= 60 ? '#5ec8c0' : percentage >= 40 ? '#e7b14c' : '#e8736b'
  const label = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Average' : 'Keep going'

  return (
    <div className="min-h-screen" style={{ background: '#0e1410' }}>
      {/* Score header */}
      <div className="py-12 px-4 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-5 font-mono"
          style={{ background: `${col}18`, border: `1px solid ${col}35`, color: col }}>
          {label}
        </span>

        <div className="flex items-baseline justify-center gap-3 mb-2">
          <span className="text-8xl font-bold font-mono tracking-tight" style={{ color: col }}>{score}</span>
          <span className="text-3xl text-text-muted">/ {total}</span>
        </div>
        <p className="text-sm text-text-muted">Day {dayNumber} · {percentage}% accuracy</p>

        <div className="max-w-xs mx-auto mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, background: col, boxShadow: `0 0 8px ${col}60` }} />
        </div>

        {/* Mentor Report CTA */}
        {examId && (
          <div className="mt-6">
            <button
              onClick={() => router.push(`/mentor/${examId}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(111,207,143,0.08)',
                border: '1px solid rgba(111,207,143,0.25)',
                color: '#6fcf8f',
                boxShadow: '0 0 16px rgba(111,207,143,0.08)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(111,207,143,0.14)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(111,207,143,0.08)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              View Mentor Report
            </button>
            <p className="text-[10px] text-text-muted mt-1.5 font-mono" style={{ opacity: 0.5 }}>
              AI-generated coaching report · ready in ~3 s
            </p>
          </div>
        )}

        <div className="flex justify-center gap-8 mt-6">
          {[
            { label: 'Correct',   value: answerKey.filter(a => a.isCorrect).length },
            { label: 'Incorrect', value: answerKey.filter(a => !a.isCorrect).length },
            { label: 'Total',     value: total },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-text font-mono">{value}</p>
              <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-mono">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Answer key */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 font-mono">Answer Key</p>
        <div className="space-y-2.5">
          {answerKey.map((item, i) => (
            <div key={item.questionId} className="rounded-2xl p-4 transition-all"
              style={{
                background: '#16201a',
                border: `1px solid ${item.isCorrect ? 'rgba(111,207,143,0.15)' : 'rgba(232,115,107,0.15)'}`,
              }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Q{i + 1}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md font-mono"
                  style={item.isCorrect
                    ? { background: 'rgba(111,207,143,0.10)', color: '#6fcf8f', border: '1px solid rgba(111,207,143,0.20)' }
                    : { background: 'rgba(232,115,107,0.10)', color: '#e8736b', border: '1px solid rgba(232,115,107,0.20)' }
                  }>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              {!item.isCorrect && (
                <p className="text-xs text-text-muted mt-2 font-mono">
                  Your answer:{' '}
                  <span className="font-bold text-error">{item.yourAnswer ?? '—'}</span>
                  {' · '}
                  Correct:{' '}
                  <span className="font-bold text-success">{item.correct}</span>
                </p>
              )}
              {item.explanation && (
                <p className="text-xs text-text-muted mt-2.5 pt-2.5 leading-relaxed"
                  style={{ borderTop: '1px solid #27342b' }}>
                  {item.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="pt-6">
          <Button onClick={() => router.push('/dashboard')} variant="secondary" fullWidth>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
