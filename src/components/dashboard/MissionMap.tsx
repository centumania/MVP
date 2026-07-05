'use client'

import Link from 'next/link'

/**
 * MissionMap — the CentuMania mastery path.
 *
 * A vertical, winding learning path (Duolingo × Brilliant, academic-premium)
 * where every node is one day's mission. State is derived entirely from REAL
 * dashboard data — no fabricated backend:
 *
 *   mastered    score ≥ 80%        teal, ✓ + ring
 *   completed   score 45–79%       primary blue, ✓
 *   weak        score < 45%        amber, "Revision due"
 *   current     today's open exam  primary ring, "In progress" / "Start"
 *   missed      past, not attended  muted, "Missed"
 *   locked      future day          muted + lock
 */

type HistoryItem = { dayNumber: number | null; pct: number; score: number; totalMarks: number }
type NodeState = 'mastered' | 'completed' | 'weak' | 'current' | 'missed' | 'locked'

interface MissionMapProps {
  history:    HistoryItem[]
  totalDays:  number
  currentDay: number | null
  todayLive:  boolean
}

interface MapNode {
  day:    number
  state:  NodeState
  pct:    number | null
  live:   boolean
}

const STATE_META: Record<NodeState, { ring: string; fill: string; label: string; chipBg: string; chipText: string }> = {
  mastered:  { ring: '#00C897', fill: '#00C897', label: 'Mastered',     chipBg: 'rgba(0,200,151,0.12)',  chipText: '#047857' },
  completed: { ring: '#0284c7', fill: '#0284c7', label: 'Completed',    chipBg: 'rgba(2,132,199,0.10)',  chipText: '#0284c7' },
  weak:      { ring: '#F59E0B', fill: '#F59E0B', label: 'Revision due', chipBg: 'rgba(245,158,11,0.14)', chipText: '#B45309' },
  current:   { ring: '#0284c7', fill: '#FFFFFF', label: 'In progress',  chipBg: 'rgba(2,132,199,0.10)',  chipText: '#0284c7' },
  missed:    { ring: '#E5E7EB', fill: '#FFFFFF', label: 'Missed',       chipBg: '#F1F5F9',               chipText: '#6B7280' },
  locked:    { ring: '#E5E7EB', fill: '#F8FAFC', label: 'Locked',       chipBg: '#F1F5F9',               chipText: '#9CA3AF' },
}

function buildNodes({ history, totalDays, currentDay, todayLive }: MissionMapProps): MapNode[] {
  const byDay = new Map<number, HistoryItem>()
  history.forEach(h => { if (h.dayNumber != null) byDay.set(h.dayNumber, h) })

  return Array.from({ length: Math.max(totalDays, 1) }, (_, i) => {
    const day = i + 1
    const h = byDay.get(day)
    let state: NodeState
    if (h) {
      state = h.pct >= 80 ? 'mastered' : h.pct >= 45 ? 'completed' : 'weak'
    } else if (currentDay != null && day === currentDay) {
      state = 'current'
    } else if (currentDay != null && day < currentDay) {
      state = 'missed'
    } else {
      state = 'locked'
    }
    return { day, state, pct: h ? h.pct : null, live: state === 'current' && todayLive }
  })
}

