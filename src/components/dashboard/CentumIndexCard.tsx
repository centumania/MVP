'use client'

import { CardLabel } from '@/src/components/ui/Card'

export type CentumData = {
  centumIndex:      number
  nodeScore:        number   // 35% — nodes opened vs daily target
  attendanceScore:  number   // 35% — active days / days elapsed
  accuracyScore:    number   // 20% — MCQ correct ratio
  depthScore:       number   // 10% — nodes completed / nodes opened
  nodesOpened:      number
  nodesCompleted:   number
  mcqsDone:         number
  mcqsCorrect:      number
  activeDaysInBatch: number
  daysElapsed:      number
}

function ciColor(score: number): string {
  if (score >= 85) return '#22C55E'
  if (score >= 70) return '#2533FF'
  if (score >= 50) return '#F6B300'
  if (score > 0)   return '#F59E0B'
  return '#4B5563'
}

function ciLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Moderate'
  if (score > 0)   return 'Building'
  return 'Not Started'
}

type BarProps = { label: string; weight: string; value: number; color: string; detail: string }
function ScoreBar({ label, weight, value, color, detail }: BarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-cm-neutral-300)' }}>
          {label} <span className="opacity-50">{weight}</span>
        </span>
        <span className="text-xs font-bold font-mono" style={{ color: '#F9FAFB' }}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      <p className="text-[9px] mt-0.5" style={{ color: 'var(--color-cm-neutral-300)', opacity: 0.7 }}>{detail}</p>
    </div>
  )
}

export function CentumIndexCard({ data }: { data: CentumData }) {
  const {
    centumIndex, nodeScore, attendanceScore, accuracyScore, depthScore,
    nodesOpened, nodesCompleted, mcqsDone, mcqsCorrect, activeDaysInBatch, daysElapsed,
  } = data
  const color = ciColor(centumIndex)

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <CardLabel>Centum Index</CardLabel>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color }}>
            {ciLabel(centumIndex)}
          </span>
        </div>
      </div>

      {/* Big score + breakdown */}
      <div className="flex items-start gap-5 px-5 py-4">
        <div className="shrink-0 text-center pt-1">
          <p className="font-bebas leading-none tracking-wide"
            style={{ fontSize: 68, color, lineHeight: 1 }}>
            {centumIndex.toFixed(1)}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest mt-1"
            style={{ color: 'var(--color-cm-neutral-300)' }}>
            / 100
          </p>
        </div>

        <div className="flex-1 space-y-2.5">
          <ScoreBar
            label="Nodes"      weight="35%"
            value={nodeScore}  color="#0EA5A0"
            detail={`${nodesOpened} opened · target 15/day`}
          />
          <ScoreBar
            label="Attendance" weight="35%"
            value={attendanceScore} color="#2533FF"
            detail={`${activeDaysInBatch} of ${daysElapsed} days active`}
          />
          <ScoreBar
            label="Accuracy"   weight="20%"
            value={accuracyScore}  color="#22C55E"
            detail={mcqsDone > 0 ? `${mcqsCorrect}/${mcqsDone} MCQs correct` : 'No MCQs yet'}
          />
          <ScoreBar
            label="Depth"      weight="10%"
            value={depthScore} color="#F59E0B"
            detail={`${nodesCompleted} of ${nodesOpened} nodes completed`}
          />
        </div>
      </div>
    </div>
  )
}
