/**
 * Dashboard v2 — shared primitives for the light design system.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'

export function Card({ children, className = '', noPadding = false }: {
  children: ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
        noPadding ? '' : 'p-5'
      } ${className}`}
    >
      {children}
    </section>
  )
}

export function CardLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[11.5px] font-bold uppercase tracking-wider text-gray-400 ${className}`}>{children}</h2>
  )
}

export function StatTile({ href, label, value, sub }: {
  href: string
  label: string
  value: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200/70 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_8px_20px_-6px_rgba(2,132,199,0.18)]"
    >
      <p className="text-xl font-bold tabular-nums leading-none tracking-tight text-gray-900">{value}</p>
      <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-[11.5px] font-medium text-sky-600">{sub}</p>
    </Link>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading dashboard" role="status">
      <div className="h-16 w-2/3 rounded-2xl bg-gray-200/60" />
      <div className="h-36 rounded-2xl bg-gray-200/60" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-200/60" />)}
      </div>
      <div className="h-48 rounded-2xl bg-gray-200/60" />
      <div className="h-40 rounded-2xl bg-gray-200/60" />
    </div>
  )
}

/** Score → colour, mirroring v1 semantics (no red near exam results). */
export function scoreColor(pct: number): string {
  if (pct >= 80) return '#10b981' // emerald-500
  if (pct >= 60) return '#0284c7' // sky-600
  if (pct >= 40) return '#f59e0b' // amber-500
  return '#9ca3af'                // gray-400 — neutral, never alarming
}
