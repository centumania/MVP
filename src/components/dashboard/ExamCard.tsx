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
  if (pct >= 80) return '#4ADE80'
  if (pct >= 60) return '#5ec8c0'
  if (pct >= 40) return '#e7b14c'
  return '#e8736b'
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
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}60` }} />
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
      <div className="relative rounded-2xl overflow-hidden animate-pulse-glow"
        style={{ background: 'linear-gradient(135deg,rgba(74,222,128,0.12),rgba(74,222,128,0.04))', border: '1px solid rgba(74,222,128,0.25)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right,rgba(74,222,128,0.08),transparent 60%)' }} />
        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">Live now</span>
          </div>
          <p className="text-2xl font-bold text-text tracking-tight mb-1" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
            Closes in {w.closesIn}
          </p>
          <p className="text-sm text-text-secondary mb-5">Window closes at 8:30 AM IST. No late submissions.</p>
          <Link href={`/exam/${today.dayNumber}`}>
            <Button size="lg" fullWidth className="font-bold">
              Attempt Exam — Day {today.dayNumber}
              <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!w.isOpen && w.opensIn) {
    return (
      <Card>
        <CardLabel className="mb-3">Next exam</CardLabel>
        <p className="text-2xl font-bold text-text tracking-tight mb-1" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Opens in {w.opensIn}
        </p>
        <p className="text-sm text-text-secondary">Daily window: 6:00 AM – 8:30 AM IST</p>
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
