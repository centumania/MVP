'use client'

/**
 * Landing v2 — Hero.
 * Light, premium, mobile-first. Real product preview (dashboard mock built
 * from actual platform metrics) instead of abstract art. Countdown retained
 * from v1 — it is the strongest urgency device for a fixed-start batch.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Sparkles, Zap } from './icons'
import { Reveal } from './ui'

// Founder-offer HARD deadline (IST). This is a real, fixed date — the countdown
// genuinely ticks down to it and stops at 00 once it passes.
// 👉 To extend/shorten the offer, edit ONLY this one line.
const FOUNDER_DEADLINE = new Date('2026-07-20T23:59:59+05:30')

function useCountdown() {
  const [cd, setCd] = useState({ d: '--', h: '--', m: '--', s: '--' })
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, +FOUNDER_DEADLINE - Date.now())
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

export default function Hero() {
  const cd = useCountdown()
  const [showDemo, setShowDemo] = useState(false)

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
              Founder batch open — SSC · RRB · Banking · TN Govt 2026
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1
              className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-6xl"
              style={{ letterSpacing: '-0.035em' }}
            >
              Get ahead of{' '}
              <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
                90% of aspirants
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
              Most aspirants study hard and still miss the cut. You won&apos;t: one timed test every
              morning, AI coaching after every attempt, and a live rank that keeps you honest —
              for SSC, RRB, Banking &amp; TN-Govt exams.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              {/* Primary CTA — high-urgency: pulsing aura, gradient, value in the label */}
              <div className="relative w-full sm:w-auto">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 animate-pulse rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 opacity-40 blur-lg"
                />
                <Link
                  href="/auth/register"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-[16px] font-bold text-white shadow-[0_6px_20px_rgba(2,132,199,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(2,132,199,0.55)] sm:w-auto"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  Start now — lock in ₹999
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
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
            <p className="mt-3 text-center text-[12.5px] font-medium text-gray-600 lg:text-left">
              <span className="font-semibold text-amber-600">Founder pricing</span> — the ₹999 rate ends the moment the timer below hits zero.
            </p>
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

        {/* ── Knowledge-universe column (live 3D neural map) ── */}
        <Reveal delay={200} className="relative">
          <div aria-hidden className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-sky-100/80 via-transparent to-indigo-100/60 blur-2xl" />

          <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-[0_1px_3px_rgba(16,24,40,0.07),0_24px_48px_-12px_rgba(16,24,40,0.12)] backdrop-blur-sm sm:p-5">
            {/* Header */}
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Sparkles size={15} />
                </span>
                <div>
                  <div className="text-[13px] font-bold tracking-tight text-gray-900">Try a real lesson — free</div>
                  <div className="text-[11px] font-medium text-gray-500">Buddhism &amp; Jainism · no signup</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200/70">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>

            {/* Interactive live demo — click-to-load keeps the landing fast */}
            <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-gray-200/70 sm:h-[360px]"
              style={{ background: 'linear-gradient(150deg, #0f172a 0%, #1e1b4b 100%)' }}>
              {showDemo ? (
                <iframe src="/demo/buddhism-jainism.html" title="Sample lesson — Buddhism & Jainism"
                  className="block h-full w-full" style={{ border: 0 }} />
              ) : (
                <button type="button" onClick={() => setShowDemo(true)}
                  className="group flex h-full w-full flex-col items-center justify-center gap-2.5 px-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0284c7"><polygon points="8 5 19 12 8 19 8 5" /></svg>
                  </span>
                  <span className="text-[14.5px] font-bold text-white">Play the live lesson</span>
                  <span className="max-w-[16rem] text-[11.5px] leading-relaxed text-white/70">Flashcards, an interactive map &amp; scored MCQs — running right here, no signup.</span>
                </button>
              )}
            </div>

            <Link href="/demo"
              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-[13px] font-bold text-gray-800 transition-colors hover:bg-gray-50">
              Open the full lesson <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
