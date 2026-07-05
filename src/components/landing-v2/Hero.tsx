'use client'

/**
 * Landing v2 — Hero.
 * Light, premium, mobile-first. Real product preview (dashboard mock built
 * from actual platform metrics) instead of abstract art. Countdown retained
 * from v1 — it is the strongest urgency device for a fixed-start batch.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Flame, ShieldCheck, Sparkles, Timer, TrendingUp, Zap } from './icons'
import { Reveal } from './ui'

function useCountdown() {
  const [cd, setCd] = useState({ d: '--', h: '--', m: '--', s: '--' })
  useEffect(() => {
    function tick() {
      const now = new Date()
      // Founder offer deadline: end of day, 2 days from now
      const t = new Date()
      t.setDate(t.getDate() + 2)
      t.setHours(23, 59, 59, 0)
      const diff = Math.max(0, +t - +now)
      const pad = (n: number) => String(n).padStart(2, '0')
      setCd({
        d: pad(Math.floor(diff / 864e5)),
        h: pad(Math.floor((diff % 864e5) / 36e5)),
        m: pad(Math.floor((diff % 36e5) / 6e4)),
        s: pad(Math.floor((diff % 6e4) / 1e3)),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return cd
}

const SUBJECT_BARS = [
  { label: 'Tamil', pct: 85, color: '#0ea5e9' },
  { label: 'General Studies', pct: 78, color: '#6366f1' },
  { label: 'Aptitude', pct: 64, color: '#f59e0b' },
]

export default function Hero() {
  const cd = useCountdown()

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
      {/* Ambient background — soft, no neon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 520px at 50% -12%, rgba(14,165,233,0.09), transparent 62%), radial-gradient(720px 420px at 88% 22%, rgba(99,102,241,0.07), transparent 55%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.4]" style={{
        backgroundImage: 'linear-gradient(rgba(16,24,40,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,40,0.028) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 30%, transparent 75%)',
      }} />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* ── Copy column ── */}
        <div className="text-center lg:text-left">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Founder batches open — LDC · UDC · SSC 2026
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1
              className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-6xl"
              style={{ letterSpacing: '-0.035em' }}
            >
              Crack your government exam with{' '}
              <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
                daily discipline
              </span>
            </h1>
          </Reveal>

          <Reveal delay={130}>
            <div className="mt-5">
              <span className="lv2-tagline text-lg sm:text-xl">Winning is a Habit.</span>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg lg:mx-0">
              A 30-day intensive programme for LDC / UDC aspirants. One timed exam every morning,
              AI-powered coaching after every test, and a live rank that keeps you honest.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/auth/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-[0_8px_24px_rgba(2,132,199,0.4)] sm:w-auto"
              >
                Start the programme
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById('features')
                  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: 'smooth' })
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
              >
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-gray-600 lg:justify-start">
              {['Performance-linked refund', 'Day 1 free preview', 'English & Tamil'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Countdown */}
          <Reveal delay={400}>
            <div className="mt-9 inline-flex flex-col items-center gap-3 rounded-2xl border border-amber-200/80 bg-white px-6 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_8px_28px_rgba(245,158,11,0.12)] sm:flex-row sm:gap-5">
              <div className="text-center sm:text-left">
                <span className="flex items-center justify-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-amber-600 sm:justify-start">
                  <Zap size={14} /> Founder offer ends in
                </span>
                <span className="mt-0.5 block text-[12px] font-medium text-gray-500">Lock in ₹999 before the price goes up</span>
              </div>
              <div className="flex items-center gap-3">
                {([['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']] as const).map(([k, tag], i) => (
                  <div key={k} className="flex items-center gap-3">
                    {i > 0 && <span className="text-lg font-bold text-gray-300">:</span>}
                    <div className="text-center">
                      <div className="min-w-[2.2rem] text-2xl font-bold tabular-nums tracking-tight text-gray-900">{cd[k]}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Product preview column ── */}
        <Reveal delay={200} className="relative">
          <div aria-hidden className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-sky-100/80 via-transparent to-indigo-100/60 blur-2xl" />

          {/* Main dashboard card */}
          <div className="relative mx-auto max-w-md rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.07),0_24px_48px_-12px_rgba(16,24,40,0.12)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-gray-500">Good morning, Aspirant</div>
                <div className="text-lg font-bold tracking-tight text-gray-900">Day 14 of 30</div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[13px] font-semibold text-orange-600 ring-1 ring-orange-200/70">
                <Flame size={14} /> 14-day streak
              </span>
            </div>

            {/* Today's exam */}
            <div className="mt-4 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 p-4 text-white shadow-[0_8px_20px_rgba(2,132,199,0.28)]">
              <div className="flex items-center justify-between text-[12px] font-medium text-sky-100">
                <span className="inline-flex items-center gap-1.5"><Timer size={13} /> Today&apos;s exam · 6:00–8:30 AM</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5">Live</span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-[26px] font-bold leading-none tabular-nums tracking-tight">01:24:37</div>
                  <div className="mt-1 text-[12px] text-sky-100">window closes soon</div>
                </div>
                <span className="rounded-lg bg-white px-3.5 py-2 text-[13px] font-bold text-sky-700">Start now</span>
              </div>
            </div>

            {/* Subject accuracy */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Subject accuracy</span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600"><TrendingUp size={13} /> +18% this week</span>
                </div>
                {SUBJECT_BARS.map((s) => (
                  <div key={s.label} className="mb-2 flex items-center gap-3 last:mb-0">
                    <span className="w-28 shrink-0 text-[12px] font-medium text-gray-600">{s.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200/80">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                    <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-gray-700">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row: rank + centum */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Batch rank</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-gray-900">#12</div>
                <div className="text-[12px] font-medium text-emerald-600">↑ from #47 on Day 1</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">Centum Index</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-gray-900">87<span className="text-sm font-semibold text-gray-500">/100</span></div>
                <div className="text-[12px] font-medium text-sky-600">Silver refund tier</div>
              </div>
            </div>
          </div>

          {/* Floating AI mentor chip */}
          <div className="absolute -bottom-5 left-1/2 w-[88%] max-w-sm -translate-x-1/2 rounded-xl border border-gray-200/80 bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(16,24,40,0.14)] sm:-bottom-12 sm:-left-6 sm:w-72 sm:translate-x-0" style={{ backdropFilter: 'blur(8px)' }}>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles size={15} />
              </span>
              <div>
                <div className="text-[12px] font-bold text-gray-900">AI Mentor report ready</div>
                <p className="mt-0.5 text-[12px] leading-snug text-gray-600">
                  &ldquo;Aptitude accuracy is your gap — revise percentages before tomorrow&apos;s test.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Floating refund chip */}
          <div className="absolute -top-4 right-1 hidden items-center gap-2 rounded-xl border border-emerald-200/80 bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(16,24,40,0.1)] sm:flex">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="text-[12px] font-bold text-gray-800">Refund guarantee active</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
