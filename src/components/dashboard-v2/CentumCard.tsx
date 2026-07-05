/**
 * Dashboard v2 — Centum Index card.
 * Data contract identical to v1 CentumIndexCard (weights come from the
 * /api/dashboard computation: nodes 35 · attendance 35 · accuracy 20 · depth 10).
 */
import { CardLabel } from './ui'

export type CentumData = {
  centumIndex: number
  nodeScore: number
  attendanceScore: number
  accuracyScore: number
  depthScore: number
  nodesOpened: number
  nodesCompleted: number
  mcqsDone: number
  mcqsCorrect: number
  activeDaysInBatch: number
  daysElapsed: number
}

function ciTone(score: number): { color: string; track: string; label: string } {
  if (score >= 85) return { color: '#10b981', track: 'bg-emerald-500', label: 'Excellent' }
  if (score >= 70) return { color: '#0284c7', track: 'bg-sky-600', label: 'Good' }
  if (score >= 50) return { color: '#f59e0b', track: 'bg-amber-500', label: 'Moderate' }
  if (score > 0) return { color: '#fb923c', track: 'bg-orange-400', label: 'Building' }
  return { color: '#9ca3af', track: 'bg-gray-400', label: 'Not started' }
}

function ScoreBar({ label, weight, value, barClass, detail }: {
  label: string
  weight: string
  value: number
  barClass: string
  detail: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {label} <span className="font-semibold text-gray-300">{weight}</span>
        </span>
        <span className="text-[12.5px] font-bold tabular-nums text-gray-900">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all duration-700 ${barClass}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">{detail}</p>
    </div>
  )
}

export function CentumCard({ data }: { data: CentumData }) {
  const tone = ciTone(data.centumIndex)

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 pt-4">
        <CardLabel>Centum Index</CardLabel>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: tone.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.color }} />
          {tone.label}
        </span>
      </div>

      <div className="flex flex-col gap-5 px-5 py-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0 sm:pt-1 sm:text-center">
          <p className="text-[56px] font-extrabold leading-none tabular-nums tracking-tight" style={{ color: tone.color, letterSpacing: '-0.03em' }}>
            {data.centumIndex.toFixed(1)}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:mt-1.5">/ 100</p>
        </div>

        <div className="flex-1 space-y-3">
          <ScoreBar
            label="Nodes" weight="35%"
            value={data.nodeScore} barClass="bg-sky-500"
            detail={`${data.nodesOpened} opened · target 15/day`}
          />
          <ScoreBar
            label="Attendance" weight="35%"
            value={data.attendanceScore} barClass="bg-indigo-500"
            detail={`${data.activeDaysInBatch} of ${data.daysElapsed} days active`}
          />
          <ScoreBar
            label="Accuracy" weight="20%"
            value={data.accuracyScore} barClass="bg-emerald-500"
            detail={data.mcqsDone > 0 ? `${data.mcqsCorrect}/${data.mcqsDone} MCQs correct` : 'No MCQs yet'}
          />
          <ScoreBar
            label="Depth" weight="10%"
            value={data.depthScore} barClass="bg-amber-500"
            detail={`${data.nodesCompleted} of ${data.nodesOpened} nodes completed`}
          />
        </div>
      </div>
    </section>
  )
}
