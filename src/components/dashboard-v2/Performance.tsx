'use client'

/**
 * Dashboard v2 — Performance card.
 * Merges v1's separate trend + unbounded history cards into one focused
 * section: 7-exam trend bars, then history capped at 5 with show-more.
 */
import { useState } from 'react'
import { Card, CardLabel, scoreColor } from './ui'

export type HistoryItem = {
  dayNumber: number | null
  score: number
  totalMarks: number
  pct: number
  submittedAt: string
}

const HISTORY_PREVIEW = 5

export function PerformanceCard({ last7, history }: {
  last7: { score: number; totalMarks: number; pct: number }[]
  history: HistoryItem[]
}) {
  const [showAll, setShowAll] = useState(false)
  if (last7.length === 0 && history.length === 0) return null

  const displayed = showAll ? history : history.slice(0, HISTORY_PREVIEW)

  return (
    <Card noPadding>
      {/* Trend */}
      {last7.length > 0 && (
        <div className="px-5 pb-4 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <CardLabel>Performance trend</CardLabel>
            <span className="text-[11.5px] font-medium text-gray-400">last {last7.length} exams</span>
          </div>
          <div className="flex h-20 items-end gap-1.5">
            {last7.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold tabular-nums text-gray-500">{s.pct}%</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{ height: Math.max(8, (s.pct / 100) * 64), background: scoreColor(s.pct) }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 border-t border-dashed border-gray-200 pt-3">
            {[
              ['#10b981', '≥80%'],
              ['#0284c7', '60–79%'],
              ['#f59e0b', '40–59%'],
              ['#9ca3af', '<40%'],
            ].map(([col, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: col }} />
                <span className="text-[10.5px] font-medium text-gray-500">{label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className={last7.length > 0 ? 'border-t border-gray-100' : ''}>
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <CardLabel>Exam history</CardLabel>
            <span className="text-[11px] font-medium tabular-nums text-gray-400">{history.length} submissions</span>
          </div>
          {displayed.map((h, i) => {
            const col = scoreColor(h.pct)
            const date = new Date(h.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            return (
              <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold tabular-nums"
                  style={{ background: `${col}14`, color: col }}
                >
                  D{h.dayNumber ?? '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-bold tabular-nums" style={{ color: col }}>
                      {h.score}/{h.totalMarks}
                    </span>
                    <span className="text-[12px] tabular-nums text-gray-400">({h.pct}%)</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: col }} />
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-gray-400">{date}</span>
              </div>
            )
          })}
          {history.length > HISTORY_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAll(s => !s)}
              className="w-full border-t border-gray-100 py-2.5 text-[12.5px] font-bold text-sky-600 transition-colors hover:bg-sky-50/50"
            >
              {showAll ? 'Show less' : `Show all ${history.length}`}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

export function BatchTimeline({ attended, total, pct }: { attended: number; total: number; pct: number }) {
  const segments = Array.from({ length: total }, (_, i) => i < attended)
  const remaining = total - attended
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardLabel>Batch timeline</CardLabel>
        <span className="text-[11.5px] font-medium tabular-nums text-gray-500">{attended}/{total} days · {pct}%</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {segments.map((done, i) => (
          <div
            key={i}
            title={`Day ${i + 1}${done ? ' ✓' : ''}`}
            className={`h-5 w-5 rounded-md transition-colors ${done ? 'bg-sky-500' : 'border border-gray-200 bg-gray-50'}`}
          >
            <span className="sr-only">Day {i + 1}{done ? ' attended' : ''}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11.5px] text-gray-500">
        {remaining > 0 ? `${remaining} days remaining in this batch` : 'Batch complete — well done!'}
      </p>
    </Card>
  )
}
