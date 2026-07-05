/**
 * Dashboard v2 — AI Study Insights panel.
 * Same InsightsData contract as v1; light design system.
 */
import Link from 'next/link'
import { Brain } from '@/src/components/landing-v2/icons'
import { Card, CardLabel } from './ui'
import type { InsightsData } from '@/src/components/dashboard/InsightsCard'

type Tier = 'critical' | 'weak' | 'moderate' | 'strong'

const TIER_CFG: Record<Tier, { label: string; text: string; bg: string; ring: string; chip: string }> = {
  critical: { label: 'Needs urgent work', text: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200/70', chip: 'bg-red-100 text-red-700' },
  weak: { label: 'Needs practice', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200/70', chip: 'bg-amber-100 text-amber-700' },
  moderate: { label: 'Getting there', text: 'text-sky-700', bg: 'bg-sky-50', ring: 'ring-sky-200/70', chip: 'bg-sky-100 text-sky-700' },
  strong: { label: 'Strong', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200/70', chip: 'bg-emerald-100 text-emerald-700' },
}

function Header({ badge }: { badge?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Brain size={14} />
        </span>
        <CardLabel>AI Study Insights</CardLabel>
      </div>
      {badge}
    </div>
  )
}

export function InsightsPanel({ data }: { data: InsightsData }) {
  // Loading
  if (data === null) {
    return (
      <Card>
        <Header />
        <div className="animate-pulse space-y-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-100" style={{ width: `${w}%` }} />
          ))}
        </div>
      </Card>
    )
  }

  if (!data.available) {
    return (
      <Card>
        <Header />
        <p className="text-[13.5px] leading-relaxed text-gray-500">
          Your AI engine is being set up. Once ready, it will analyse your exam answers and tell you exactly which topics need attention.
        </p>
      </Card>
    )
  }

  if (!data.hasData || !data.profile) {
    return (
      <Card>
        <Header />
        <p className="mb-1 text-[14px] font-bold text-gray-900">No data yet</p>
        <p className="text-[13px] leading-relaxed text-gray-500">
          Attempt a few daily tests and the AI will show you a personalised breakdown of every topic — what&apos;s strong, what&apos;s weak, and where to focus next.
        </p>
      </Card>
    )
  }

  const { profile } = data
  const urgentCount = profile.critical.length + profile.weak.length
  const tiers = (
    [
      { key: 'critical', topics: profile.critical },
      { key: 'weak', topics: profile.weak },
      { key: 'moderate', topics: profile.moderate },
      { key: 'strong', topics: profile.strong },
    ] as Array<{ key: Tier; topics: string[] }>
  ).filter(t => t.topics.length > 0)

  return (
    <Card>
      <Header
        badge={
          urgentCount > 0 ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-200/70">
              {urgentCount} to improve
            </span>
          ) : undefined
        }
      />

      {profile.critical.length > 0 ? (
        <p className="mb-3 text-[13px] font-medium text-red-600">
          Focus on <strong>{profile.critical.slice(0, 2).join(' & ')}</strong> first — below 50% accuracy.
        </p>
      ) : profile.weak.length > 0 ? (
        <p className="mb-3 text-[13px] font-medium text-amber-600">
          Practice <strong>{profile.weak.slice(0, 2).join(' & ')}</strong> — accuracy between 50–70%.
        </p>
      ) : (
        <p className="mb-3 text-[13px] font-medium text-emerald-600">All topics at 70%+. Keep up the momentum!</p>
      )}

      <div className="space-y-2">
        {tiers.map(({ key, topics }) => {
          const cfg = TIER_CFG[key]
          return (
            <div key={key} className={`rounded-xl px-3.5 py-2.5 ring-1 ${cfg.bg} ${cfg.ring}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`text-[10.5px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                <span className={`text-[10.5px] font-semibold tabular-nums opacity-70 ${cfg.text}`}>{topics.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topics.map(t => (
                  <span key={t} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.chip}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Updates automatically after each exam</p>
        <Link href="/insights" className="text-[12px] font-bold text-sky-600 transition-colors hover:text-sky-700">
          Full analysis →
        </Link>
      </div>
    </Card>
  )
}
