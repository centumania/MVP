'use client'

import { Card, CardLabel } from '@/src/components/ui/Card'

interface BatchProgressProps {
  attended: number
  total:    number
  pct:      number
}

export function BatchProgress({ attended, total, pct }: BatchProgressProps) {
  const segments = Array.from({ length: total }, (_, i) => i < attended)
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardLabel>Batch timeline</CardLabel>
        <span className="text-xs font-mono text-text-muted">{attended}/{total} days · {pct}%</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {segments.map((done, i) => (
          <div
            key={i}
            title={`Day ${i + 1}${done ? ' ✓' : ''}`}
            className="rounded-sm transition-all"
            style={{
              width: 20, height: 20,
              background: done ? '#3fae6a' : '#1b271f',
              border: `1px solid ${done ? '#3fae6a' : '#27342b'}`,
              boxShadow: done ? '0 0 4px rgba(63,174,106,0.5)' : undefined,
            }}
          >
            <span className="sr-only">Day {i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-text-muted mt-2.5 font-mono">
        {total - attended > 0 ? `${total - attended} days remaining in this batch` : '🎉 Batch complete!'}
      </p>
    </Card>
  )
}
