'use client'

import Link from 'next/link'
import type { CAIEEvent, ImportanceLevel } from '@/src/lib/caie/types'

const IMPORTANCE_COLOR: Record<ImportanceLevel, string> = {
  Critical: '#EF4444',
  High:     '#F6B300',
  Medium:   '#0284c7',
  Low:      '#9CA3AF',
}

const IMPORTANCE_BG: Record<ImportanceLevel, string> = {
  Critical: 'rgba(239,68,68,0.12)',
  High:     'rgba(246,179,0,0.12)',
  Medium:   'rgba(2,132,199,0.10)',
  Low:      '#F3F4F6',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface EventCardProps {
  event: CAIEEvent
}

export function EventCard({ event }: EventCardProps) {
  const impColor = IMPORTANCE_COLOR[event.importance] ?? IMPORTANCE_COLOR.Medium
  const impBg    = IMPORTANCE_BG[event.importance]    ?? IMPORTANCE_BG.Medium

  return (
    <Link href={`/current-affairs/${event.id}`} className="block group">
      <div
        className="rounded-2xl p-5 transition-all duration-200 group-hover:translate-y-[-1px]"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 shrink-0"
            style={{ color: impColor, background: impBg }}
          >
            {event.importance}
          </span>
          <span className="text-[11px]" style={{ color: '#6B7280' }}>
            {formatDate(event.source_date)}
          </span>
        </div>

        {/* Headline */}
        <h3
          className="font-semibold text-[15px] leading-snug mb-2 line-clamp-2"
          style={{ color: '#111827' }}
        >
          {event.headline}
        </h3>

        {/* Summary */}
        <p
          className="text-[13px] leading-relaxed line-clamp-2 mb-3"
          style={{ color: '#4B5563' }}
        >
          {event.ultra_short_summary}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-medium rounded px-2 py-0.5"
            style={{ background: 'rgba(2,132,199,0.10)', color: '#0284c7' }}
          >
            {event.category}
          </span>
          {event.source_count > 1 && (
            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
              {event.source_count} sources
            </span>
          )}
          <span className="ml-auto text-[11px] font-medium" style={{ color: '#0284c7' }}>
            Read →
          </span>
        </div>
      </div>
    </Link>
  )
}
