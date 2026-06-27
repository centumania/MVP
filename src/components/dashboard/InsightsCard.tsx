'use client'

import { Card, CardLabel } from '@/src/components/ui/Card'

type Tier = 'critical' | 'weak' | 'moderate' | 'strong'

export type InsightsData = {
  available: boolean
  hasData: boolean
  profile: {
    topics: Array<{ topic: string; accuracyPct: number; totalAttempted: number; tier: Tier }>
    critical: string[]
    weak:     string[]
    moderate: string[]
    strong:   string[]
  } | null
} | null

const TIER_CFG: Record<Tier, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Needs urgent work', color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.22)'  },
  weak:     { label: 'Needs practice',    color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' },
  moderate: { label: 'Getting there',     color: '#2563EB', bg: 'rgba(37,99,235,0.10)',  border: 'rgba(37,99,235,0.22)'  },
  strong:   { label: 'Strong',            color: '#22C55E', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)'  },
}

// ── Loading skeleton ───────────────────────────────────────────────
function InsightsSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardLabel>AI Study Insights</CardLabel>
        <div className="w-14 h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>
      {[80, 60, 70].map((w, i) => (
        <div key={i} className="h-10 rounded-xl mb-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: `${w}%` }} />
      ))}
    </Card>
  )
}

// ── Main card ──────────────────────────────────────────────────────
export function InsightsCard({ data }: { data: InsightsData }) {
  if (data === null) return <InsightsSkeleton />

  // Table not yet set up in this environment
  if (!data.available) {
    return (
      <Card>
        <div className="flex items-center gap-2.5 mb-3">
          <IconBrain />
          <CardLabel>AI Study Insights</CardLabel>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-cm-neutral-300)' }}>
          Your AI engine is being set up. Once ready, it will analyse your exam answers and tell you exactly which topics need attention.
        </p>
      </Card>
    )
  }

  // No topic-accuracy data yet
  if (!data.hasData || !data.profile) {
    return (
      <Card>
        <div className="flex items-center gap-2.5 mb-3">
          <IconBrain />
          <CardLabel>AI Study Insights</CardLabel>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>No data yet</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-cm-neutral-300)' }}>
          Attempt a few daily tests and the AI will show you a personalised breakdown of every topic — what&apos;s strong, what&apos;s weak, and where to focus next.
        </p>
      </Card>
    )
  }

  const { profile } = data
  const urgentCount = profile.critical.length + profile.weak.length

  const tiers: Array<{ key: Tier; topics: string[] }> = (
    [
      { key: 'critical' as Tier, topics: profile.critical },
      { key: 'weak'     as Tier, topics: profile.weak     },
      { key: 'moderate' as Tier, topics: profile.moderate },
      { key: 'strong'   as Tier, topics: profile.strong   },
    ] as Array<{ key: Tier; topics: string[] }>
  ).filter(t => t.topics.length > 0)

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <IconBrain />
          <CardLabel>AI Study Insights</CardLabel>
        </div>
        {urgentCount > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.22)' }}>
            {urgentCount} to improve
          </span>
        )}
      </div>

      {/* One-line focus message */}
      {profile.critical.length > 0 ? (
        <p className="text-xs font-medium mb-3" style={{ color: '#EF4444' }}>
          Focus on <strong>{profile.critical.slice(0, 2).join(' & ')}</strong> first — below 50% accuracy.
        </p>
      ) : profile.weak.length > 0 ? (
        <p className="text-xs font-medium mb-3" style={{ color: '#F59E0B' }}>
          Practice <strong>{profile.weak.slice(0, 2).join(' & ')}</strong> — accuracy between 50–70%.
        </p>
      ) : (
        <p className="text-xs font-medium mb-3" style={{ color: '#22C55E' }}>
          All topics at 70%+. Keep up the momentum!
        </p>
      )}

      {/* Tier breakdown */}
      <div className="space-y-2">
        {tiers.map(({ key, topics }) => {
          const cfg = TIER_CFG[key]
          return (
            <div key={key} className="rounded-xl px-3.5 py-2.5"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-[10px] font-mono opacity-70" style={{ color: cfg.color }}>
                  {topics.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topics.map(t => (
                  <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${cfg.color}18`, color: cfg.color }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] mt-3" style={{ color: 'var(--color-text-muted, #6B7280)' }}>
        Updates automatically after each exam
      </p>
    </Card>
  )
}

function IconBrain() {
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'rgba(37,51,255,0.15)', color: '#2533FF' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
      </svg>
    </div>
  )
}
