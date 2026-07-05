/**
 * Dashboard v2 — pure presentational composition.
 * Receives all data as props; no fetching, no auth. Used by the real
 * /dashboard page (live data) and /dev/dashboard-preview (mock data).
 *
 * Visual hierarchy (one primary action, calm supporting layers):
 *   1. Greeting          — orientation
 *   2. ExamHero          — the ONE thing to do right now (was missing in v1)
 *   3. DailyTestCard     — secondary AI action
 *   4. Stat tiles        — standings at a glance
 *   5. Centum Index      — the long-game score
 *   6. Performance       — trend + history (merged, capped)
 *   7. Insights / News   — study intelligence
 *   8. Batch timeline + tip — closing rhythm
 */
import { StatTile } from './ui'
import { ExamHero, DailyTestCard, type TodayExam } from './ExamHero'
import { CentumCard, type CentumData } from './CentumCard'
import { InsightsPanel } from './InsightsPanel'
import { NewsPanel } from './NewsPanel'
import { PerformanceCard, BatchTimeline, type HistoryItem } from './Performance'
import type { InsightsData } from '@/src/components/dashboard/InsightsCard'
import type { CurrentAffairsItem } from '@/src/app/api/current-affairs/route'

export type DashData = {
  paymentPending: boolean
  todayExam: TodayExam | null
  batchTotalDays: number
  leaderboard: { rank: number; score: number; days: number; accuracy: number; percentile: number | null } | null
  xp: number
  xpLevel: number
  xpInLevel: number
  xpToNext: number
  streak: number
  daysAttended: number
  last7: { score: number; totalMarks: number; pct: number }[]
  history: HistoryItem[]
} & CentumData

export type CurrentAffairsPayload = {
  items: CurrentAffairsItem[]
  generatedToday: boolean
  todayDate: string
} | null

const TIPS = [
  'Review previous mistakes before each exam — not new topics.',
  'Attempt every question; eliminate obviously wrong options first.',
  'Read the question stem twice before looking at options.',
  'If stuck, mark and come back. Never leave a question blank.',
  'Sleep 7+ hours before exam day. Recall drops 40% on poor sleep.',
  'Revise notes within 24 hours. Retention jumps from 30% to 80%.',
  'Confidence matters. Every question you attempted is a win.',
]

function greeting() {
  const h = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours()
  if (h < 5) return 'Early start'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Late session'
}

export function DashboardView({ firstName, data, insights, currentAffairs }: {
  firstName: string
  data: DashData
  insights: InsightsData
  currentAffairs: CurrentAffairsPayload
}) {
  const lr = data.leaderboard
  const totalDays = data.batchTotalDays || 30
  const progressPct = Math.round((data.daysAttended / totalDays) * 100)
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const tipIdx = new Date().getDate() % TIPS.length
  const daysLeft = totalDays - data.daysAttended

  const stats = [
    { label: 'Rank', value: lr ? `#${lr.rank}` : '—', sub: lr?.percentile ? `top ${100 - lr.percentile + 1}%` : 'unranked', href: '/leaderboard' },
    { label: 'Score', value: lr ? lr.score.toLocaleString() : '—', sub: 'total points', href: '/leaderboard' },
    { label: 'Streak', value: `${data.streak}d`, sub: data.streak > 0 ? 'keep it alive' : 'start today', href: '/profile' },
    { label: 'Accuracy', value: lr ? `${lr.accuracy}%` : '—', sub: 'avg accuracy', href: '/insights' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      {/* ── Greeting ── */}
      <header className="flex items-end justify-between pt-1">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-gray-400">{greeting()}</p>
          <h1 className="mt-0.5 text-[32px] font-extrabold leading-none tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
            {firstName}
          </h1>
          <p className="mt-1.5 text-[12.5px] text-gray-500">{dateLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11.5px] font-bold tabular-nums text-sky-700 ring-1 ring-sky-200/60">
            Day {data.daysAttended} of {totalDays}
          </span>
          {daysLeft > 0 && <span className="text-[11px] font-medium tabular-nums text-gray-400">{daysLeft} days to go</span>}
        </div>
      </header>

      {/* ── Primary action: today's exam ── */}
      <ExamHero exam={data.todayExam} />

      {/* ── Secondary action: AI revision test ── */}
      <DailyTestCard />

      {/* ── Standings ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {stats.map(s => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* ── Centum Index ── */}
      <CentumCard data={data} />

      {/* ── Performance: trend + history ── */}
      <PerformanceCard last7={data.last7} history={data.history} />

      {/* ── AI insights ── */}
      <InsightsPanel data={insights} />

      {/* ── Current affairs ── */}
      {currentAffairs && (
        <NewsPanel items={currentAffairs.items} generatedToday={currentAffairs.generatedToday} todayDate={currentAffairs.todayDate} />
      )}

      {/* ── Batch timeline ── */}
      <BatchTimeline attended={data.daysAttended} total={totalDays} pct={progressPct} />

      {/* ── Daily tip ── */}
      <aside className="flex items-start gap-3.5 rounded-2xl border border-teal-200/60 bg-teal-50/60 px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-teal-700">Today&apos;s tip</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-gray-700">{TIPS[tipIdx]}</p>
        </div>
      </aside>
    </div>
  )
}
