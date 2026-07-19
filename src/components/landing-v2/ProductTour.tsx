'use client'

// "The experience inside" — shows a visitor the real post-payment product:
// the daily dashboard (built mock, always looks full) + the classroom (screenshot).
// Bilingual (EN/தமிழ்) via useLang.
import type { ReactNode } from 'react'
import { Reveal } from './ui'
import { useLang } from './lang'

function BrowserChrome({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.07),0_28px_56px_-20px_rgba(16,24,40,0.18)]">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-gray-400 ring-1 ring-gray-200">{url}</span>
      </div>
      {children}
    </div>
  )
}

function DashboardMock() {
  const { lang, t } = useLang()
  const spark = [40, 52, 48, 60, 58, 70, 66, 78, 74, 87]
  const stats: [string, string][] = lang === 'ta'
    ? [['எழுதிய தேர்வுகள்', '18'], ['துல்லியம்', '78%'], ['Batch தரவரிசை', '#14'], ['பாடங்கள்', '8']]
    : [['Tests taken', '18'], ['Accuracy', '78%'], ['Batch rank', '#14'], ['Subjects', '8']]
  return (
    <div className="bg-[#FAFAF8] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-extrabold text-gray-900">{t('Good morning, Prasanna 👋', 'காலை வணக்கம், Prasanna 👋')}</p>
          <p className="text-[12px] text-gray-500">{t('Keep the streak alive — today\'s test unlocks at 6:00 AM', 'தொடர்ச்சியைக் காப்பாற்றுங்கள் — இன்றைய தேர்வு காலை 6:00-க்குத் திறக்கும்')}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200/70">{t('🔥 12-day streak', '🔥 12-நாள் தொடர்ச்சி')}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.35fr_1fr]">
        {/* Centum Index hero */}
        <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(150deg,#1A1A2E 0%,#312e81 100%)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#A5B4FC' }}>{t('Your Centum Index', 'உங்கள் Centum Index')}</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[42px] font-extrabold leading-none tabular-nums">87.4</span>
            <span className="mb-1.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">{t('▲ +4.2 this week', '▲ இந்த வாரம் +4.2')}</span>
          </div>
          <p className="mt-2 text-[12px] leading-snug text-white/70">{t('Top 6% of your batch · first-attempt accuracy, locked forever', 'உங்கள் batch-இல் முதல் 6% · முதல்-முயற்சித் துல்லியம், நிரந்தரப் பதிவு')}</p>
          <div className="mt-3 flex h-10 items-end gap-1">
            {spark.map((h, i) => (
              <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === spark.length - 1 ? '#34d399' : 'rgba(165,180,252,0.5)' }} />
            ))}
          </div>
        </div>
        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(([l, v]) => (
            <div key={l} className="rounded-xl border border-gray-200/70 bg-white p-3">
              <p className="text-[11px] font-semibold text-gray-500">{l}</p>
              <p className="mt-0.5 text-[22px] font-extrabold tabular-nums text-gray-900">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's study */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-gray-200/70 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: '#F4F3F0' }}>🏛️</span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">{t('Today · Ancient History', 'இன்று · பண்டைய வரலாறு')}</p>
            <p className="text-[14px] font-bold text-gray-900">{t('Buddhism & Jainism', 'புத்தமும் சமணமும்')}</p>
            <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-gray-100 sm:w-44">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: '#1A1A2E' }}>{t('Continue →', 'தொடரவும் →')}</span>
      </div>
    </div>
  )
}

export default function ProductTour() {
  const { t } = useLang()
  return (
    <section id="inside" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-600">{t('The experience inside', 'உள்ளே இருக்கும் அனுபவம்')}</p>
            <h2 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight text-gray-900 sm:text-[36px]">
              {t('See exactly what you get after you join', 'சேர்ந்த பிறகு என்ன கிடைக்கும் என்று நேரடியாகப் பாருங்கள்')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-gray-600">
              {t(
                'No mystery, no wall. This is the real dashboard and classroom every paid student uses every day.',
                'மர்மம் இல்லை, மறைப்பு இல்லை. ஒவ்வொரு மாணவரும் தினமும் பயன்படுத்தும் உண்மையான dashboard மற்றும் classroom இதுதான்.',
              )}
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10">
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-gray-500">{t('1 · Your daily dashboard', '1 · உங்கள் தினசரி dashboard')}</p>
            <BrowserChrome url="centumania.co.in/dashboard"><DashboardMock /></BrowserChrome>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-10">
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-gray-500">{t('2 · A classroom for every subject', '2 · ஒவ்வொரு பாடத்திற்கும் ஒரு classroom')}</p>
            <BrowserChrome url="centumania.co.in/classroom">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/classroom-preview.png" alt="CentuMania classroom — eight subject courses, video + explanation per topic" className="block w-full" loading="lazy" />
            </BrowserChrome>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
