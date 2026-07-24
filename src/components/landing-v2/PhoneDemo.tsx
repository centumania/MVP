'use client'

/**
 * Landing v2 — interactive phone demo of the real product.
 *
 * Replaces the single-lesson demo in the hero with a sandboxed, phone-framed
 * walkthrough of the actual app surfaces — Dashboard, Classroom, Daily Test —
 * so a first-time visitor *feels* the subscription before paying (Hormozi:
 * demonstrate the dream outcome). Everything is mock data and self-contained:
 * tabs switch inside the frame, nothing links out, nothing deeper is reachable.
 * Bilingual via useLang.
 */
import { useState } from 'react'
import { BarChart, BookOpen, Flame, Timer, Trophy } from './icons'
import { useLang } from './lang'

type Tab = 'dashboard' | 'classroom' | 'test'

const RING = (pct: number) => {
  const r = 26, c = 2 * Math.PI * r
  return { r, c, offset: c - (pct / 100) * c }
}

export default function PhoneDemo() {
  const { lang, t } = useLang()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [picked, setPicked] = useState<number | null>(null)

  const ring = RING(87)

  const NAV: { id: Tab; label: string; icon: typeof BarChart }[] = [
    { id: 'dashboard', label: t('Home', 'முகப்பு'),    icon: BarChart },
    { id: 'classroom', label: t('Classroom', 'வகுப்பு'), icon: BookOpen },
    { id: 'test',      label: t('Test', 'தேர்வு'),      icon: Timer },
  ]

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* caption */}
      <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-gray-400">
        {t('Your whole prep — in your pocket', 'உங்கள் முழுத் தயாரிப்பும் — உங்கள் கையில்')}
      </p>

      {/* glow */}
      <div aria-hidden className="pointer-events-none absolute -inset-6 top-6 rounded-[48px] bg-gradient-to-br from-sky-200/60 via-transparent to-indigo-200/50 blur-2xl" />

      {/* phone bezel */}
      <div className="relative mx-auto w-[288px] rounded-[46px] bg-gray-900 p-2.5 shadow-[0_1px_3px_rgba(16,24,40,0.1),0_30px_60px_-18px_rgba(16,24,40,0.4)]">
        {/* screen */}
        <div className="relative flex h-[560px] flex-col overflow-hidden rounded-[38px] bg-[#FAFAF8]">
          {/* status bar + notch */}
          <div className="relative flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-gray-900">
            <span>9:41</span>
            <span className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-gray-900" />
            <span className="flex items-center gap-1 text-gray-500">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-gray-900/80" />
              <span className="inline-block h-2.5 w-4 rounded-[3px] border border-gray-900/60" />
            </span>
          </div>

          {/* app header */}
          <div className="flex items-center justify-between px-4 pb-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-[11px] font-extrabold text-white">C</span>
              <span className="text-[13px] font-extrabold tracking-tight text-gray-900">CentuMania</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200/70">
              <Flame size={11} /> 12
            </span>
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto px-3.5 pb-2">
            {tab === 'dashboard' && (
              <div className="flex flex-col gap-2.5">
                <p className="mt-1 text-[15px] font-extrabold tracking-tight text-gray-900">{t('Good morning, Prasanna', 'காலை வணக்கம், Prasanna')}</p>
                {/* Centum hero */}
                <div className="flex items-center gap-3 rounded-2xl p-3.5 text-white" style={{ background: 'linear-gradient(150deg,#1A1A2E 0%,#312e81 100%)' }}>
                  <svg width="66" height="66" viewBox="0 0 66 66" className="shrink-0">
                    <circle cx="33" cy="33" r={ring.r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                    <circle cx="33" cy="33" r={ring.r} fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={ring.c} strokeDashoffset={ring.offset} transform="rotate(-90 33 33)" />
                    <text x="33" y="37" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">87</text>
                  </svg>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#A5B4FC' }}>{t('Centum Index', 'Centum Index')}</p>
                    <p className="text-[19px] font-extrabold leading-tight">87.4 <span className="text-[11px] font-bold text-emerald-300">▲ 4.2</span></p>
                    <p className="text-[10px] text-white/70">{t('Top 6% of your batch', 'உங்கள் batch-இல் முதல் 6%')}</p>
                  </div>
                </div>
                {/* today's study */}
                <div className="rounded-2xl border border-gray-200/70 bg-white p-3">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600">{t('Today · Ancient History', 'இன்று · பண்டைய வரலாறு')}</p>
                  <p className="text-[13px] font-bold text-gray-900">{t('Buddhism & Jainism', 'புத்தமும் சமணமும்')}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '60%' }} />
                  </div>
                </div>
                {/* stats */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[[t('Tests', 'தேர்வு'), '18'], [t('Acc.', 'துல்.'), '78%'], [t('Rank', 'தரம்'), '#14'], [t('Subj', 'பாடம்'), '8']].map(([l, v]) => (
                    <div key={l} className="rounded-xl border border-gray-200/70 bg-white px-1 py-2 text-center">
                      <p className="text-[13px] font-extrabold text-gray-900">{v}</p>
                      <p className="text-[9px] text-gray-500">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'classroom' && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-[15px] font-extrabold tracking-tight text-gray-900">{t('Classroom', 'வகுப்பறை')}</p>
                {([
                  [t('Ancient History', 'பண்டைய வரலாறு'), 72, '#E67E22'],
                  [t('Geography', 'புவியியல்'), 45, '#3DD68C'],
                  [t('Polity', 'அரசியலமைப்பு'), 30, '#A855F7'],
                  [t('English', 'ஆங்கிலம்'), 88, '#0284c7'],
                  [t('Reasoning', 'Reasoning'), 55, '#6366F1'],
                  [t('Economy', 'பொருளியல்'), 20, '#10B981'],
                ] as const).map(([name, pct, color]) => (
                  <div key={name} className="rounded-xl border border-gray-200/70 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-gray-900">{name}</span>
                      <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'test' && (
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">{t('AI Daily Test', 'AI தினசரி தேர்வு')}</span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-bold tabular-nums text-gray-900"><Timer size={12} /> 24:37</span>
                </div>
                <div className="rounded-2xl border border-gray-200/70 bg-white p-3">
                  <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600">{t('History', 'வரலாறு')}</span>
                  <p className="mt-2 text-[13px] font-bold leading-snug text-gray-900">
                    {t('The Harappan port site of Lothal is in which present-day state?', 'ஹரப்பன் துறைமுகமான லோதல் இன்றைய எந்த மாநிலத்தில் உள்ளது?')}
                  </p>
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {[t('Gujarat', 'குஜராத்'), t('Punjab', 'பஞ்சாப்'), t('Rajasthan', 'ராஜஸ்தான்'), t('Haryana', 'ஹரியானா')].map((opt, i) => {
                      const isPick = picked === i
                      const isRight = i === 0 && picked !== null
                      const isWrong = isPick && i !== 0
                      return (
                        <button key={opt} type="button" onClick={() => setPicked(i)}
                          className="flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left transition-colors"
                          style={{
                            borderColor: isRight ? '#22C55E' : isWrong ? '#F59E0B' : isPick ? '#0284c7' : 'transparent',
                            background: isRight ? '#F0FDF4' : isWrong ? '#FFFBEB' : isPick ? '#F0F9FF' : '#F3F4F6',
                          }}>
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold"
                            style={{ background: isRight ? '#22C55E' : isPick ? '#0284c7' : '#E5E7EB', color: isPick || isRight ? '#fff' : '#6B7280' }}>
                            {['A', 'B', 'C', 'D'][i]}
                          </span>
                          <span className="text-[12px] text-gray-900">{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                  {picked !== null && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10.5px] leading-snug text-emerald-800">
                      {picked === 0
                        ? t('Correct! Lothal is in Gujarat — a Harappan dockyard town.', 'சரி! லோதல் குஜராத்தில் — ஹரப்பன் கப்பல்துறை நகரம்.')
                        : t('Not quite — it\'s Gujarat. Every first attempt is scored once, forever.', 'இல்லை — குஜராத். ஒவ்வொரு முதல் முயற்சியும் ஒருமுறை பதிவாகும்.')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* bottom nav */}
          <div className="flex items-center justify-around border-t border-gray-200/80 bg-white/90 px-2 py-2 backdrop-blur-sm">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className="flex flex-1 flex-col items-center gap-0.5 py-0.5">
                  <Icon size={18} className={active ? 'text-sky-600' : 'text-gray-400'} />
                  <span className={`text-[9.5px] font-bold ${active ? 'text-sky-600' : 'text-gray-400'}`}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* tap hint */}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-medium text-gray-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
        </span>
        {t('Live preview — tap the tabs to explore', 'நேரடி முன்னோட்டம் — tab-களைத் தட்டி பாருங்கள்')}
      </p>
    </div>
  )
}
