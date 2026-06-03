'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import type { QuestionForClient, ExamSubmitResult, AnswerOption } from '@/src/types/database'

// ── Types ──────────────────────────────────────────────────────────

type ExamData = {
  exam: { id: string; dayNumber: number; title: string; openTime: string; closeTime: string }
  questions:        QuestionForClient[]
  alreadySubmitted: boolean
  submission:       { id: string; score: number; total_marks: number } | null
  windowStatus:     { isOpen: boolean; closesIn: string | null; message: string }
}

type PageState =
  | { phase: 'loading' }
  | { phase: 'window-closed'; message: string }
  | { phase: 'exam'; data: ExamData; answers: Record<string, AnswerOption> }
  | { phase: 'submitting' }
  | { phase: 'results'; result: ExamSubmitResult; dayNumber: number }
  | { phase: 'already-submitted'; data: ExamData }
  | { phase: 'error'; message: string }

// ── Page ───────────────────────────────────────────────────────────

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const day    = params.day as string

  const [token, setToken]   = useState<string | null>(null)
  const [state, setState]   = useState<PageState>({ phase: 'loading' })

  // ── Auth + fetch exam ──────────────────────────────────────────
  const loadExam = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`/api/exam/${day}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { router.replace('/dashboard');  return }

      if (res.status === 403) {
        const body = await res.json()
        setState({ phase: 'window-closed', message: body?.windowStatus?.message ?? 'Exam window is not open.' })
        return
      }

      if (!res.ok) {
        setState({ phase: 'error', message: 'Failed to load exam. Please try again.' })
        return
      }

      const data: ExamData = await res.json()

      if (data.alreadySubmitted) {
        setState({ phase: 'already-submitted', data })
        return
      }

      setState({ phase: 'exam', data, answers: {} })
    } catch {
      setState({ phase: 'error', message: 'Network error. Please check your connection.' })
    }
  }, [day, router])

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) { router.replace('/auth/login'); return }
        setToken(session.access_token)
        loadExam(session.access_token)
      })
  }, [router, loadExam])

  // ── Answer selection ───────────────────────────────────────────
  function selectAnswer(questionId: string, answer: AnswerOption) {
    if (state.phase !== 'exam') return
    setState({
      ...state,
      answers: { ...state.answers, [questionId]: answer },
    })
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit() {
    if (state.phase !== 'exam' || !token) return

    const { data, answers } = state
    const unanswered = data.questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      alert(`You have ${unanswered.length} unanswered question${unanswered.length > 1 ? 's' : ''}. Please answer all questions before submitting.`)
      return
    }

    if (!confirm('Submit your exam? You cannot change your answers after submission.')) {
      return
    }

    setState({ phase: 'submitting' })

    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ examId: data.exam.id, answers }),
      })

      if (res.status === 409) {
        // Race condition — reload to show existing submission
        loadExam(token)
        return
      }

      if (res.status === 403) {
        setState({ phase: 'window-closed', message: 'The exam window has closed. Your answers were not submitted.' })
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setState({ phase: 'error', message: body?.error ?? 'Submission failed. Please contact support.' })
        return
      }

      const result: ExamSubmitResult = await res.json()
      setState({ phase: 'results', result, dayNumber: data.exam.dayNumber })
    } catch {
      setState({ phase: 'error', message: 'Network error during submission. Please contact support.' })
    }
  }

  // ── Renders ────────────────────────────────────────────────────

  if (state.phase === 'loading' || state.phase === 'submitting') {
    return (
      <div className="min-h-screen bg-carbon flex flex-col items-center justify-center gap-3">
        <p className="text-muted font-subheading uppercase tracking-widest text-sm animate-pulse">
          {state.phase === 'submitting' ? 'Submitting…' : 'Loading…'}
        </p>
      </div>
    )
  }

  if (state.phase === 'window-closed') {
    return (
      <FullScreenMessage
        icon="🔒"
        title="EXAM CLOSED"
        body={state.phase === 'window-closed' ? (state as { phase: 'window-closed'; message: string }).message : ''}
        action={{ label: 'Back to Dashboard', href: '/dashboard' }}
      />
    )
  }

  if (state.phase === 'error') {
    return (
      <FullScreenMessage
        icon="⚠️"
        title="ERROR"
        body={(state as { phase: 'error'; message: string }).message}
        action={{ label: 'Back to Dashboard', href: '/dashboard' }}
      />
    )
  }

  if (state.phase === 'results') {
    return <ResultsView result={state.result} dayNumber={state.dayNumber} />
  }

  if (state.phase === 'already-submitted') {
    return <AlreadySubmittedView data={state.data} />
  }

  // ── Active exam ────────────────────────────────────────────────
  const { data, answers } = state
  const answeredCount  = Object.keys(answers).length
  const totalQuestions = data.questions.length

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-carbon/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-muted text-xs font-subheading uppercase tracking-wide">
            Day {data.exam.dayNumber}
          </p>
          <p className="text-offwhite font-subheading font-semibold text-sm">
            {data.exam.title}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted text-xs font-subheading uppercase tracking-wide">
            Answered
          </p>
          <p className="text-gold font-headline text-2xl">
            {answeredCount}/{totalQuestions}
          </p>
        </div>
      </header>

      {/* Questions */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-8">
        {data.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            selected={answers[question.id] ?? null}
            onSelect={answer => selectAnswer(question.id, answer)}
          />
        ))}

        {/* Submit */}
        <div className="pt-4 pb-8">
          {answeredCount < totalQuestions && (
            <p className="text-muted text-sm text-center mb-4">
              {totalQuestions - answeredCount} question{totalQuestions - answeredCount > 1 ? 's' : ''} remaining
            </p>
          )}
          <button
            onClick={handleSubmit}
            className="w-full bg-gold text-carbon font-subheading font-bold uppercase tracking-widest py-4 rounded-xl text-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            Submit Exam
          </button>
          <p className="text-muted text-xs text-center mt-3">
            You cannot change answers after submission.
          </p>
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

const OPTIONS: AnswerOption[] = ['A', 'B', 'C', 'D']

function QuestionCard({
  question,
  index,
  selected,
  onSelect,
}: {
  question: QuestionForClient
  index:    number
  selected: AnswerOption | null
  onSelect: (answer: AnswerOption) => void
}) {
  const optionText: Record<AnswerOption, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  }

  return (
    <div>
      <p className="text-muted text-xs font-subheading uppercase tracking-wide mb-2">
        Q{index + 1} {question.marks > 1 ? `· ${question.marks} marks` : ''}
      </p>
      <p className="text-offwhite text-base leading-relaxed mb-4">
        {question.question_text}
      </p>
      <div className="space-y-2">
        {OPTIONS.map(opt => {
          const isSelected = selected === opt
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                isSelected
                  ? 'border-gold bg-gold-muted text-gold'
                  : 'border-border bg-surface text-offwhite hover:border-muted'
              }`}
            >
              <span className={`font-subheading font-bold mr-3 ${isSelected ? 'text-gold' : 'text-muted'}`}>
                {opt}.
              </span>
              {optionText[opt]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ResultsView({ result, dayNumber }: { result: ExamSubmitResult; dayNumber: number }) {
  const { score, total, percentage, answerKey } = result

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Score header */}
      <div className="px-4 py-10 text-center border-b border-border">
        <p className="text-muted font-subheading uppercase tracking-widest text-xs mb-3">
          Day {dayNumber} — Result
        </p>
        <div className="flex items-end justify-center gap-2 mb-1">
          <span className="font-headline text-8xl text-gold">{score}</span>
          <span className="text-muted text-3xl mb-3">/ {total}</span>
        </div>
        <p className="text-muted text-lg">{percentage}% accuracy</p>
        <p className="text-offwhite text-sm mt-3">
          {percentage >= 80
            ? 'Excellent work. Keep it up.'
            : percentage >= 50
            ? 'Good effort. Review the explanations below.'
            : 'Study harder. Review all wrong answers carefully.'}
        </p>
      </div>

      {/* Answer key */}
      <main className="px-4 py-6 max-w-lg mx-auto w-full space-y-4">
        <h2 className="font-subheading uppercase tracking-widest text-muted text-xs mb-4">
          Answer Key
        </h2>
        {answerKey.map((item, i) => (
          <div
            key={item.questionId}
            className={`rounded-xl border p-4 ${
              item.isCorrect ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted text-xs font-subheading uppercase">Q{i + 1}</span>
              <span className={`text-xs font-subheading uppercase tracking-wide ${item.isCorrect ? 'text-success' : 'text-error'}`}>
                {item.isCorrect ? '✓ Correct' : '✗ Wrong'}
              </span>
            </div>
            {!item.isCorrect && (
              <p className="text-sm text-muted mt-1">
                Your answer: <span className="text-error">{item.yourAnswer ?? '—'}</span>
                {' · '}
                Correct: <span className="text-success">{item.correct}</span>
              </p>
            )}
            {item.explanation && (
              <p className="text-muted text-sm mt-2 leading-relaxed border-t border-border/50 pt-2">
                {item.explanation}
              </p>
            )}
          </div>
        ))}

        <div className="pt-4 pb-10">
          <a
            href="/dashboard"
            className="block w-full text-center bg-surface border border-border text-offwhite font-subheading font-semibold uppercase tracking-widest py-4 rounded-xl hover:border-gold transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    </div>
  )
}

function AlreadySubmittedView({ data }: { data: ExamData }) {
  return (
    <div className="min-h-screen bg-carbon flex flex-col items-center justify-center px-4 text-center">
      <p className="text-muted text-xs font-subheading uppercase tracking-widest mb-2">
        Day {data.exam.dayNumber}
      </p>
      <h2 className="font-headline text-4xl text-gold mb-2">SUBMITTED</h2>
      <p className="text-muted text-base mb-2">
        Score: <span className="text-offwhite font-semibold">
          {data.submission?.score} / {data.submission?.total_marks}
        </span>
      </p>
      <a href="/dashboard" className="text-gold text-sm hover:underline mt-6">
        Back to Dashboard
      </a>
    </div>
  )
}

function FullScreenMessage({
  icon, title, body,
  action,
}: {
  icon:   string
  title:  string
  body:   string
  action: { label: string; href: string }
}) {
  return (
    <div className="min-h-screen bg-carbon flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-6">{icon}</div>
      <h2 className="font-headline text-4xl text-gold mb-3">{title}</h2>
      <p className="text-muted text-base max-w-sm leading-relaxed mb-8">{body}</p>
      <a
        href={action.href}
        className="bg-gold text-carbon font-subheading font-bold uppercase tracking-widest px-8 py-3 rounded-xl hover:bg-gold-dark transition-colors"
      >
        {action.label}
      </a>
    </div>
  )
}
