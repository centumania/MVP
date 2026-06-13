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
        <span className="text-xs text-text-muted tabular">{attended}/{total} days · {pct}%</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {segments.map((done, i) => (
          <div
            key={i}
            title={`Day ${i + 1}${done ? ' ✓' : ''}`}
            className="rounded-md transition-all"
            style={{
              width: 20, height: 20,
              background: done ? 'var(--color-secondary)' : 'var(--color-bg2)',
              border: `1px solid ${done ? 'var(--color-secondary)' : 'var(--color-border)'}`,
            }}
          >
            <span className="sr-only">Day {i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-text-muted mt-2.5">
        {total - attended > 0 ? `${total - attended} days remaining in this batch` : '🎉 Batch complete!'}
      </p>
    </Card>
  )
}
