'use client'

/**
 * Landing v2 — interactive phone demo, a faithful replica of the real product.
 *
 * Mirrors the actual /dashboard (DashboardView): the ink-navy Today's Study
 * hero, the "no exam / AI revision test" cards and the Rank/Score/Streak/
 * Accuracy stat tiles — plus Modules (study material), Classroom and Daily Test.
 * Everything inside is reachable; nothing links out of the frame. Mock data,
 * self-contained. Bilingual via useLang.
 */
import { useState } from 'react'
import { ArrowRight, BarChart, BookOpen, Brain, Flame, Timer, Users } from './icons'
import { useLang } from './lang'

type Tab = 'home' | 'modules' | 'classroom' | 'test'

const INK = '#1A1A2E'

export default function PhoneDemo() {
  const { lang, t } = useLang()
  const [tab, setTab] = useState<Tab>('home')
  const [picked, setPicked] = useState<number | null>(null)

  const NAV: { id: Tab; label: string; icon: typeof BarChart }[] = [
    { id: 'home',      label: t('Dashboard', 'முகப்பு'),  icon: BarChart },
    { id: 'modules',   label: t('Modules', 'பாடங்கள்'),   icon: BookOpen },
    { id: 'classroom', label: t('Classroom', 'வகுப்பு'),  icon: Users },
    { id: 'test',      label: t('Test', 'தேர்வு'),        icon: Timer },
  ]

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-gray-400">
        {t('Your whole prep — in your pocket', 'உங்கள் முழுத் தயாரிப்பும் — உங்கள் கையில்')}
      </p>

      <div aria-hidden className="pointer-events-none absolute -inset-6 top-6 rounded-[48px] bg-gradient-to-br from-sky-200/60 via-transparent to-indigo-200/50 blur-2xl" />

      {/* phone bezel */}
      <div className="relative mx-auto w-[288px] rounded-[46px] bg-gray-900 p-2.5 shadow-[0_1px_3px_rgba(16,24,40,0.1),0_30px_60px_-18px_rgba(16,24,40,0.4)]">
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
              <span className="text-[13px] font-extrabold tracking-tight text-gray-900">Centu<span className="text-sky-600">Mania</span></span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200/70">
              <Flame size={11} /> 12
            </span>
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto px-3.5 pb-2">

            {tab === 'home' && (
              <div className="flex flex-col gap-2.5">
                {/* greeting */}
                <div className="flex items-end justify-between pt-0.5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{t('Good morning', 'காலை வணக்கம்')}</p>
                    <p className="text-[19px] font-extrabold leading-none tracking-tight text-gray-900">Prasanna</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-sky-700 ring-1 ring-sky-200/60">{t('Day 20 of 30', 'நாள் 20 / 30')}</span>
                </div>

                {/* Today's Study hero — ink navy, exactly like the app */}
                <div className="relative overflow-hidden rounded-2xl p-3.5 text-white" style={{ background: INK, boxShadow: '0 16px 40px -12px rgba(26,26,46,0.45)' }}>
                  <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(240px 120px at 90% -30%, rgba(165,180,252,0.16), transparent 60%)' }} />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="text-[8.5px] font-extrabold uppercase" style={{ color: '#A5B4FC', letterSpacing: '0.18em' }}>{t("Today's study · Day 20", 'இன்றைய படிப்பு · நாள் 20')}</p>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">{t('Tracking live', 'நேரடி கண்காணிப்பு')}</span>
                      </span>
                    </div>
                    <p className="mt-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-400/90">{t('General Studies', 'பொது அறிவு')}</p>
                    <h2 className="mt-0.5 text-[15px] font-extrabold leading-snug tracking-tight">{t('Daily Test Engine — GS Weighted', 'தினசரி தேர்வு இயந்திரம் — GS')}</h2>
                    <div className="mt-2.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: '20%', background: 'linear-gradient(90deg,#4ADE80,#22D3EE)' }} />
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold tabular-nums text-white/55">{t('1/30 nodes cleared · 0% first-attempt · 10 XP', '1/30 முடிந்தது · 0% முதல்-முயற்சி · 10 XP')}</p>
                    </div>
                    <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12px] font-bold" style={{ color: INK }}>
                      {t('Continue studying', 'தொடர்ந்து படியுங்கள்')} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* No exam card */}
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400"><Timer size={16} /></span>
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">{t('No exam scheduled today', 'இன்று தேர்வு இல்லை')}</p>
                    <p className="text-[10.5px] text-gray-500">{t('Use the time to revise.', 'திருப்பிப் படிக்கப் பயன்படுத்துங்கள்.')}</p>
                  </div>
                </div>

                {/* AI Daily Revision Test */}
                <div className="flex items-center gap-3 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 to-white p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Brain size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-gray-900">{t('AI Daily Revision Test', 'AI தினசரி தேர்வு')}<span className="rounded bg-indigo-100 px-1 py-0.5 text-[8px] font-extrabold uppercase text-indigo-700">AI</span></p>
                    <p className="truncate text-[10px] text-gray-500">{t('From your weak topics · nightly', 'உங்கள் பலவீன தலைப்புகளிலிருந்து')}</p>
                  </div>
                  <button type="button" onClick={() => setTab('test')} className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white">{t('Take', 'எழுது')}</button>
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['12d', t('Streak', 'தொடர்'), t('keep it alive', 'தொடருங்கள்')],
                    ['#14', t('Rank', 'தரம்'), t('top 6%', 'முதல் 6%')],
                    ['87.4', t('Centum', 'Centum'), t('▲ this week', '▲ இந்த வாரம்')],
                    ['78%', t('Accuracy', 'துல்லியம்'), t('avg accuracy', 'சராசரி')],
                  ] as const).map(([v, l, s]) => (
                    <div key={l} className="rounded-xl border border-gray-200/70 bg-white px-3 py-2.5">
                      <p className="text-[16px] font-bold leading-none tabular-nums tracking-tight text-gray-900">{v}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">{l}</p>
                      <p className="text-[10px] font-medium text-sky-600">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'modules' && (
              <div className="flex flex-col gap-2 pt-0.5">
                <p className="text-[15px] font-extrabold tracking-tight text-gray-900">{t('Study modules', 'படிப்பு பாடங்கள்')}</p>
                <p className="-mt-1 text-[10px] text-gray-500">{t('Interactive maps, flashcards & scored MCQs', 'ஊடாடும் வரைபடங்கள், ஃபிளாஷ்கார்டுகள் & MCQ')}</p>
                {([
                  ['🏛️', t('Harappan Civilisation', 'ஹரப்பன் நாகரிகம்'), t('Ancient History', 'பண்டைய வரலாறு'), 72],
                  ['🗺️', t('Indian Geography', 'இந்திய புவியியல்'), t('Geography', 'புவியியல்'), 45],
                  ['⚖️', t('The Constitution', 'அரசியலமைப்பு'), t('Polity', 'அரசியல்'), 30],
                  ['🔤', t('Articles & Tenses', 'Articles & Tenses'), t('English', 'ஆங்கிலம்'), 88],
                  ['🧮', t('Number System', 'எண் அமைப்பு'), t('Aptitude', 'Aptitude'), 60],
                ] as const).map(([emoji, title, subject, pct]) => (
                  <div key={title} className="flex items-center gap-2.5 rounded-xl border border-gray-200/70 bg-white p-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-[16px]">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-gray-900">{title}</p>
                      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-amber-600">{subject}</p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <ArrowRight size={13} className="shrink-0 text-gray-300" />
                  </div>
                ))}
              </div>
            )}

            {tab === 'classroom' && (
              <div className="flex flex-col gap-2 pt-0.5">
                <p className="text-[15px] font-extrabold tracking-tight text-gray-900">{t('Classroom', 'வகுப்பறை')}</p>
                <p className="-mt-1 text-[10px] text-gray-500">{t('8 subjects · video + notes per lesson', '8 பாடங்கள் · வீடியோ + குறிப்புகள்')}</p>
                {([
                  [t('Ancient History', 'பண்டைய வரலாறு'), '12 ' + t('lessons', 'பாடங்கள்'), 72, '#E67E22'],
                  [t('Geography', 'புவியியல்'), '10 ' + t('lessons', 'பாடங்கள்'), 45, '#3DD68C'],
                  [t('Polity', 'அரசியலமைப்பு'), '9 ' + t('lessons', 'பாடங்கள்'), 30, '#A855F7'],
                  [t('English', 'ஆங்கிலம்'), '16 ' + t('lessons', 'பாடங்கள்'), 88, '#0284c7'],
                  [t('Reasoning', 'Reasoning'), '11 ' + t('lessons', 'பாடங்கள்'), 55, '#6366F1'],
                ] as const).map(([name, lessons, pct, color]) => (
                  <div key={name} className="rounded-xl border border-gray-200/70 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-bold text-gray-900">{name}</p>
                        <p className="text-[9.5px] text-gray-400">{lessons}</p>
                      </div>
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
              <div className="flex flex-col gap-2.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">{t('AI Daily Test', 'AI தினசரி தேர்வு')}</span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-bold tabular-nums text-gray-900"><Timer size={12} /> 24:37</span>
                </div>
                <div className="rounded-2xl border border-gray-200/70 bg-white p-3">
                  <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600">{t('History', 'வரலாறு')}</span>
                  <p className="mt-2 text-[13px] font-bold leading-snug text-gray-900">{t('The Harappan port site of Lothal is in which present-day state?', 'ஹரப்பன் துறைமுகமான லோதல் இன்றைய எந்த மாநிலத்தில் உள்ளது?')}</p>
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {[t('Gujarat', 'குஜராத்'), t('Punjab', 'பஞ்சாப்'), t('Rajasthan', 'ராஜஸ்தான்'), t('Haryana', 'ஹரியானா')].map((opt, i) => {
                      const isPick = picked === i, isRight = i === 0 && picked !== null, isWrong = isPick && i !== 0
                      return (
                        <button key={opt} type="button" onClick={() => setPicked(i)}
                          className="flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left transition-colors"
                          style={{ borderColor: isRight ? '#22C55E' : isWrong ? '#F59E0B' : isPick ? '#0284c7' : 'transparent', background: isRight ? '#F0FDF4' : isWrong ? '#FFFBEB' : isPick ? '#F0F9FF' : '#F3F4F6' }}>
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold" style={{ background: isRight ? '#22C55E' : isPick ? '#0284c7' : '#E5E7EB', color: isPick || isRight ? '#fff' : '#6B7280' }}>{['A', 'B', 'C', 'D'][i]}</span>
                          <span className="text-[12px] text-gray-900">{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                  {picked !== null && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10.5px] leading-snug text-emerald-800">
                      {picked === 0 ? t('Correct! Lothal is in Gujarat.', 'சரி! லோதல் குஜராத்தில்.') : t("Not quite — it's Gujarat. First attempts are scored once, forever.", 'இல்லை — குஜராத். முதல் முயற்சி ஒருமுறை பதிவாகும்.')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* bottom nav — 4 tabs, exactly like the app */}
          <div className="flex items-center justify-around border-t border-gray-200/80 bg-white/90 px-1 py-2 backdrop-blur-sm">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button key={id} type="button" onClick={() => setTab(id)} className="flex flex-1 flex-col items-center gap-0.5 py-0.5">
                  <Icon size={17} className={active ? 'text-sky-600' : 'text-gray-400'} />
                  <span className={`text-[8.5px] font-bold ${active ? 'text-sky-600' : 'text-gray-400'}`}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

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
