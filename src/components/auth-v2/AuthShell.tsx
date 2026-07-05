/**
 * Auth v2 — shared two-panel shell (light premium design system).
 * Left brand panel (lg+) carries the value proposition; right side hosts
 * the form. Variants tune the panel content per page.
 */
import Link from 'next/link'
import Logo from '@/src/components/landing-v2/Logo'
import { Check } from '@/src/components/landing-v2/icons'
import type { ReactNode } from 'react'

const STATS: [string, string][] = [
  ['30 days', 'LDC / UDC programme'],
  ['100+', 'daily questions'],
  ['3×', 'score improvement'],
]

const REGISTER_POINTS = [
  'Daily structured study materials',
  'A timed exam every morning at 6 AM',
  'Live leaderboard — compete with your batch',
  'AI Mentor coaching after every exam',
  'Performance-linked refund guarantee',
]

function PanelContent({ variant }: { variant: 'login' | 'register' }) {
  if (variant === 'register') {
    return (
      <div>
        <p className="text-[12px] font-bold uppercase tracking-wider text-sky-600">What you get</p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900" style={{ letterSpacing: '-0.025em' }}>
          30 days.<br />Full mastery.
        </h2>
        <ul className="mt-7 space-y-3.5">
          {REGISTER_POINTS.map((t) => (
            <li key={t} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                <Check size={12} />
              </span>
              <span className="text-[14px] leading-relaxed text-gray-700">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-wider text-sky-600">LDC · UDC · SSC — 2026</p>
      <blockquote className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-gray-900" style={{ letterSpacing: '-0.025em' }}>
        “Discipline is the bridge between goals and accomplishment.”
      </blockquote>
      <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
        Every morning. Zero shortcuts. This is where champions are built.
      </p>
    </div>
  )
}

export default function AuthShell({ variant, children }: { variant: 'login' | 'register'; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FAFAF8] text-gray-900 antialiased" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
      {/* ── Brand panel ── */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-gray-200/70 p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(14,165,233,0.06), rgba(99,102,241,0.05)), radial-gradient(700px 420px at 20% 0%, rgba(14,165,233,0.10), transparent 60%)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{
          backgroundImage: 'linear-gradient(rgba(16,24,40,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,40,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 30% 20%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 30% 20%, black 30%, transparent 80%)',
        }} />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <Logo size={40} />
          <span>
            <span className="block text-lg font-bold tracking-tight text-gray-900">
              Centu<span className="text-sky-600">Mania</span>
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Winning is a habit</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-sm">
          <PanelContent variant={variant} />
          <div className="mt-9 flex gap-8">
            {STATS.map(([n, l]) => (
              <div key={l}>
                <div className="text-xl font-extrabold tracking-tight text-sky-600">{n}</div>
                <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[12px] text-gray-500">Tamil Nadu & Puducherry government exam preparation · 2026</p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-800"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to home
            </Link>
            {/* Mobile brand */}
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Logo size={30} />
              <span className="text-[15px] font-bold tracking-tight text-gray-900">
                Centu<span className="text-sky-600">Mania</span>
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
