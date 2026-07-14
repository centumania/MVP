/**
 * Dashboard v2 — Today's Study hero.
 * The single most important card on the dashboard: tells the student exactly
 * what today's topic is, what to study, and where to continue from.
 * Ink-navy visual language mirrors the study modules' Centum card, so the
 * dashboard and the material feel like one product.
 * Pure presentational — progress arrives via props from /api/study/progress.
 */
import Link from 'next/link'
import { ArrowRight } from '@/src/components/landing-v2/icons'

export type TodayStudyMaterial = {
  id: string
  title: string
  subject?: string
  href: string
  nodesCompleted: number
  totalNodes: number | null
  accuracyPct: number
  xp: number
}

export type TodayStudyData = {
  day: number
  materials: TodayStudyMaterial[]
} | null

const INK = '#1A1A2E'

function isComplete(m: TodayStudyMaterial): boolean {
  return m.totalNodes != null && m.totalNodes > 0 && m.nodesCompleted >= m.totalNodes
}

function pctOf(m: TodayStudyMaterial): number {
  if (!m.totalNodes) return 0
  return Math.min(100, Math.round((m.nodesCompleted / m.totalNodes) * 100))
}

export function TodayStudy({ data }: { data: TodayStudyData }) {
  if (!data || data.materials.length === 0) return null

  const primary   = data.materials.find(m => !isComplete(m)) ?? data.materials[0]
  const others    = data.materials.filter(m => m.id !== primary.id)
  const started   = primary.nodesCompleted > 0
  const allDone   = data.materials.every(isComplete)
  const pct       = pctOf(primary)

  const cta = allDone ? 'Revise today’s material' : started ? 'Continue studying' : 'Begin today’s path'

  return (
    <section className="relative overflow-hidden rounded-2xl p-5 text-white sm:p-6"
      style={{ background: INK, boxShadow: '0 16px 40px -12px rgba(26,26,46,0.45)' }}>
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(480px 220px at 90% -30%, rgba(165,180,252,0.14), transparent 60%), radial-gradient(300px 160px at -10% 110%, rgba(34,211,238,0.08), transparent 60%)' }} />

      <div className="relative">
        {/* header row */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase" style={{ color: '#A5B4FC', letterSpacing: '0.2em' }}>
            Today&apos;s study · Day {String(data.day).padStart(2, '0')}
          </p>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-white/40">Tracking live</span>
          </span>
        </div>

        {/* primary recommendation */}
        {primary.subject && (
          <p className="mt-4 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-amber-400/90">{primary.subject}</p>
        )}
        <h2 className="mt-1 text-[21px] font-extrabold leading-snug tracking-tight sm:text-[23px]">
          {primary.title}
        </h2>

        {/* progress */}
        <div className="mt-4 max-w-md">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#4ADE80,#22D3EE)' }} />
          </div>
          <p className="mt-2 text-[12px] font-semibold tabular-nums text-white/55">
            {primary.totalNodes
              ? <>{primary.nodesCompleted}/{primary.totalNodes} nodes cleared</>
              : <>{primary.nodesCompleted} nodes cleared</>}
            {primary.nodesCompleted > 0 && <> · {primary.accuracyPct}% first-attempt accuracy · {primary.xp} XP</>}
            {primary.nodesCompleted === 0 && <> · fresh start — your first attempts count from question one</>}
          </p>
        </div>

        {/* CTA row */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link href={primary.href}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5"
            style={{ color: INK }}>
            {cta}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="text-[11px] font-medium leading-snug text-white/40">
            Every first attempt is recorded once, forever —<br className="hidden sm:block" /> it builds your Centum Index.
          </p>
        </div>

        {/* up next */}
        {others.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-2 text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white/35">Also today</p>
            <div className="space-y-1">
              {others.map(m => {
                const done = isComplete(m)
                return (
                  <Link key={m.id} href={m.href}
                    className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold"
                      style={done
                        ? { background: 'rgba(74,222,128,0.16)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.35)' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {done ? '✓' : `${pctOf(m)}%`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-white/85">{m.title}</span>
                      <span className="block text-[11px] tabular-nums text-white/40">
                        {m.totalNodes ? `${m.nodesCompleted}/${m.totalNodes} nodes` : 'not started'}
                        {m.nodesCompleted > 0 && ` · FAA ${m.accuracyPct}%`}
                      </span>
                    </span>
                    <ArrowRight size={13} className="shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-white/60" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
