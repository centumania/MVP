'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import type { DailyTestQuestion } from '@/src/app/api/study/daily-test/questions/route'

export const dynamic = 'force-dynamic'

type Phase = 'loading' | 'no-assignment' | 'already-done' | 'ready' | 'taking' | 'submitted' | 'error'

interface GradeBreakdown {
  questionId:  string
  type:        'formal' | 'html'
  selected:    string
  correct:     string
  isCorrect:   boolean
  explanation: string | null
  marks:       number
  topic:       string
}

interface GradeResult {
  score:      number
  totalMarks: number
  percentage: number
  breakdown:  GradeBreakdown[]
}

const TOPIC_COLORS: Record<string, string> = {
  'History':               '#E67E22',
  'Geography':             '#3DD68C',
  'Science & Technology':  '#4F8EF7',
  'Arithmetic':            '#F6B300',
  'Polity & Constitution': '#A855F7',
  'Economy':               '#10B981',
  'Environment & Ecology': '#22C55E',
  'Current Affairs':       '#EF4444',
  'Reasoning & Aptitude':  '#6366F1',
  'General Studies':       '#9CA3AF',
}

function topicColor(t: string) { return TOPIC_COLORS[t] ?? '#9CA3AF' }

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 54, c = 2 * Math.PI * r
  const color = pct >= 80 ? '#22C55E' : pct >= 60 ? '#2533FF' : pct >= 40 ? '#F6B300' : '#9CA3AF'
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="70" y="66" textAnchor="middle" fill={color} fontSize="28" fontWeight="700"
        fontFamily="'Bebas Neue', sans-serif" letterSpacing="1">{pct}%</text>
      <text x="70" y="84" textAnchor="middle" fill="#9CA3AF" fontSize="11"
        fontFamily="Inter, sans-serif">score</text>
    </svg>
  )
}

