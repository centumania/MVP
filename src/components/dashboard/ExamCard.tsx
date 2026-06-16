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
          <span className="text-xl mb-1" style={{ color: 'var(--color-cm-neutral-300)' }}>/ {today.totalMarks}</span>
          <span className="text-lg font-bold mb-1 ml-auto" style={{ color: col }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: col }} />
        </div>
        <Link href={`/exam/${today.dayNumber}`}>
          <Button variant="ghost" size="sm" className="mt-3 -ml-2" style={{ color: '#2533FF' }}>
            View answer key →
          </Button>
        </Link>
      </Card>
    )
  }

  if (w.isOpen && today) {
    return (
      /* Live exam hero card — Centumania Indigo surface */
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a24e8 0%, #2533FF 60%, #0d1db8 100%)', boxShadow: '0 8px 32px rgba(37,51,255,0.35)' }}>
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-soft" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live · Day {today.dayNumber}</span>
            </div>
            <span className="streak-pill">🔥 streak</span>
          </div>
          {/* Bebas Neue timer display */}
          <p className="text-[11px] text-white/65 mb-1 font-medium">Window closes in</p>
          <p className="font-bebas text-[52px] leading-none tracking-wide text-white mb-1">{w.closesIn}</p>
          <p className="text-xs text-white/60 mb-6">6:00 – 8:30 AM IST · auto-submits · no late entries</p>
          <Link href={`/exam/${today.dayNumber}`}>
            <button className="w-full h-12 rounded-xl font-bold text-[15px] inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: '#F6B300', color: '#0B1020', boxShadow: '0 4px 16px rgba(246,179,0,0.30)' }}>
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
      <Card>
        <div className="flex items-center justify-between mb-2">
          <CardLabel>Today&apos;s Mission</CardLabel>
          <Badge variant="primary" size="sm">Up next</Badge>
        </div>
        <p className="font-bebas text-[36px] leading-none tracking-wide mb-1" style={{ color: '#F9FAFB' }}>
          {w.opensIn}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-cm-neutral-300)' }}>Daily window: 6:00 AM – 8:30 AM IST. Be ready.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardLabel className="mb-2">Exam status</CardLabel>
      <p className="text-sm" style={{ color: 'var(--color-cm-neutral-300)' }}>{w.message}</p>
    </Card>
  )
}
