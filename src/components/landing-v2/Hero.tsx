'use client'

/**
 * Landing v2 — Hero.
 * Light, premium, mobile-first. Real product preview (dashboard mock built
 * from actual platform metrics) instead of abstract art. Countdown retained
 * from v1 — it is the strongest urgency device for a fixed-start batch.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Zap } from './icons'
import { Reveal } from './ui'
import { useLang } from './lang'
import PhoneDemo from './PhoneDemo'

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
  const { lang, t } = useLang()

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
              {t('Founder batch open — SSC · RRB · Banking · TN Govt 2026', 'Founder batch திறந்துள்ளது — SSC · RRB · வங்கி · TN அரசு 2026')}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1
              className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-6xl"
              style={{ letterSpacing: '-0.035em' }}
            >
              {lang === 'ta' ? (
                <>
                  <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
                    90% போட்டியாளர்களை
                  </span>{' '}
                  விட முன்னேறுங்கள்
                </>
              ) : (
                <>
                  Get ahead of{' '}
                  <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
                    90% of aspirants
                  </span>
                </>
              )}
            </h1>
          </Reveal>

          <Reveal delay={130}>
            <div className="mt-5">
              <span className="lv2-tagline text-lg sm:text-xl">{t('Winning is a Habit.', 'வெற்றி ஒரு பழக்கம்.')}</span>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg lg:mx-0">
              {t(
                'Most aspirants study hard and still miss the cut. You won\'t: one timed test every morning, AI coaching after every attempt, and a live rank that keeps you honest — for SSC, RRB, Banking & TN-Govt exams.',
                'பலர் கடினமாகப் படித்தும் தேர்வில் வெற்றி பெறுவதில்லை. நீங்கள் அப்படி இல்லை: தினமும் காலை ஒரு நேரக் கட்டுப்பாட்டுத் தேர்வு, ஒவ்வொரு முயற்சிக்குப் பிறகும் AI பயிற்சி, உங்களை நேர்மையாக வைத்திருக்கும் நேரடி தரவரிசை — SSC, RRB, வங்கி & TN அரசுத் தேர்வுகளுக்கு.',
              )}
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
                  {t('Start free — Day 1 on us', 'இலவசமாகத் தொடங்குங்கள் — முதல் நாள் இலவசம்')}
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
                {t('See how it works', 'எப்படி வேலை செய்கிறது?')}
              </a>
            </div>
            <p className="mt-3 text-center text-[12.5px] font-medium text-gray-600 lg:text-left">
              <span className="font-semibold text-amber-600">{t('Founder pricing', 'Founder விலை')}</span>
              {t(' — lock the lowest subscription rate before the timer below hits zero.', ' — கீழே உள்ள டைமர் பூஜ்ஜியமாகும் முன் மிகக் குறைந்த சந்தா விலையைப் பிடித்துக்கொள்ளுங்கள்.')}
            </p>
          </Reveal>

          <Reveal delay={320}>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-gray-600 lg:justify-start">
              {(lang === 'ta'
                ? ['எப்போது வேண்டுமானாலும் நிறுத்தலாம்', 'முதல் நாள் இலவசம்', 'English & தமிழ்']
                : ['Cancel anytime', 'Day 1 free', 'English & Tamil']
              ).map((chip) => (
                <li key={chip} className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" />
                  {chip}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Countdown */}
          <Reveal delay={400}>
            <div className="mt-9 inline-flex flex-col items-center gap-3 rounded-2xl border border-amber-200/80 bg-white px-6 py-4 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_8px_28px_rgba(245,158,11,0.12)] sm:flex-row sm:gap-5">
              <div className="text-center sm:text-left">
                <span className="flex items-center justify-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-amber-600 sm:justify-start">
                  <Zap size={14} /> {t('Founder offer ends in', 'Founder சலுகை முடிவடைய')}
                </span>
                <span className="mt-0.5 block text-[12px] font-medium text-gray-500">{t('Lock the founder rate before it goes up', 'Founder விலை உயரும் முன் அதைப் பிடித்துக்கொள்ளுங்கள்')}</span>
              </div>
              <div className="flex items-center gap-3">
                {(lang === 'ta'
                  ? ([['d', 'நாள்'], ['h', 'மணி'], ['m', 'நிமி'], ['s', 'வினா']] as const)
                  : ([['d', 'days'], ['h', 'hrs'], ['m', 'min'], ['s', 'sec']] as const)
                ).map(([k, tag], i) => (
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

        {/* ── Interactive product demo — the real app in a phone ── */}
        <Reveal delay={200} className="relative">
          <PhoneDemo />
        </Reveal>
      </div>
    </section>
  )
}
