'use client'

import Link from 'next/link'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import type { ExamWindowStatus } from '@/src/types/database'

type TodayExam = {
  dayNumber:        number
  examId:           string
  alreadySubmitted: boolean
  score?:           number
  totalMarks?:      number
}

function scoreColor(pct: number): string {
  if (pct >= 80) return '#10B981'
  if (pct >= 60) return '#0B3D91'
  if (pct >= 40) return '#F59E0B'
  return '#EF4444'
}

interface ExamCardProps {
  w:     ExamWindowStatus
  today: TodayExam | null
}

export function ExamCard({ w, today }: ExamCardProps) {
  if (today?.alreadySubmitted) {
    const pct = today.totalMarks ? Math.round(((today.score ?? 0) / today.totalMarks) * 100) : 0
    const col = scoreColor(pct)
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardLabel>Today&apos;s result</CardLabel>
          <Badge variant={pct >= 80 ? 'success' : pct >= 60 ? 'info' : pct >= 40 ? 'warning' : 'error'}>
            Day {today.dayNumber}
          </Badge>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-bold font-mono tracking-tight" style={{ color: col }}>{today.score}</span>
          <span className="text-xl text-text-muted mb-1">/ {today.totalMarks}</span>
          <span className="text-lg font-bold mb-1 ml-auto" style={{ color: col }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg2)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: col }} />
        </div>
        <Link href={`/exam/${today.dayNumber}`}>
          <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-primary hover:text-primary">
            View answer key →
          </Button>
        </Link>
      </Card>
    )
  }

  if (w.isOpen && today) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-primary text-white shadow-[var(--shadow-primary)]">
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-soft" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Today&apos;s Mission · Live</span>
            </div>
            <span className="text-[11px] font-semibold text-white/80 tabular">Day {today.dayNumber}</span>
          </div>
          <p className="text-[13px] text-white/75 mb-1">Your daily test is open. Closes in</p>
          <p className="text-3xl font-bold tracking-tight mb-1 tabular">{w.closesIn}</p>
          <p className="text-xs text-white/70 mb-5">Window closes at 8:30 AM IST · auto-submits · no late entries.</p>
          <Link href={`/exam/${today.dayNumber}`}>
            <button className="w-full h-12 rounded-xl bg-white text-primary font-bold text-base inline-flex items-center justify-center gap-1.5 hover:bg-white/92 transition-colors">
              Start Today&apos;s Test
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (!w.isOpen && w.opensIn) {
    return (
      <Card highlight>
        <div className="flex items-center justify-between mb-2">
          <CardLabel>Today&apos;s Mission</CardLabel>
          <Badge variant="primary" size="sm">Up next</Badge>
        </div>
        <p className="text-2xl font-bold text-text tracking-tight mb-1">
          Opens in {w.opensIn}
        </p>
        <p className="text-sm text-text-secondary">Daily window: 6:00 AM – 8:30 AM IST. Be ready.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardLabel className="mb-2">Exam status</CardLabel>
      <p className="text-sm text-text-secondary">{w.message}</p>
    </Card>
  )
}
