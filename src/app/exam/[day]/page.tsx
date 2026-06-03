'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { Badge } from '@/src/components/ui/Badge'
import type { QuestionForClient, ExamSubmitResult, AnswerOption } from '@/src/types/database'

// ── Types ──────────────────────────────────────────────────────────
type ExamData = {
  exam: { id: string; dayNumber: number; title: string; openTime: string; closeTime: string }
  questions: QuestionForClient[]
  alreadySubmitted: boolean
  submission: { id: string; score: number; total_marks: number } | null
  windowStatus: { isOpen: boolean; closesIn: string | null; message: string }
}

type Phase =
  | 'loading' | 'window-closed' | 'already-submitted'
  | 'exam' | 'submitting' | 'results' | 'error'

const OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D']

// ── Countdown hook ─────────────────────────────────────────────────
function useCountdown(closeTime: string | null) {
  const [remaining, setRemaining] = useState<string>('')
  const [urgent, setUrgent]       = useState(false)

  useEffect(() => {
    if (!closeTime) return
    const tick = () => {
      const ms  = new Date(closeTime).getTime() - Date.now()
      if (ms <= 0) { setRemaining('00:00'); setUrgent(true); return }
      const m   = Math.floor(ms / 60_000)
      const s   = Math.floor((ms % 60_000) / 1000)
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      setUrgent(ms < 5 * 60_000)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [closeTime])

  return { remaining, urgent }
}

// ── Page ───────────────────────────────────────────────────────────
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

  const { remaining, urgent } = useCountdown(
    phase === 'exam' && data ? data.exam.closeTime : null,
  )

  const loadExam = useCallback(async (tok: string) => {
    const res = await fetch(`/api/exam/${day}`, { headers: { Authorization: `Bearer ${tok}` } })
    if (res.status === 401) { router.replace('/auth/login'); return }
    if (res.status === 402) { router.replace('/dashboard');  return }
    if (res.status === 403) {
      const b = await res.json(); setPhase('window-closed'); setErrorMsg(b?.windowStatus?.message ?? 'Exam window is not open.'); return
    }
    if (!res.ok) { setPhase('error'); setErrorMsg('Failed to load exam.'); return }
    const d: ExamData = await res.json()
    setData(d)
    setPhase(d.alreadySubmitted ? 'already-submitted' : 'exam')
  }, [day, router])

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setToken(session.access_token)
      loadExam(session.access_token)
    })
  }, [router, loadExam])

  function toggleFlag(id: string) {
    setFlagged(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function scrollTo(idx: number) {
    setActiveQ(idx)
    questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit() {
    if (!data || !token) return
    const unanswered = data.questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      const go = confirm(`${unanswered.length} question${unanswered.length > 1 ? 's' : ''} unanswered. Submit anyway?`)
      if (!go) return
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
    setResult(await res.json())
    setPhase('results')
  }

  // ── Loading / Submitting ───────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-text-secondary">
          {phase === 'submitting' ? 'Submitting your answers…' : 'Loading exam…'}
        </p>
      </div>
    )
  }

  if (phase === 'window-closed' || phase === 'error') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 bg-surface-overlay rounded-2xl flex items-center justify-center mx-auto mb-5">
          {phase === 'window-closed'
            ? <svg className="w-7 h-7 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            : <svg className="w-7 h-7 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          }
        </div>
        <h2 className="text-xl font-semibold text-text mb-2">{phase === 'window-closed' ? 'Exam closed' : 'Something went wrong'}</h2>
        <p className="text-sm text-text-secondary max-w-xs mb-6">{errorMsg}</p>
        <Button onClick={() => router.push('/dashboard')} variant="secondary">Back to dashboard</Button>
      </div>
    )
  }

  if (phase === 'results' && result) {
    return <ResultsScreen result={result} dayNumber={data?.exam.dayNumber ?? 0} />
  }

  if (phase === 'already-submitted' && data?.submission) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <Badge variant="success" className="mb-4">Submitted</Badge>
        <h2 className="text-2xl font-semibold text-text mb-1">Day {data.exam.dayNumber} complete</h2>
        <div className="flex items-baseline gap-1.5 mt-2 mb-6">
          <span className="text-5xl font-semibold text-text font-mono">{data.submission.score}</span>
          <span className="text-xl text-text-secondary">/ {data.submission.total_marks}</span>
        </div>
        <Button onClick={() => router.push('/dashboard')}>Back to dashboard</Button>
      </div>
    )
  }

  if (!data) return null
  const questions = data.questions
  const answered  = Object.keys(answers).length
  const total     = questions.length

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Sticky header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')} className="text-text-secondary hover:text-text p-1 -ml-1 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">{data.exam.title}</p>
              <p className="text-xs text-text-muted">Day {data.exam.dayNumber} · {answered}/{total} answered</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 shrink-0 font-mono text-sm font-medium px-3 py-1.5 rounded-lg border ${urgent ? 'bg-error-subtle border-error/30 text-error' : 'bg-surface-overlay border-border text-text-secondary'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {remaining || data.windowStatus.closesIn || '--:--'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-surface-overlay">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 lg:flex lg:gap-6">

        {/* ── Questions ─────────────────────────────────────────── */}
        <div className="flex-1 space-y-6">
          {questions.map((q, i) => {
            const sel      = answers[q.id] ?? null
            const isFlagged = flagged.has(q.id)
            const optText: Record<AnswerOption, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }

            return (
              <div
                key={q.id}
                ref={el => { questionRefs.current[i] = el }}
                className={`bg-surface rounded-xl border p-5 transition-colors ${activeQ === i ? 'border-primary-border' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-muted bg-surface-overlay px-2 py-0.5 rounded-md">
                      Q{i + 1}
                    </span>
                    {q.marks > 1 && (
                      <span className="text-xs text-text-muted">{q.marks} marks</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    title={isFlagged ? 'Remove flag' : 'Flag for review'}
                    className={`p-1.5 rounded-md transition-colors ${isFlagged ? 'bg-warning-subtle text-warning' : 'text-text-muted hover:text-text hover:bg-surface-overlay'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-text leading-relaxed mb-4">{q.question_text}</p>

                <div className="space-y-2">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setAnswers(p => ({ ...p, [q.id]: opt })); setActiveQ(i) }}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all text-sm',
                        sel === opt
                          ? 'border-primary bg-primary-subtle text-primary font-medium'
                          : 'border-border bg-surface text-text hover:border-border-strong hover:bg-surface-overlay',
                      ].join(' ')}
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 ${sel === opt ? 'border-primary bg-primary text-white' : 'border-border-strong text-text-muted'}`}>
                        {opt}
                      </span>
                      {optText[opt]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Submit */}
          <div className="pb-6">
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-text">Ready to submit?</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {total - answered > 0 ? `${total - answered} question${total - answered > 1 ? 's' : ''} unanswered` : 'All questions answered'}
                  </p>
                </div>
                {flagged.size > 0 && (
                  <Badge variant="warning">{flagged.size} flagged</Badge>
                )}
              </div>
              <Button onClick={handleSubmit} fullWidth size="lg">
                Submit exam
              </Button>
              <p className="text-xs text-text-muted text-center mt-2">
                Submissions cannot be changed after this point.
              </p>
            </div>
          </div>
        </div>

        {/* ── Desktop question navigator ─────────────────────────── */}
        <aside className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-20 bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">Navigator</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id]
                const isFlagged  = flagged.has(q.id)
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollTo(i)}
                    title={`Q${i + 1}`}
                    className={[
                      'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                      isFlagged  ? 'bg-warning-subtle text-warning border border-warning/30' :
                      isAnswered ? 'bg-primary text-white' :
                                   'bg-surface-overlay text-text-muted hover:bg-border',
                      activeQ === i ? 'ring-2 ring-primary ring-offset-1' : '',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-1.5">
              {[
                { color: 'bg-primary',          label: 'Answered' },
                { color: 'bg-warning-subtle border border-warning/30', label: 'Flagged' },
                { color: 'bg-surface-overlay',  label: 'Not answered' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-xs text-text-muted">{label}</span>
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
function ResultsScreen({ result, dayNumber }: { result: ExamSubmitResult; dayNumber: number }) {
  const { score, total, percentage, answerKey } = result
  const router = useRouter()

  const tier = percentage >= 80 ? { label: 'Excellent', color: 'success' as const }
             : percentage >= 60 ? { label: 'Good', color: 'primary' as const }
             : percentage >= 40 ? { label: 'Average', color: 'warning' as const }
             : { label: 'Needs work', color: 'error' as const }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <Badge variant={tier.color} className="mb-4">{tier.label}</Badge>
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className="text-6xl font-semibold text-text font-mono">{score}</span>
            <span className="text-2xl text-text-secondary">/ {total}</span>
          </div>
          <p className="text-text-secondary text-sm mt-1">Day {dayNumber} · {percentage}% accuracy</p>

          {/* Score bar */}
          <div className="max-w-xs mx-auto mt-5">
            <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${percentage}%` }} />
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-5 text-center">
            <div>
              <p className="text-2xl font-semibold text-text">{answerKey.filter(a => a.isCorrect).length}</p>
              <p className="text-xs text-text-muted mt-0.5">Correct</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-semibold text-text">{answerKey.filter(a => !a.isCorrect).length}</p>
              <p className="text-xs text-text-muted mt-0.5">Incorrect</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-2xl font-semibold text-text">{total}</p>
              <p className="text-xs text-text-muted mt-0.5">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Answer key */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">Answer key</p>
        {answerKey.map((item, i) => (
          <div key={item.questionId} className={`bg-surface rounded-xl border p-4 ${item.isCorrect ? 'border-success/20' : 'border-error/20'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Q{i + 1}</span>
              <Badge variant={item.isCorrect ? 'success' : 'error'} dot>
                {item.isCorrect ? 'Correct' : 'Incorrect'}
              </Badge>
            </div>
            {!item.isCorrect && (
              <p className="text-xs text-text-secondary mt-2">
                Your answer: <span className="font-mono font-medium text-error">{item.yourAnswer ?? '—'}</span>
                {' · '}
                Correct: <span className="font-mono font-medium text-success">{item.correct}</span>
              </p>
            )}
            {item.explanation && (
              <p className="text-xs text-text-secondary mt-2.5 pt-2.5 border-t border-border leading-relaxed">
                {item.explanation}
              </p>
            )}
          </div>
        ))}

        <div className="pt-2 pb-8">
          <Button onClick={() => router.push('/dashboard')} variant="secondary" fullWidth>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
