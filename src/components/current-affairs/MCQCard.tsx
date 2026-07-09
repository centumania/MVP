'use client'

import { useState } from 'react'
import type { CAIEMCQ, CAIEAttempt, DifficultyLevel } from '@/src/lib/caie/types'

const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  easy:   '#10B981',
  medium: '#F6B300',
  hard:   '#EF4444',
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const
type Option = typeof OPTIONS[number]

function optionLabel(mcq: CAIEMCQ, opt: Option): string {
  return mcq[`option_${opt.toLowerCase() as 'a' | 'b' | 'c' | 'd'}`]
}

interface MCQCardProps {
  mcq: CAIEMCQ
  index: number
  token: string
  initialAttempt?: CAIEAttempt
}

export function MCQCard({ mcq, index, token, initialAttempt }: MCQCardProps) {
  const [selected, setSelected] = useState<Option | null>(
    (initialAttempt?.chosen_option as Option | undefined) ?? null
  )
  const [submitting, setSubmitting] = useState(false)

  const submitted = selected !== null

  async function handleSelect(opt: Option) {
    if (submitted || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/caie/attempts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcq_id: mcq.id, chosen_option: opt }),
      })
    } catch {
      // best-effort — still reveal answer locally
    } finally {
      setSelected(opt)
      setSubmitting(false)
    }
  }

  function getOptionStyle(opt: Option) {
    if (!submitted) {
      return {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        color: '#111827',
        cursor: submitting ? 'wait' : 'pointer',
        opacity: submitting ? 0.7 : 1,
      }
    }
    if (opt === mcq.correct_answer) {
      return {
        background: 'rgba(16,185,129,0.15)',
        border: '1px solid rgba(16,185,129,0.4)',
        color: '#10B981',
        cursor: 'default',
      }
    }
    if (opt === selected) {
      return {
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#EF4444',
        cursor: 'default',
      }
    }
    return {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      color: '#9CA3AF',
      cursor: 'default',
    }
  }

  const diffColor = DIFFICULTY_COLOR[mcq.difficulty]
  const isCorrect = submitted ? selected === mcq.correct_answer : null

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold" style={{ color: '#6B7280' }}>
          Q{index + 1}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
          style={{ color: diffColor, background: `${diffColor}18` }}
        >
          {mcq.difficulty}
        </span>
        <span
          className="text-[10px] rounded px-2 py-0.5 ml-auto"
          style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7' }}
        >
          {mcq.exam_type}
        </span>
        {submitted && (
          <span
            className="text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{
              background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
              color:      isCorrect ? '#10B981' : '#EF4444',
            }}
          >
            {isCorrect ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-[14px] font-medium leading-snug mb-4" style={{ color: '#111827' }}>
        {mcq.question}
      </p>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {OPTIONS.map(opt => (
          <button
            key={opt}
            disabled={submitted || submitting}
            onClick={() => handleSelect(opt)}
            className="w-full text-left rounded-xl px-4 py-3 text-[13px] flex gap-3 items-start transition-all duration-150"
            style={getOptionStyle(opt)}
          >
            <span className="font-bold shrink-0 mt-0.5">{opt}.</span>
            <span>{optionLabel(mcq, opt)}</span>
          </button>
        ))}
      </div>

      {/* Explanation — only after answering */}
      {submitted && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(37,51,255,0.08)', border: '1px solid rgba(37,51,255,0.2)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#0284c7' }}>
            Explanation
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#374151' }}>
            {mcq.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
