'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'
import { Badge } from '@/src/components/ui/Badge'
import type { QuestionForClient, ExamSubmitResult, AnswerOption } from '@/src/types/database'

type ExamData = {
  exam: { id: string; dayNumber: number; title: string; openTime: string; closeTime: string; linkUrl: string | null }
  questions: QuestionForClient[]
  alreadySubmitted: boolean
  submission: { id: string; score: number; total_marks: number } | null
  windowStatus: { isOpen: boolean; closesIn: string | null; message: string }
}
type Phase = 'loading' | 'window-closed' | 'already-submitted' | 'exam' | 'submitting' | 'results' | 'error'
const OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D']

// score → color mapping (cm palette · no red near test results)
function scoreColor(pct: number) {
  if (pct >= 80) return '#22C55E'   // cm-success
  if (pct >= 60) return '#2563EB'   // cm-info
  if (pct >= 40) return '#FBBF24'   // cm-warning
  return '#9CA3AF'                   // neutral (avoids anxiety-inducing red)
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

  const [token, setToken]           = useState<string | null>(null)
  const [phase, setPhase]           = useState<Phase>('loading')
  const [data, setData]             = useState<ExamData | null>(null)
  const [answers, setAnswers]       = useState<Record<string, AnswerOption>>({})
  const [flagged, setFlagged]       = useState<Set<string>>(new Set())
  const [activeQ, setActiveQ]       = useState(0)
  const [result, setResult]         = useState<ExamSubmitResult | null>(null)
  const [errorMsg, setErrorMsg]     = useState('')
  const [closedLinkUrl, setClosedLinkUrl] = useState<string | null>(null)
  const questionRefs                = useRef<(HTMLDivElement | null)[]>([])

  const { remaining, urgent } = useCountdown(phase === 'exam' && data ? data.exam.closeTime : null)

  const loadExam = useCallback(async (tok: string) => {
    const res = await fetch(`/api/exam/${day}`, { headers: { Authorization: `Bearer ${tok}` } })
    if (res.status === 401) { router.replace('/auth/login'); return }
    if (res.status === 402) { router.replace('/dashboard');  return }
    if (res.status === 403) {
      const b = await res.json()
      setPhase('window-closed')
      setErrorMsg(b?.windowStatus?.message ?? 'Exam window is not open.')
      if (b?.linkUrl) setClosedLinkUrl(b.linkUrl)
      return
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0B1020' }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#2533FF', borderRightColor: 'rgba(37,51,255,0.25)', borderBottomColor: 'rgba(37,51,255,0.25)', borderLeftColor: 'rgba(37,51,255,0.25)' }} />
        <p className="text-sm" style={{ color: 'var(--color-cm-neutral-300)' }}>
          {phase === 'submitting' ? 'Submitting your answers…' : 'Loading exam…'}
        </p>
      </div>
    )
  }

  // ── Window Closed / Error ─────────────────────────────────────
  if (phase === 'window-closed' || phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0B1020' }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={phase === 'error'
            ? { background: 'rgba(227,65,58,0.12)', border: '1px solid rgba(227,65,58,0.25)' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
          {phase === 'window-closed'
            ? <svg style={{ color: 'var(--color-cm-neutral-300)' }} className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            : <svg style={{ color: '#E3413A' }} className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
        </div>
        <h2 className="font-bebas text-[32px] leading-none tracking-wide mb-3" style={{ color: '#F9FAFB' }}>
          {phase === 'window-closed' ? 'Exam closed' : 'Something went wrong'}
        </h2>
        <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--color-cm-neutral-300)' }}>{errorMsg}</p>
        <AiDailyTestBanner />
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0B1020' }}>
        <Badge variant="success" className="mb-5">Submitted</Badge>
        <h2 className="font-bebas text-[40px] leading-none tracking-wide mb-3" style={{ color: '#F9FAFB' }}>
          Day {data.exam.dayNumber} complete
        </h2>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-7xl font-bold font-mono tracking-tight" style={{ color: col }}>{data.submission.score}</span>
          <span className="text-2xl text-text-muted">/ {data.submission.total_marks}</span>
        </div>
        <p className="text-sm font-bold mb-8" style={{ color: col }}>{pct}%</p>
        <AiDailyTestBanner />
        <Button onClick={() => router.push('/dashboard')}>Back to dashboard</Button>
      </div>
    )
  }

  if (!data) return null
  const questions = data.questions
  const answered  = Object.keys(answers).length
  const total     = questions.length

  return (
    /* Dark shell — Carbon Black background */
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1020' }}>

      {/* ── STICKY HEADER ───────────────────────────────────────── */}
      <header className="sticky top-0 z-20"
        style={{ background: 'rgba(11,16,32,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')}
              className="p-1.5 -ml-1.5 rounded-lg transition-colors shrink-0"
              style={{ color: 'var(--color-cm-neutral-300)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-cm-neutral-300)'; (e.currentTarget as HTMLButtonElement).style.background = '' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="min-w-0">
              {/* Bebas Neue for exam title */}
              <p className="font-bebas text-[18px] leading-tight tracking-wide truncate" style={{ color: '#F9FAFB' }}>{data.exam.title}</p>
              <p className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--color-cm-neutral-300)' }}>
                Day {data.exam.dayNumber} · {answered}/{total} answered
              </p>
            </div>
          </div>

          {/* Timer — Info Blue → Warning Amber → stays neutral (no pulsing red bg) */}
          <div
            className="flex items-center gap-2 shrink-0 font-mono text-sm font-bold px-3 py-1.5 rounded-xl border transition-all"
            aria-live="polite"
            aria-atomic="true"
            style={urgent
              ? { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', color: '#FBBF24' }
              : { background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.25)', color: '#2563EB' }
            }>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {remaining || data.windowStatus.closesIn || '--:--'}
          </div>
        </div>

        {/* Progress bar — Centumania Indigo */}
        <div className="h-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full transition-all duration-300"
            style={{ width: `${(answered / total) * 100}%`, background: 'linear-gradient(90deg,#2533FF,#0EA5A0)' }} />
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
              /* Light question panel inside dark shell — maximises legibility for long-form reading */
              <div
                key={q.id}
                ref={el => { questionRefs.current[i] = el }}
                className="card-question rounded-2xl p-5 transition-all duration-200"
                style={isActive ? { outline: '2px solid rgba(37,51,255,0.35)', outlineOffset: '2px' } : undefined}
                onClick={() => setActiveQ(i)}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest font-mono"
                      style={{ background: '#F5F7FA', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                      Q{i + 1}
                    </span>
                    {q.marks > 1 && <span className="text-[10px] font-semibold font-mono" style={{ color: '#6B7280' }}>{q.marks} marks</span>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleFlag(q.id) }}
                    title={isFlagged ? 'Remove flag' : 'Flag for review'}
                    className="p-1.5 rounded-lg transition-all"
                    style={isFlagged
                      ? { background: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.30)' }
                      : { color: '#9CA3AF' }
                    }>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                      <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                  </button>
                </div>

                {/* Question text — dark on light for max legibility; Tamil-safe line-height */}
                <p id={`q-${q.id}`} className="text-sm leading-[1.75] mb-4 font-medium" style={{ color: '#111827' }}>{q.question_text}</p>

                <div className="space-y-2" role="radiogroup" aria-labelledby={`q-${q.id}`}>
                  {OPTIONS.map(opt => {
                    const isSelected = sel === opt
                    return (
                      <button
                        key={opt}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={e => { e.stopPropagation(); setAnswers(p => ({ ...p, [q.id]: opt })); setActiveQ(i) }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-150 text-sm active:scale-[0.99]"
                        style={isSelected ? {
                          background: 'rgba(37,51,255,0.08)',
                          border: '1px solid rgba(37,51,255,0.35)',
                          color: '#1925c0',
                        } : {
                          background: '#FAFAFA',
                          border: '1px solid #E5E7EB',
                          color: '#4B5563',
                        }}
                      >
                        {/* Option badge — cm-success when selected */}
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all font-mono"
                          style={isSelected ? {
                            background: '#22C55E',
                            color: '#FFFFFF',
                          } : {
                            background: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            color: '#6B7280',
                          }}>
                          {opt}
                        </span>
                        <span style={{ color: isSelected ? '#111827' : '#4B5563', fontWeight: isSelected ? 500 : 400 }}>
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
            <div className="rounded-2xl p-5" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Ready to submit?</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-cm-neutral-300)' }}>
                    {total - answered > 0
                      ? `${total - answered} question${total - answered > 1 ? 's' : ''} unanswered`
                      : 'All questions answered ✓'}
                  </p>
                </div>
                {flagged.size > 0 && <Badge variant="warning">{flagged.size} flagged</Badge>}
              </div>
              <Button onClick={handleSubmit} fullWidth size="lg">Submit Exam</Button>
              <p className="text-[10px] text-center mt-2.5 tracking-wide" style={{ color: 'var(--color-cm-neutral-500)' }}>
                Submissions cannot be changed after this point.
              </p>
            </div>
          </div>
        </div>

        {/* ── Desktop Navigator ─────────────────────────────────── */}
        <aside className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-20 rounded-2xl p-4" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--color-cm-neutral-300)' }}>Navigator</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id]
                const isFlagged  = flagged.has(q.id)
                const isActive   = activeQ === i
                return (
                  <button key={q.id} onClick={() => scrollTo(i)} title={`Q${i + 1}`}
                    className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all duration-150 font-mono"
                    style={isFlagged ? {
                      background: 'rgba(251,191,36,0.12)',
                      border: '1px solid rgba(251,191,36,0.30)',
                      color: '#FBBF24',
                      outline: isActive ? '2px solid rgba(251,191,36,0.45)' : undefined,
                    } : isAnswered ? {
                      background: 'linear-gradient(135deg,#2533FF,#0EA5A0)',
                      color: '#FFFFFF',
                      outline: isActive ? '2px solid rgba(37,51,255,0.50)' : undefined,
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'var(--color-cm-neutral-300)',
                      outline: isActive ? '2px solid rgba(255,255,255,0.20)' : undefined,
                    }}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-1.5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { bg: 'linear-gradient(135deg,#2533FF,#0EA5A0)', label: 'Answered' },
                { bg: 'rgba(251,191,36,0.12)',                   label: 'Flagged',  border: 'rgba(251,191,36,0.30)' },
                { bg: 'rgba(255,255,255,0.05)',                  label: 'Skipped',  border: 'rgba(255,255,255,0.10)' },
              ].map(({ bg, label, border }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-md shrink-0"
                    style={{ background: bg, border: border ? `1px solid ${border}` : undefined }} />
                  <span className="text-[10px]" style={{ color: 'var(--color-cm-neutral-300)' }}>{label}</span>
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

  // No red for scores — avoid post-test anxiety spiral
  const col   = percentage >= 80 ? '#22C55E' : percentage >= 60 ? '#2563EB' : percentage >= 40 ? '#FBBF24' : '#9CA3AF'
  const label = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Solid attempt' : 'Keep going'

  return (
    <div className="min-h-screen" style={{ background: '#0B1020' }}>
      {/* Score header */}
      <div className="py-12 px-4 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-5 font-mono"
          style={{ background: `${col}18`, border: `1px solid ${col}35`, color: col }}>
          {label}
        </span>

        {/* Bebas Neue score display */}
        <div className="flex items-baseline justify-center gap-3 mb-2">
          <span className="font-bebas text-[96px] leading-none tracking-wide" style={{ color: col }}>{score}</span>
          <span className="text-3xl" style={{ color: 'var(--color-cm-neutral-300)' }}>/ {total}</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-cm-neutral-300)' }}>Day {dayNumber} · {percentage}% accuracy</p>

        <div className="max-w-xs mx-auto mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, background: col }} />
        </div>

        {/* Mentor Report CTA */}
        {examId && (
          <div className="mt-6">
            <button
              onClick={() => router.push(`/mentor/${examId}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(14,165,160,0.10)',
                border: '1px solid rgba(14,165,160,0.28)',
                color: '#0EA5A0',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,165,160,0.18)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,165,160,0.10)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              View Mentor Report
            </button>
            <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--color-cm-neutral-500)', opacity: 0.7 }}>
              AI-generated coaching report · ready in ~3 s
            </p>
          </div>
        )}

        <div className="flex justify-center gap-8 mt-6">
          {[
            { label: 'Correct',   value: answerKey.filter(a => a.isCorrect).length, col: '#22C55E' },
            { label: 'Skipped',   value: answerKey.filter(a => !a.isCorrect).length, col: '#9CA3AF' },
            { label: 'Total',     value: total,                                      col: '#F9FAFB' },
          ].map(({ label, value, col: c }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold font-mono" style={{ color: c }}>{value}</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-wider font-mono" style={{ color: 'var(--color-cm-neutral-300)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Answer key — light panels inside dark page */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4 font-mono" style={{ color: 'var(--color-cm-neutral-300)' }}>Answer Key</p>
        <div className="space-y-2.5">
          {answerKey.map((item, i) => (
            <div key={item.questionId} className="card-question rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: '#6B7280' }}>Q{i + 1}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md font-mono"
                  style={item.isCorrect
                    ? { background: 'rgba(34,197,94,0.10)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }
                    : { background: 'rgba(156,163,175,0.10)', color: '#6B7280', border: '1px solid rgba(156,163,175,0.20)' }
                  }>
                  {item.isCorrect ? 'Correct' : 'Review'}
                </span>
              </div>
              {!item.isCorrect && (
                <p className="text-xs mt-2 font-mono" style={{ color: '#6B7280' }}>
                  Your answer:{' '}
                  <span className="font-bold" style={{ color: '#6B7280' }}>{item.yourAnswer ?? '—'}</span>
                  {' · '}
                  Correct:{' '}
                  <span className="font-bold" style={{ color: '#22C55E' }}>{item.correct}</span>
                </p>
              )}
              {item.explanation && (
                <p className="text-xs mt-2.5 pt-2.5 leading-relaxed" style={{ color: '#4B5563', borderTop: '1px solid #E5E7EB' }}>
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

// ── AI Daily Test banner — shown after exam submitted or when window is closed ──

function AiDailyTestBanner() {
  return (
    <a
      href="/study/daily-test"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        padding: '14px 16px', borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(37,51,255,0.12), rgba(14,165,160,0.07))',
        border: '1px solid rgba(37,51,255,0.25)', textDecoration: 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'rgba(37,51,255,0.15)', border: '1px solid rgba(37,51,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>🤖</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AI Daily Test</span>
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
            background: 'rgba(37,51,255,0.2)', color: '#818CF8',
            border: '1px solid rgba(37,51,255,0.35)',
          }}>PERSONALISED</span>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.4, margin: 0 }}>
          Practice with questions from today&apos;s exam tailored to your weak topics
        </p>
      </div>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </a>
  )
}