export function MissionMap(props: MissionMapProps) {
  const nodes = buildNodes(props)
  const done = nodes.filter(n => n.state === 'mastered' || n.state === 'completed' || n.state === 'weak').length
  const masteredCount = nodes.filter(n => n.state === 'mastered').length

  return (
    <section className="card overflow-hidden" aria-label="Mission map">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-text tracking-tight">Mission Map</h2>
          <p className="text-xs text-text-muted mt-0.5">Your daily path to exam day</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-text tabular">{done}<span className="text-text-faint">/{nodes.length}</span></p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">missions done</p>
        </div>
      </div>

      {/* Path */}
      <div className="relative px-5 py-5">
        <ul className="relative" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {nodes.map((node, i) => {
            const meta = STATE_META[node.state]
            const isLast = i === nodes.length - 1
            // The connector below this node is "lit" when this node is reached.
            const reached = node.state !== 'locked' && node.state !== 'missed'
            const nextReached = !isLast && nodes[i + 1].state !== 'locked'
            const connectorLit = reached && nextReached
            const interactive = node.state !== 'locked'

            const Row = (
              <div className="flex items-center gap-4 py-2.5">
                {/* Node + rail */}
                <div className="relative flex flex-col items-center shrink-0" style={{ width: 52 }}>
                  <NodeBadge node={node} meta={meta} />
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{
                        top: 52, height: 'calc(100% - 32px)', bottom: -20,
                        width: connectorLit ? 3 : 0,
                        borderLeft: connectorLit ? 'none' : '2px dashed #E5E7EB',
                        background: connectorLit ? meta.fill : 'transparent',
                        borderRadius: 4,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold tracking-tight ${node.state === 'locked' ? 'text-text-faint' : 'text-text'}`}>
                      Day {node.day} Mission
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {node.pct != null
                        ? <>Scored <span className="font-semibold tabular" style={{ color: meta.ring }}>{node.pct}%</span></>
                        : node.state === 'current'
                          ? (node.live ? 'Open now · 6:00–8:00 AM' : 'Up next today')
                          : node.state === 'missed' ? 'No submission' : 'Unlocks on its day'}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: meta.chipBg, color: meta.chipText }}
                  >
                    {node.live ? 'Live' : meta.label}
                  </span>
                </div>
              </div>
            )

            // Reached/current nodes link to their exam day; locked/missed are static.
            return (
              <li key={node.day} className="relative">
                {interactive
                  ? <Link href={`/exam/${node.day}`} className="block rounded-xl -mx-2 px-2 hover:bg-surface-overlay transition-colors">{Row}</Link>
                  : <div className="-mx-2 px-2 opacity-90">{Row}</div>}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3.5 border-t border-border bg-surface-sunken flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text tabular">{masteredCount}</span> mastered
          {' · '}
          <span className="font-semibold text-text tabular">{nodes.length - done}</span> remaining
        </p>
        <Link href="/leaderboard" className="text-xs font-semibold text-primary">See rankings →</Link>
      </div>
    </section>
  )
}

// ── Node badge ────────────────────────────────────────────────────
function NodeBadge({ node, meta }: { node: MapNode; meta: typeof STATE_META[NodeState] }) {
  const base = 'relative flex items-center justify-center rounded-full shrink-0'
  const size = 52

  if (node.state === 'mastered' || node.state === 'completed') {
    return (
      <div className={base} style={{ width: size, height: size, background: meta.fill, boxShadow: `0 4px 12px ${meta.fill}33` }}>
        {node.state === 'mastered' && (
          <span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 4px ${meta.ring}22` }} />
        )}
        <CheckIcon />
      </div>
    )
  }
  if (node.state === 'weak') {
    return (
      <div className={base} style={{ width: size, height: size, background: '#FFFFFF', border: `2.5px solid ${meta.ring}` }}>
        <span className="text-lg font-bold" style={{ color: meta.ring }}>!</span>
      </div>
    )
  }
  if (node.state === 'current') {
    return (
      <div className={`${base} animate-pulse-glow`} style={{ width: size, height: size, background: '#FFFFFF', border: `3px solid ${meta.ring}` }}>
        {node.live ? <PlayIcon /> : <span className="text-xs font-bold tabular" style={{ color: meta.ring }}>{node.day}</span>}
      </div>
    )
  }
  if (node.state === 'missed') {
    return (
      <div className={base} style={{ width: size, height: size, background: '#FFFFFF', border: '2px solid #E5E7EB' }}>
        <span className="text-xs font-bold text-text-faint tabular">{node.day}</span>
      </div>
    )
  }
  // locked
  return (
    <div className={base} style={{ width: size, height: size, background: meta.fill, border: '2px solid #E5E7EB' }}>
      <LockIcon />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0284c7">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