export default function DailyTestPage() {
  const router = useRouter()
  const [phase, setPhase]             = useState<Phase>('loading')
  const [questions, setQuestions]     = useState<DailyTestQuestion[]>([])
  const [testDate, setTestDate]       = useState('')
  const [dailyTestId, setDailyTestId] = useState<string | null>(null)
  const [answers, setAnswers]         = useState<Record<string, string>>({})
  const [htmlAnswers, setHtmlAnswers] = useState<Record<string, number>>({})
  const [current, setCurrent]         = useState(0)
  const [result, setResult]           = useState<GradeResult | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [errorMsg, setErrorMsg]       = useState('')
  const [timeLeft, setTimeLeft]       = useState(0)
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenRef  = useRef<string>('')
  const submitRef = useRef<() => void>(() => {})

  useEffect(() => {
    const sb = getSupabaseBrowserClient()
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      tokenRef.current = session.access_token

      const res  = await fetch('/api/study/daily-test/questions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()

      if (!res.ok) { setErrorMsg(data.error ?? 'Failed to load'); setPhase('error'); return }
      if (data.noAssignment)    { setPhase('no-assignment'); return }
      if (data.alreadySubmitted){ setPhase('already-done'); return }

      setQuestions(data.questions ?? [])
      setTestDate(data.testDate ?? '')
      setDailyTestId(data.dailyTestId ?? null)
      setTimeLeft((data.questions?.length ?? 30) * 60) // 1 min per question
      setPhase('ready')
    })
  }, [router])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    clearInterval(timerRef.current!)
    setSubmitting(true)

    const formalAns: Record<string, string> = {}
    for (const q of questions.filter(q => q.type === 'formal')) {
      if (answers[q.id]) formalAns[q.id] = answers[q.id]
    }
    const htmlAns: Record<string, number> = {}
    for (const q of questions.filter(q => q.type === 'html')) {
      if (htmlAnswers[q.id] !== undefined) htmlAns[q.id] = htmlAnswers[q.id]
    }

    const res = await fetch('/api/study/daily-test/grade', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ dailyTestId, answers: formalAns, htmlAnswers: htmlAns }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setErrorMsg(data.error ?? 'Submission failed'); return }
    setResult(data)
    setPhase('submitted')
  }, [submitting, questions, answers, htmlAnswers, dailyTestId])

  // keep submitRef current so the timer callback always calls the latest version
  useEffect(() => { submitRef.current = handleSubmit }, [handleSubmit])

  useEffect(() => {
    if (phase !== 'taking') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); submitRef.current(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  const setAnswer = useCallback((q: DailyTestQuestion, val: string | number) => {
    if (q.type === 'formal') setAnswers(p => ({ ...p, [q.id]: String(val) }))
    else setHtmlAnswers(p => ({ ...p, [q.id]: Number(val) }))
  }, [])

  const getAnswer = (q: DailyTestQuestion) => {
    if (q.type === 'formal') return answers[q.id] ?? null
    return htmlAnswers[q.id] !== undefined ? htmlAnswers[q.id] : null
  }

  const answeredCount = questions.filter(q =>
    q.type === 'formal' ? answers[q.id] !== undefined : htmlAnswers[q.id] !== undefined
  ).length

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <AppLayout>
        <style>{`@keyframes cm-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(37,51,255,0.25)', borderTopColor: '#2533FF', animation: 'cm-spin 0.8s linear infinite' }} />
          <p style={{ color: '#6B7280', fontSize: 14 }}>Loading your personalised test…</p>
        </div>
      </AppLayout>
    )
  }

  // ── No assignment ──────────────────────────────────────────────────────────
  if (phase === 'no-assignment') {
    return (
      <AppLayout>
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(246,179,0,0.08), rgba(37,51,255,0.06))', border: '1px solid rgba(246,179,0,0.2)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 26, letterSpacing: 1.5, color: '#F6B300', marginBottom: 10 }}>Test Not Ready Yet</div>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your AI-personalised test for <strong style={{ color: '#fff' }}>{testDate || 'today'}</strong> is prepared nightly at <strong style={{ color: '#fff' }}>11:30 PM IST</strong>, drawing from your weak topics in yesterday's materials.
            </p>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', borderRadius: 10, background: '#2533FF', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Already done ───────────────────────────────────────────────────────────
  if (phase === 'already-done') {
    return (
      <AppLayout>
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(37,51,255,0.06))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 26, letterSpacing: 1.5, color: '#22C55E', marginBottom: 10 }}>Already Completed!</div>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>You've already taken today's test. Come back tomorrow for a fresh one.</p>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', borderRadius: 10, background: '#2533FF', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <AppLayout>
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', marginBottom: 20 }}>{errorMsg || 'Something went wrong.'}</p>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', borderRadius: 10, background: '#2533FF', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </AppLayout>
    )
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'submitted' && result) {
    return <ResultsView result={result} questions={questions} date={testDate} onHome={() => router.push('/dashboard')} />
  }

  // ── Ready (start screen) ───────────────────────────────────────────────────
  if (phase === 'ready') {
    const trapCount   = questions.filter(q => q.type === 'html').length
    const formalCount = questions.filter(q => q.type === 'formal').length
    const topics      = [...new Set(questions.map(q => q.topic))].slice(0, 5)
    return (
      <AppLayout>
        <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 20, background: 'rgba(37,51,255,0.15)', border: '1px solid rgba(37,51,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#818CF8' }}>
              🧠 AI DAILY TEST · {testDate}
            </span>
          </div>

          <div style={{ background: 'linear-gradient(145deg, rgba(37,51,255,0.1) 0%, rgba(14,165,160,0.07) 100%)', border: '1px solid rgba(37,51,255,0.2)', borderRadius: 24, padding: '36px 28px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 36, color: '#fff', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 8 }}>
              Your Personalised<br />Revision Test
            </div>
            <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              AI-selected questions targeting your weak areas from yesterday's study material.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Questions', value: questions.length, icon: '📝' },
                { label: 'Trap MCQs', value: trapCount,        icon: '⚠️' },
                { label: 'From Exam', value: formalCount,      icon: '📋' },
                { label: 'Minutes',   value: questions.length, icon: '⏱' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 6px' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 22, color: '#fff', letterSpacing: 0.5 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {topics.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
                {topics.map(t => (
                  <span key={t} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: topicColor(t) + '18', color: topicColor(t), border: `1px solid ${topicColor(t)}30` }}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => questions.length > 0 && setPhase('taking')}
              disabled={questions.length === 0}
              style={{ width: '100%', padding: '16px', borderRadius: 12, background: questions.length === 0 ? '#374151' : 'linear-gradient(135deg, #2533FF, #4F46E5)', color: questions.length === 0 ? '#6B7280' : '#fff', border: 'none', fontFamily: 'var(--font-bebas)', fontSize: 20, letterSpacing: 2, cursor: questions.length === 0 ? 'not-allowed' : 'pointer', boxShadow: questions.length === 0 ? 'none' : '0 4px 24px rgba(37,51,255,0.35)' }}
            >
              {questions.length === 0 ? 'NO QUESTIONS AVAILABLE' : 'START TEST →'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#4B5563' }}>1 minute per question · Auto-submits when time expires</p>
        </div>
      </AppLayout>
    )
  }

  // ── Taking ─────────────────────────────────────────────────────────────────
  if (phase === 'taking' && questions.length === 0) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ color: '#9CA3AF', marginBottom: 20 }}>No questions available for today. Please check back later.</p>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', borderRadius: 10, background: '#2533FF', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </AppLayout>
    )
  }

  const q          = questions[current]
  const isTimeLow  = timeLeft <= 60
  const isTimeCrit = timeLeft <= 20
  const pctDone    = ((current + 1) / questions.length) * 100

  return (
    <AppLayout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 11, letterSpacing: 2.5, color: '#4B5563' }}>AI DAILY TEST · {testDate}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{answeredCount}/{questions.length} answered</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12,
            background: isTimeCrit ? 'rgba(227,65,58,0.15)' : isTimeLow ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isTimeCrit ? 'rgba(227,65,58,0.4)' : isTimeLow ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={isTimeCrit ? '#E3413A' : isTimeLow ? '#FBBF24' : '#9CA3AF'}
              strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-bebas)', fontSize: 22, letterSpacing: 1, color: isTimeCrit ? '#E3413A' : isTimeLow ? '#FBBF24' : '#F9FAFB' }}>
              {fmt(timeLeft)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctDone}%`, background: 'linear-gradient(90deg, #2533FF, #818CF8)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        {/* Question card */}
        <div style={{ background: '#FAFAFA', borderRadius: 18, padding: '24px 20px', marginBottom: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, background: topicColor(q.topic) + '18', color: topicColor(q.topic), border: `1px solid ${topicColor(q.topic)}30` }}>
              {q.topic}
            </span>
            {q.type === 'html' && (
              <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                ⚠ TRAP
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
              Q{current + 1} / {questions.length}
            </span>
          </div>

          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.65, marginBottom: 20 }}>
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, idx) => {
              const letter     = ['A', 'B', 'C', 'D'][idx]
              const isSelected = q.type === 'formal' ? answers[q.id] === letter : htmlAnswers[q.id] === idx
              return (
                <button
                  key={idx}
                  onClick={() => setAnswer(q, q.type === 'formal' ? letter : idx)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '13px 14px', borderRadius: 12, cursor: 'pointer',
                    border: isSelected ? '2px solid #2533FF' : '2px solid transparent',
                    background: isSelected ? '#EEF2FF' : '#F3F4F6', textAlign: 'left',
                    boxShadow: isSelected ? '0 0 0 3px rgba(37,51,255,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-bebas)', fontSize: 14, letterSpacing: 0.5,
                    background: isSelected ? '#2533FF' : '#E5E7EB',
                    color: isSelected ? '#fff' : '#6B7280',
                    transition: 'all 0.15s',
                  }}>{letter}</span>
                  <span style={{ fontSize: 14, color: '#111827', lineHeight: 1.55, paddingTop: 5, fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                </button>
              )
            })}
          </div>

          {errorMsg && (
            <p style={{ marginTop: 12, fontSize: 13, color: '#EF4444', textAlign: 'center' }}>{errorMsg}</p>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            style={{
              padding: '11px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)', color: current === 0 ? '#374151' : '#F9FAFB',
              cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >← Prev</button>

          <div style={{ flex: 1 }} />

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#2533FF', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
            >Next →</button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '11px 28px', borderRadius: 10, border: 'none',
                background: submitting ? '#374151' : 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700,
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(34,197,94,0.3)',
              }}
            >
              {submitting ? 'Grading…' : `Submit (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>

        {/* Question grid */}
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {questions.map((q, idx) => {
            const isAns = q.type === 'formal' ? answers[q.id] !== undefined : htmlAnswers[q.id] !== undefined
            const isCur = idx === current
            return (
              <button
                key={q.id}
                onClick={() => setCurrent(idx)}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-bebas)', fontSize: 13, letterSpacing: 0.3,
                  background: isCur ? '#2533FF' : isAns ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                  color:      isCur ? '#fff'    : isAns ? '#22C55E'              : '#6B7280',
                  outline:    isCur ? '2px solid rgba(37,51,255,0.5)' : 'none',
                  outlineOffset: '2px', transition: 'all 0.12s',
                }}
              >{idx + 1}</button>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}

// ── Results View ───────────────────────────────────────────────────────────────

function ResultsView({ result, questions, date, onHome }: {
  result: GradeResult
  questions: DailyTestQuestion[]
  date: string
  onHome: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const qMap    = Object.fromEntries(questions.map(q => [q.id, q]))
  const pct     = result.percentage
  const correct = result.breakdown.filter(b => b.isCorrect).length
  const wrong   = result.breakdown.filter(b => !b.isCorrect).length
  const skipped = questions.length - result.breakdown.length

  const topicStats = result.breakdown.reduce<Record<string, { correct: number; total: number }>>((acc, b) => {
    const t = b.topic ?? 'General'
    if (!acc[t]) acc[t] = { correct: 0, total: 0 }
    acc[t].total++
    if (b.isCorrect) acc[t].correct++
    return acc
  }, {})

  return (
    <AppLayout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Score hero */}
        <div style={{ background: 'linear-gradient(145deg, rgba(37,51,255,0.12), rgba(14,165,160,0.08))', border: '1px solid rgba(37,51,255,0.2)', borderRadius: 24, padding: '32px 24px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 11, letterSpacing: 3, color: '#4B5563', marginBottom: 16 }}>
            TEST COMPLETE · {date}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ScoreRing pct={pct} />
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 20 }}>
            {result.score} / {result.totalMarks} marks
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Correct', value: correct, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
              { label: 'Wrong',   value: wrong,   color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
              { label: 'Skipped', value: skipped, color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 28, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6B7280', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic accuracy */}
        {Object.entries(topicStats).length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 13, letterSpacing: 2, color: '#6B7280', marginBottom: 14 }}>TOPIC ACCURACY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(topicStats).map(([topic, s]) => {
                const acc = Math.round((s.correct / s.total) * 100)
                const col = topicColor(topic)
                return (
                  <div key={topic}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 500 }}>{topic}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: acc >= 70 ? '#22C55E' : acc >= 40 ? '#FBBF24' : '#9CA3AF' }}>{acc}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${acc}%`, background: col, borderRadius: 3, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Question review */}
        <div style={{ fontFamily: 'var(--font-bebas)', fontSize: 13, letterSpacing: 2, color: '#6B7280', marginBottom: 12 }}>QUESTION REVIEW</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {result.breakdown.map((b, idx) => {
            const q     = qMap[b.questionId]
            const isExp = expanded.has(b.questionId)
            return (
              <div key={b.questionId} style={{ background: '#FAFAFA', borderRadius: 14, overflow: 'hidden', border: `1px solid ${b.isCorrect ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.25)'}` }}>
                <button
                  onClick={() => setExpanded(s => { const n = new Set(s); n.has(b.questionId) ? n.delete(b.questionId) : n.add(b.questionId); return n })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, background: b.isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)', color: b.isCorrect ? '#16A34A' : '#D97706' }}>
                    {b.isCorrect ? '✓' : '✗'}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>
                    Q{idx + 1}. {q?.question?.slice(0, 75) ?? '—'}{(q?.question?.length ?? 0) > 75 ? '…' : ''}
                  </span>
                  {b.type === 'html' && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', flexShrink: 0 }}>TRAP</span>}
                  <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{isExp ? '▲' : '▼'}</span>
                </button>
                {isExp && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13 }}>
                      <div><span style={{ color: '#9CA3AF' }}>Your answer: </span><span style={{ fontWeight: 700, color: b.isCorrect ? '#16A34A' : '#EF4444' }}>{b.selected || '—'}</span></div>
                      {!b.isCorrect && <div><span style={{ color: '#9CA3AF' }}>Correct: </span><span style={{ fontWeight: 700, color: '#16A34A' }}>{b.correct}</span></div>}
                    </div>
                    {b.explanation && (
                      <p style={{ marginTop: 10, fontSize: 13, color: '#374151', lineHeight: 1.6, padding: '10px 12px', background: '#F3F4F6', borderRadius: 8 }}>
                        {b.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={onHome}
          style={{ width: '100%', padding: '15px', borderRadius: 12, background: 'linear-gradient(135deg, #2533FF, #4F46E5)', color: '#fff', border: 'none', fontFamily: 'var(--font-bebas)', fontSize: 18, letterSpacing: 2, cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,51,255,0.3)' }}
        >
          BACK TO DASHBOARD
        </button>
      </div>
    </AppLayout>
  )
}
