'use client'

/**
 * /pilot — Vijayadashami pilot launch (Karaikal, 20 Oct 2026).
 *
 * A conversion page for the free orientation, built on the landing-v2
 * primitives. The narrative mirrors the orientation itself:
 * Hero (offer) → Agenda (what happens in the room) → Five-paper analysis
 * (academic credibility) → 90-day programme (habit system) → Centum Index
 * refund slabs + worked example (reward) → Registration.
 *
 * Every number comes from src/data/pilot.ts or production code — the refund
 * slabs from getRefundTier, the index weights from calculate_centum_index —
 * so the page can't promise something the platform doesn't calculate.
 */
import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import Logo from '@/src/components/landing-v2/Logo'
import { Reveal, Container, SectionHeading } from '@/src/components/landing-v2/ui'
import { useLang } from '@/src/components/landing-v2/lang'
import {
  ArrowRight, BarChart, BookOpen, Calendar, CheckCircle, Flame, MessageCircle,
  Target, Timer, TrendingUp, Trophy, Users,
} from '@/src/components/landing-v2/icons'
import {
  PILOT, ILLUSTRATIVE_FEE_INR, REFUND_SLABS, refundFor, formatRupees,
  PILOT_EXAMS, PILOT_STAGES, PILOT_SOURCES,
} from '@/src/data/pilot'

const CSS = `
.lv2-reveal{opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(.21,.65,.36,1),transform .6s cubic-bezier(.21,.65,.36,1);}
.lv2-reveal.lv2-shown{opacity:1;transform:none;}
@media (prefers-reduced-motion: reduce){.lv2-reveal{transition:none;transform:none;opacity:1;}}
`

const WA = (text: string) => `https://wa.me/${PILOT.whatsapp}?text=${encodeURIComponent(text)}`

function scrollToRegister(e: React.MouseEvent) {
  const el = document.getElementById('register')
  if (!el) return
  e.preventDefault()
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: 'smooth' })
}

/* ─────────────────────────────── Header ─────────────────────────────── */

function Header() {
  const { lang, setLang, t } = useLang()
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-[16px] font-bold tracking-tight text-gray-900">
            Centu<span className="text-sky-600">Mania</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            aria-label={lang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-bold text-gray-700 hover:border-sky-300 hover:text-sky-700"
          >
            <span className={lang === 'en' ? 'text-sky-700' : ''}>EN</span>
            <span className="text-gray-300"> / </span>
            <span className={lang === 'ta' ? 'text-sky-700' : ''}>தமிழ்</span>
          </button>
          <a
            href="#register"
            onClick={scrollToRegister}
            className="hidden rounded-full bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-gray-800 sm:inline-flex"
          >
            {t('Register free', 'இலவசமாகப் பதிவு')}
          </a>
        </div>
      </nav>
    </header>
  )
}

/* ──────────────────────────────── Hero ──────────────────────────────── */

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200/70 bg-white p-4 text-left">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        <div className="mt-0.5 text-[14px] font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  )
}

function Hero() {
  const { t } = useLang()
  const tba = t('To be announced', 'விரைவில் அறிவிக்கப்படும்')
  const pillars = [
    {
      icon: <BookOpen size={18} />, tone: 'bg-indigo-50 text-indigo-600',
      title: t('PYQ Intelligence', 'PYQ பகுப்பாய்வு'),
      text: t(`What the last ${PILOT.papersAnalysed} question papers reveal about what to study first.`,
              `கடந்த ${PILOT.papersAnalysed} வினாத்தாள்கள் எதை முதலில் படிக்க வேண்டும் என்று காட்டுகின்றன.`),
    },
    {
      icon: <Flame size={18} />, tone: 'bg-orange-50 text-orange-600',
      title: t('Daily Execution', 'தினசரி செயல்பாடு'),
      text: t('A daily mission, a timed test and tracked progress — consistency by design.',
              'தினமும் ஒரு இலக்கு, நேரக் கட்டுப்பாட்டுத் தேர்வு, கண்காணிக்கப்படும் முன்னேற்றம்.'),
    },
    {
      icon: <Trophy size={18} />, tone: 'bg-amber-50 text-amber-600',
      title: t('Centum Rewards', 'Centum வெகுமதிகள்'),
      text: t('Earn back 25%–50% of your fee through a published, performance-based Centum Index.',
              'வெளியிடப்பட்ட Centum Index மூலம் உங்கள் கட்டணத்தில் 25%–50% திரும்பப் பெறுங்கள்.'),
    },
  ]

  return (
    <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-amber-50/70 via-sky-50/40 to-transparent" />
      <Container className="relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800 ring-1 ring-amber-200/80">
            {t('Vijayadashami Pilot Launch · Karaikal · 20 October 2026',
               'விஜயதசமி பைலட் தொடக்கம் · காரைக்கால் · 20 அக்டோபர் 2026')}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl" style={{ letterSpacing: '-0.035em' }}>
            {t("Don't just prepare.", 'தயாராவது மட்டும் போதாது.')}
            <br />
            <span className="text-sky-600">{t('Build the habit of winning.', 'வெற்றியைப் பழக்கமாக்குங்கள்.')}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            {t(
              'A free orientation for government-exam aspirants: a five-paper analysis, a live platform demonstration, a short diagnostic test — and an invitation to the 90-day CentuMania pilot batch.',
              'அரசுத் தேர்வு ஆர்வலர்களுக்கான இலவச அறிமுக வகுப்பு: ஐந்து வினாத்தாள் பகுப்பாய்வு, தளத்தின் நேரடி செயல்விளக்கம், ஒரு சிறிய கண்டறிதல் தேர்வு — மற்றும் 90 நாள் CentuMania பைலட் batch-க்கு அழைப்பு.',
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#register"
              onClick={scrollToRegister}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(2,132,199,0.6)] hover:bg-sky-700"
            >
              {t('Reserve my free seat', 'என் இலவச இடத்தை உறுதிசெய்')} <ArrowRight size={17} />
            </a>
            <a
              href={WA('Hi CentuMania, I want to know more about the Vijayadashami pilot orientation.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-[15px] font-semibold text-gray-800 hover:border-gray-300"
            >
              <MessageCircle size={17} /> {t('Ask on WhatsApp', 'WhatsApp-இல் கேளுங்கள்')}
            </a>
          </div>
        </Reveal>

        <Reveal delay={100} className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={<Calendar size={17} />} label={t('Date', 'தேதி')} value={t('Tue, 20 Oct 2026', 'செவ்வாய், 20 அக். 2026')} />
          <Fact icon={<Timer size={17} />} label={t('Time', 'நேரம்')} value={PILOT.orientationTime ?? tba} />
          <Fact icon={<Target size={17} />} label={t('Venue', 'இடம்')} value={PILOT.venue ?? t('Karaikal — venue to be announced', 'காரைக்கால் — இடம் விரைவில்')} />
          <Fact icon={<CheckCircle size={17} />} label={t('Orientation fee', 'அறிமுக வகுப்புக் கட்டணம்')} value={t('Free', 'இலவசம்')} />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={150 + i * 80}>
              <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.tone}`}>{p.icon}</span>
                <h3 className="mt-4 text-[16px] font-bold tracking-tight text-gray-900">{p.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-600">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ─────────────────────────────── Agenda ─────────────────────────────── */

function Agenda() {
  const { t } = useLang()
  const items = [
    { min: '0–10', title: t('Why aspirants struggle', 'ஏன் ஆர்வலர்கள் தடுமாறுகிறார்கள்'),
      text: t('Collecting study material vs. consistently completing exam-relevant work.',
              'பாடப் பொருட்களைச் சேகரிப்பதற்கும், தேர்வுக்குத் தேவையான வேலையைத் தொடர்ந்து முடிப்பதற்கும் உள்ள வேறுபாடு.') },
    { min: '10–30', title: t('The five-paper analysis', 'ஐந்து வினாத்தாள் பகுப்பாய்வு'),
      text: t('Recurring topics, question formats, syllabus coverage — and how they change your study plan.',
              'திரும்பத் திரும்ப வரும் தலைப்புகள், கேள்வி வடிவங்கள், பாடத்திட்டப் பரப்பு — அவை உங்கள் படிப்புத் திட்டத்தை எப்படி மாற்றுகின்றன.') },
    { min: '30–45', title: t('Live platform demo', 'தளத்தின் நேரடி செயல்விளக்கம்'),
      text: t('Study materials, daily tests, completion tracking, the leaderboard and the Centum Index — live.',
              'பாடங்கள், தினசரி தேர்வுகள், முன்னேற்றக் கண்காணிப்பு, தரவரிசை, Centum Index — நேரடியாக.') },
    { min: '45–60', title: t('The habit & accountability system', 'பழக்கம் & பொறுப்புணர்வு அமைப்பு'),
      text: t('Daily test schedule, attendance tracking, revision cycles and individual progress reports.',
              'தினசரி தேர்வு அட்டவணை, வருகைக் கண்காணிப்பு, மறுபார்வைச் சுழற்சிகள், தனிப்பட்ட முன்னேற்ற அறிக்கைகள்.') },
    { min: '60–75', title: t('Centum Index & refund challenge', 'Centum Index & ரீஃபண்ட் சவால்'),
      text: t('The exact slabs, how the index is calculated, how to qualify and when refunds are paid — with a worked example.',
              'சரியான அடுக்குகள், index எப்படிக் கணக்கிடப்படுகிறது, தகுதி பெறுவது எப்படி, ரீஃபண்ட் எப்போது — ஒரு எடுத்துக்காட்டுடன்.') },
    { min: '75–90', title: t('Diagnostic test & invitation', 'கண்டறிதல் தேர்வு & அழைப்பு'),
      text: t('A short sample test to find your baseline, then next steps for serious aspirants. No pressure.',
              'உங்கள் தொடக்க நிலையை அறிய ஒரு சிறிய தேர்வு, பின்னர் அடுத்த படிகள். எந்த அழுத்தமும் இல்லை.') },
  ]
  return (
    <section className="border-y border-gray-200/60 bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('The 90-minute orientation', '90 நிமிட அறிமுக வகுப்பு')}
          title={t("Evidence, not a sales pitch", 'விளம்பரம் அல்ல, ஆதாரம்')}
          sub={t(
            "You'll leave having seen real question-paper evidence, the working platform and the programme rules — not just slides.",
            'உண்மையான வினாத்தாள் ஆதாரம், இயங்கும் தளம், திட்ட விதிமுறைகள் — இவற்றைப் பார்த்த பிறகே நீங்கள் வெளியேறுவீர்கள்.',
          )}
        />
        <ol className="mx-auto grid max-w-4xl gap-3">
          {items.map((it, i) => (
            <Reveal key={it.min} delay={i * 50}>
              <li className="flex items-start gap-4 rounded-xl border border-gray-200/70 bg-[#FAFAF8] p-4 sm:p-5">
                <span className="w-16 shrink-0 rounded-lg bg-sky-600 px-2 py-1.5 text-center text-[12px] font-bold tabular-nums text-white">
                  {it.min}<span className="block text-[10px] font-semibold opacity-80">{t('MIN', 'நிமி')}</span>
                </span>
                <div>
                  <div className="text-[15px] font-bold text-gray-900">{it.title}</div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-gray-600">{it.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/* ────────────────────────── Five-paper analysis ───────────────────────── */

function PaperAnalysis() {
  const { t } = useLang()
  const shows = [
    t('Which topics appeared across the five papers', 'ஐந்து வினாத்தாள்களிலும் எந்தத் தலைப்புகள் வந்தன'),
    t('How often each topic and question type appeared', 'ஒவ்வொரு தலைப்பும் கேள்வி வகையும் எத்தனை முறை வந்தது'),
    t('Which syllabus areas deserve early attention', 'எந்தப் பாடப் பகுதிகளுக்கு முதலில் கவனம் தேவை'),
    t('What needs conceptual learning vs. repeated practice', 'எதற்குக் கருத்துப் புரிதல், எதற்குத் தொடர் பயிற்சி தேவை'),
    t('How the next 90 days of daily missions use these findings', 'அடுத்த 90 நாள் தினசரி இலக்குகள் இந்த முடிவுகளை எப்படிப் பயன்படுத்துகின்றன'),
  ]
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('PYQ Intelligence', 'PYQ பகுப்பாய்வு')}
          labelTone="indigo"
          title={t('Five papers. Clearer priorities. A smarter preparation plan.', 'ஐந்து வினாத்தாள்கள். தெளிவான முன்னுரிமைகள். சிறந்த தயாரிப்புத் திட்டம்.')}
          sub={t(
            `Built for the ${PILOT.targetExam} examination — not a list of repeated questions, but how the pattern changes what you study each day.`,
            `${PILOT.targetExam} தேர்வுக்காக உருவாக்கப்பட்டது — திரும்ப வந்த கேள்விகளின் பட்டியல் அல்ல, அந்த முறை உங்கள் தினசரி படிப்பை எப்படி மாற்றுகிறது என்பதே.`,
          )}
        />
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal>
            <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">{t("What you'll see", 'நீங்கள் பார்ப்பவை')}</h3>
              <ul className="mt-5 space-y-3">
                {shows.map(s => (
                  <li key={s} className="flex items-start gap-3 text-[14px] text-gray-700">
                    <span className="mt-0.5 text-indigo-600"><BarChart size={17} /></span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border border-amber-200/80 bg-amber-50/60 p-6 sm:p-8">
              <h3 className="text-[15px] font-bold text-amber-900">{t('An honest note', 'ஒரு நேர்மையான குறிப்பு')}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-amber-900/80">
                {t(
                  'Five papers are a preparation guide, not a prediction. Repeated topics tell us what to prioritise — they do not guarantee what the next paper will ask. Your preparation still covers the full syllabus.',
                  'ஐந்து வினாத்தாள்கள் ஒரு வழிகாட்டி, கணிப்பு அல்ல. திரும்ப வரும் தலைப்புகள் முன்னுரிமையைக் காட்டுகின்றன — அடுத்த வினாத்தாளில் என்ன வரும் என்று உத்தரவாதம் தருவதில்லை. உங்கள் தயாரிப்பு முழுப் பாடத்திட்டத்தையும் உள்ளடக்கும்.',
                )}
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/* ───────────────────────────── 90-day programme ───────────────────────── */

function Programme() {
  const { t } = useLang()
  const phases = [
    { days: t('Days 1–30', 'நாள் 1–30'), name: t('Build the habit', 'பழக்கத்தை உருவாக்கு'),
      tag: t('Consistency before intensity', 'தீவிரத்திற்கு முன் தொடர்ச்சி'), tone: 'text-sky-700 bg-sky-50',
      points: [t('Fixed daily study routine', 'நிலையான தினசரி படிப்பு நேரம்'), t('Short timed tests', 'சிறிய நேரக் கட்டுப்பாட்டுத் தேர்வுகள்'),
               t('Baseline and weak topics identified', 'தொடக்க நிலை & பலவீனமான தலைப்புகள் கண்டறிதல்'), t('Your first study streak', 'உங்கள் முதல் தொடர் படிப்பு')] },
    { days: t('Days 31–60', 'நாள் 31–60'), name: t('Improve performance', 'செயல்திறனை உயர்த்து'),
      tag: t('Accuracy, speed, retention', 'துல்லியம், வேகம், நினைவாற்றல்'), tone: 'text-indigo-700 bg-indigo-50',
      points: [t('More timed practice', 'கூடுதல் நேரப் பயிற்சி'), t('Revision cycles on weak areas', 'பலவீனப் பகுதிகளுக்கு மறுபார்வை'),
               t('Mistake analysis after every test', 'ஒவ்வொரு தேர்வுக்குப் பின் தவறு பகுப்பாய்வு'), t('Progress compared with your baseline', 'தொடக்க நிலையுடன் முன்னேற்ற ஒப்பீடு')] },
    { days: t('Days 61–90', 'நாள் 61–90'), name: t('Exam readiness', 'தேர்வுத் தயார்நிலை'),
      tag: t('Apply, revise, validate', 'பயன்படுத்து, மீள்பார், உறுதிசெய்'), tone: 'text-emerald-700 bg-emerald-50',
      points: [t('Syllabus-aligned mock tests', 'பாடத்திட்டத்திற்கு ஏற்ற மாதிரித் தேர்வுகள்'), t('Targeted revision from your data', 'உங்கள் தரவின் அடிப்படையில் இலக்கு மறுபார்வை'),
               t('Final individual performance review', 'இறுதித் தனிப்பட்ட செயல்திறன் மதிப்பாய்வு'), t('Final Centum Index and rewards settled', 'இறுதி Centum Index & வெகுமதி தீர்வு')] },
  ]
  const loop = [
    t("Today's mission", 'இன்றைய இலக்கு'), t('Study', 'படிப்பு'), t('Timed test', 'நேரத் தேர்வு'),
    t('Review mistakes', 'தவறுகளை ஆய்வு'), t('Centum Index updates', 'Centum Index புதுப்பிப்பு'), t("Tomorrow's mission", 'நாளைய இலக்கு'),
  ]
  return (
    <section className="border-y border-gray-200/60 bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('The 90-day pilot', '90 நாள் பைலட்')}
          labelTone="emerald"
          title={t('Ninety days. One daily system.', 'தொண்ணூறு நாட்கள். ஒரே தினசரி அமைப்பு.')}
          sub={t(
            'Attending a class is not the same as doing the work. The pilot measures what you complete every day — the Study Arena exists to reinforce that loop, not replace it.',
            'வகுப்பில் கலந்துகொள்வதும் வேலையைச் செய்வதும் ஒன்றல்ல. தினமும் நீங்கள் முடிப்பதையே பைலட் அளக்கிறது — Study Arena அந்தச் சுழற்சியை வலுப்படுத்தவே.',
          )}
        />
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {phases.map((p, i) => (
            <Reveal key={p.days} delay={i * 80}>
              <div className="h-full rounded-2xl border border-gray-200/80 bg-[#FAFAF8] p-6">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${p.tone}`}>{p.days}</span>
                <h3 className="mt-3 text-[17px] font-bold tracking-tight text-gray-900">{p.name}</h3>
                <p className="text-[12.5px] font-medium text-gray-500">{p.tag}</p>
                <ul className="mt-4 space-y-2">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2 text-[13.5px] text-gray-700">
                      <span className="mt-0.5 text-emerald-600"><CheckCircle size={15} /></span>{pt}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mx-auto mt-10 max-w-5xl">
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-5 sm:p-6">
            <div className="text-center text-[12px] font-bold uppercase tracking-wide text-sky-700">{t('The daily loop', 'தினசரி சுழற்சி')}</div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {loop.map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-800 ring-1 ring-sky-200">{step}</span>
                  {i < loop.length - 1 && <span className="text-sky-400"><ArrowRight size={14} /></span>}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* ──────────────────────── Centum Index + refund ──────────────────────── */

function Rewards() {
  const { t } = useLang()
  const fee = PILOT.feeINR ?? ILLUSTRATIVE_FEE_INR
  const illustrative = PILOT.feeINR === null
  const range = (min: number, max: number | null) => (max === null ? `${min}+` : `${min} – ${(max - 0.01).toFixed(2)}`)
  const tierTone: Record<string, string> = {
    gold: 'bg-amber-50 text-amber-800 ring-amber-200',
    silver: 'bg-gray-50 text-gray-700 ring-gray-200',
    bronze: 'bg-orange-50 text-orange-800 ring-orange-200',
  }

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label="Centum Index™"
          labelTone="amber"
          title={t('Discipline that pays — literally', 'பலன் தரும் ஒழுக்கம் — உண்மையாகவே')}
          sub={t(
            'The refund is not a discount. It rewards sustained participation, measured by the same Centum Index the platform calculates for you every day.',
            'ரீஃபண்ட் ஒரு தள்ளுபடி அல்ல. தொடர்ந்த பங்கேற்புக்கான வெகுமதி — தளம் தினமும் கணக்கிடும் அதே Centum Index மூலம் அளக்கப்படுகிறது.',
          )}
        />

        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
          {/* How the index is calculated — mirrors calculate_centum_index */}
          <Reveal>
            <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">{t('How your index is calculated', 'உங்கள் index எப்படிக் கணக்கிடப்படுகிறது')}</h3>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-sky-50/70 p-4">
                  <div className="flex items-center justify-between text-[14px] font-bold text-sky-800">
                    <span className="inline-flex items-center gap-2"><Calendar size={16} />{t('Attendance', 'வருகை')}</span><span>60%</span>
                  </div>
                  <p className="mt-1 text-[13px] text-gray-600">{t('Daily tests submitted ÷ daily tests conducted.', 'எழுதிய தினசரி தேர்வுகள் ÷ நடத்தப்பட்ட தினசரி தேர்வுகள்.')}</p>
                </div>
                <div className="rounded-xl bg-indigo-50/70 p-4">
                  <div className="flex items-center justify-between text-[14px] font-bold text-indigo-800">
                    <span className="inline-flex items-center gap-2"><Target size={16} />{t('Learning mastery', 'கற்றல் தேர்ச்சி')}</span><span>40%</span>
                  </div>
                  <p className="mt-1 text-[13px] text-gray-600">{t('Assigned learning units completed, and answered correctly on the first attempt.', 'ஒதுக்கப்பட்ட பாடங்களை முடித்தல், முதல் முயற்சியிலேயே சரியான பதில்.')}</p>
                </div>
              </div>
              <p className="mt-5 text-[12.5px] leading-relaxed text-gray-500">
                {t(
                  'Recalculated daily and visible on your dashboard. The formula is published before enrolment and does not change during the pilot.',
                  'தினமும் மறு கணக்கீடு, உங்கள் dashboard-இல் தெரியும். சூத்திரம் சேர்க்கைக்கு முன்பே வெளியிடப்படும், பைலட் காலத்தில் மாறாது.',
                )}
              </p>
            </div>
          </Reveal>

          {/* Slabs + worked example */}
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">{t('Refund slabs', 'ரீஃபண்ட் அடுக்குகள்')}</h3>
              <p className="mt-1 text-[12.5px] text-gray-500">
                {t(`Final Centum Index on Day ${PILOT.days}.`, `நாள் ${PILOT.days}-இல் இறுதி Centum Index.`)}
                {' '}
                {illustrative
                  ? t(`Worked example at an illustrative ${formatRupees(fee)} fee — the pilot fee will be announced at orientation.`,
                      `எடுத்துக்காட்டுக் கட்டணம் ${formatRupees(fee)} — பைலட் கட்டணம் அறிமுக வகுப்பில் அறிவிக்கப்படும்.`)
                  : t(`Pilot fee: ${formatRupees(fee)}.`, `பைலட் கட்டணம்: ${formatRupees(fee)}.`)}
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-gray-50 text-[11.5px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">{t('Index', 'Index')}</th>
                      <th className="px-3 py-2.5 font-semibold">{t('Refund', 'ரீஃபண்ட்')}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">{t('You pay', 'நீங்கள் செலுத்துவது')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {REFUND_SLABS.map(s => {
                      const r = refundFor(fee, s.pct)
                      return (
                        <tr key={s.tier}>
                          <td className="px-3 py-3">
                            <span className={`mr-2 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold ring-1 ${tierTone[s.tier]}`}>{s.name}</span>
                            <span className="font-semibold tabular-nums text-gray-900">{range(s.min, s.max)}</span>
                          </td>
                          <td className="px-3 py-3 tabular-nums text-gray-700">
                            <span className="font-bold text-emerald-700">{s.pct}%</span> · {formatRupees(r.refund)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900">{formatRupees(r.net)}</td>
                        </tr>
                      )
                    })}
                    <tr>
                      <td className="px-3 py-3 font-semibold tabular-nums text-gray-500">{t('Below 75', '75-க்குக் கீழ்')}</td>
                      <td className="px-3 py-3 text-gray-500">{t('No performance refund', 'செயல்திறன் ரீஃபண்ட் இல்லை')}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-500">{formatRupees(fee)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-gray-500">
                {t('Slabs never overlap: exactly 85 is Silver, exactly 95 is Gold.',
                   'அடுக்குகள் ஒன்றின் மேல் ஒன்று வருவதில்லை: சரியாக 85 என்பது Silver, சரியாக 95 என்பது Gold.')}
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150} className="mx-auto mt-5 max-w-5xl">
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-6 sm:p-7">
            <h3 className="text-[15px] font-bold text-emerald-900">{t('The rules, in plain words', 'விதிமுறைகள், எளிய வார்த்தைகளில்')}</h3>
            <ul className="mt-3 grid gap-2 text-[13.5px] text-emerald-950/80 sm:grid-cols-2">
              <li className="flex gap-2"><CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                {t(`Calculated once, from the final Day ${PILOT.days} Centum Index — automatically, from platform data.`,
                   `நாள் ${PILOT.days} இறுதி Centum Index-இலிருந்து ஒருமுறை — தளத் தரவிலிருந்து தானாக.`)}</li>
              <li className="flex gap-2"><CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                {t('Attendance is 60% of the index — missed daily tests are the fastest way to drop a slab.',
                   'வருகை index-இல் 60% — தினசரி தேர்வுகளைத் தவறவிடுவதே அடுக்கு இறங்க மிக விரைவான வழி.')}</li>
              <li className="flex gap-2"><CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                {t(`Approved refunds are paid within ${PILOT.refundProcessingBusinessDays} business days to the original payment method.`,
                   `அங்கீகரிக்கப்பட்ட ரீஃபண்டுகள் ${PILOT.refundProcessingBusinessDays} வேலை நாட்களுக்குள் அசல் கட்டண முறைக்கு வழங்கப்படும்.`)}</li>
              <li className="flex gap-2"><CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                {t('Full written terms — technical failures, exclusions and deadlines — are handed out before you pay.',
                   'முழு எழுத்துப்பூர்வ விதிமுறைகள் — தொழில்நுட்பக் கோளாறுகள், விலக்குகள், காலக்கெடு — கட்டணம் செலுத்தும் முன் வழங்கப்படும்.')}</li>
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* ───────────────────────────── Registration ──────────────────────────── */

type Status = 'idle' | 'sending' | 'done' | 'error'
type FieldError = 'name' | 'phone' | 'exam' | 'stage' | null

function Register() {
  const { lang, t } = useLang()
  const [form, setForm] = useState({ name: '', phone: '', exam: '', stage: '', source: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [fieldError, setFieldError] = useState<FieldError>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (fieldError === k) setFieldError(null)
  }

  const fallbackText =
    `Hi CentuMania, please register me for the Vijayadashami pilot orientation (20 Oct).\n` +
    `Name: ${form.name}\nPhone: ${form.phone}\n` +
    `Exam: ${PILOT_EXAMS.find(o => o.value === form.exam)?.en ?? '-'}\n` +
    `Stage: ${PILOT_STAGES.find(o => o.value === form.stage)?.en ?? '-'}`

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setFieldError(null)
    try {
      const res = await fetch('/api/pilot/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: form.source || null, lang }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) return setStatus('done')
      if (res.status === 400 && (['name', 'phone', 'exam', 'stage'] as const).includes(data.error as never)) {
        setFieldError(data.error as FieldError)
        return setStatus('idle')
      }
      setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  const errText: Record<Exclude<FieldError, null>, string> = {
    name: t('Please enter your name.', 'உங்கள் பெயரை உள்ளிடவும்.'),
    phone: t('Enter a valid 10-digit mobile number.', 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.'),
    exam: t('Choose the exam you are preparing for.', 'நீங்கள் தயாராகும் தேர்வைத் தேர்ந்தெடுக்கவும்.'),
    stage: t('Tell us where you are in your preparation.', 'உங்கள் தயாரிப்பு நிலையைத் தேர்ந்தெடுக்கவும்.'),
  }

  const input = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14.5px] text-gray-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
  const label = 'text-[13px] font-semibold text-gray-800'

  return (
    <section id="register" className="scroll-mt-20 border-t border-gray-200/60 bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('Free orientation', 'இலவச அறிமுக வகுப்பு')}
          labelTone="sky"
          title={t('Reserve your seat', 'உங்கள் இடத்தை உறுதிசெய்யுங்கள்')}
          sub={t(
            "Seats are limited. We'll confirm the venue and time on WhatsApp before 20 October.",
            'இடங்கள் குறைவு. 20 அக்டோபருக்கு முன் இடம் மற்றும் நேரத்தை WhatsApp-இல் உறுதிப்படுத்துவோம்.',
          )}
        />
        <Reveal className="mx-auto max-w-xl">
          {status === 'done' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center" role="status">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle size={24} /></span>
              <h3 className="mt-4 text-xl font-bold text-gray-900">{t("You're registered!", 'பதிவு செய்யப்பட்டது!')}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
                {t(
                  `We'll message you on WhatsApp with the venue and time. Bring a pen — there's a short diagnostic test at the end.`,
                  'இடம் மற்றும் நேரத்துடன் WhatsApp-இல் தொடர்புகொள்வோம். பேனா கொண்டு வாருங்கள் — இறுதியில் ஒரு சிறிய கண்டறிதல் தேர்வு உண்டு.',
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="rounded-2xl border border-gray-200/80 bg-[#FAFAF8] p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <div className="grid gap-4">
                <label className="block">
                  <span className={label}>{t('Full name', 'முழுப் பெயர்')}</span>
                  <input className={input} value={form.name} onChange={set('name')} autoComplete="name" maxLength={80} required
                    aria-invalid={fieldError === 'name'} />
                  {fieldError === 'name' && <span className="mt-1 block text-[12.5px] text-red-600">{errText.name}</span>}
                </label>
                <label className="block">
                  <span className={label}>{t('WhatsApp number', 'WhatsApp எண்')}</span>
                  <input className={input} value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel"
                    placeholder="98765 43210" maxLength={16} required aria-invalid={fieldError === 'phone'} />
                  {fieldError === 'phone' && <span className="mt-1 block text-[12.5px] text-red-600">{errText.phone}</span>}
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>{t('Target exam', 'இலக்குத் தேர்வு')}</span>
                    <select className={input} value={form.exam} onChange={set('exam')} required aria-invalid={fieldError === 'exam'}>
                      <option value="" disabled>{t('Select…', 'தேர்ந்தெடு…')}</option>
                      {PILOT_EXAMS.map(o => <option key={o.value} value={o.value}>{o[lang]}</option>)}
                    </select>
                    {fieldError === 'exam' && <span className="mt-1 block text-[12.5px] text-red-600">{errText.exam}</span>}
                  </label>
                  <label className="block">
                    <span className={label}>{t('Where are you now?', 'இப்போது எந்த நிலையில்?')}</span>
                    <select className={input} value={form.stage} onChange={set('stage')} required aria-invalid={fieldError === 'stage'}>
                      <option value="" disabled>{t('Select…', 'தேர்ந்தெடு…')}</option>
                      {PILOT_STAGES.map(o => <option key={o.value} value={o.value}>{o[lang]}</option>)}
                    </select>
                    {fieldError === 'stage' && <span className="mt-1 block text-[12.5px] text-red-600">{errText.stage}</span>}
                  </label>
                </div>
                <label className="block">
                  <span className={label}>{t('How did you hear about us? (optional)', 'எங்களைப் பற்றி எப்படித் தெரியும்? (விருப்பம்)')}</span>
                  <select className={input} value={form.source} onChange={set('source')}>
                    <option value="">{t('Select…', 'தேர்ந்தெடு…')}</option>
                    {PILOT_SOURCES.map(o => <option key={o.value} value={o.value}>{o[lang]}</option>)}
                  </select>
                </label>
              </div>

              {status === 'error' && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] text-amber-900" role="alert">
                  {t("We couldn't save your registration just now. Send it to us on WhatsApp instead — it's already filled in:",
                     'உங்கள் பதிவைச் சேமிக்க முடியவில்லை. அதற்குப் பதிலாக WhatsApp-இல் அனுப்புங்கள் — விவரங்கள் ஏற்கனவே நிரப்பப்பட்டுள்ளன:')}
                  {' '}
                  <a href={WA(fallbackText)} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">
                    {t('Register on WhatsApp', 'WhatsApp-இல் பதிவு')}
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-[15px] font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {status === 'sending' ? t('Registering…', 'பதிவு செய்கிறது…') : <>{t('Reserve my free seat', 'என் இலவச இடத்தை உறுதிசெய்')} <ArrowRight size={17} /></>}
              </button>
              <p className="mt-3 text-center text-[12px] text-gray-500">
                {t('We only use your number to contact you about the orientation and the pilot batch. ',
                   'அறிமுக வகுப்பு மற்றும் பைலட் batch பற்றித் தொடர்புகொள்ள மட்டுமே உங்கள் எண் பயன்படுத்தப்படும். ')}
                <Link href="/privacy" className="underline">{t('Privacy', 'தனியுரிமை')}</Link>
              </p>
            </form>
          )}
        </Reveal>
      </Container>
    </section>
  )
}

/* ─────────────────────────────── Closing ─────────────────────────────── */

function Closing() {
  const { t } = useLang()
  return (
    <section className="bg-gray-950 py-16 text-center text-white sm:py-20">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <span className="flex gap-2 text-sky-300"><Users size={20} /><TrendingUp size={20} /></span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ letterSpacing: '-0.025em' }}>
            {t('Five papers. One daily system. Ninety days of execution.', 'ஐந்து வினாத்தாள்கள். ஒரே தினசரி அமைப்பு. தொண்ணூறு நாள் செயல்பாடு.')}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-300">
            {t('Learn with purpose. Test yourself daily. Track your progress. Earn rewards for your commitment.',
               'நோக்கத்துடன் கற்றுக்கொள்ளுங்கள். தினமும் உங்களைச் சோதியுங்கள். முன்னேற்றத்தைக் கண்காணியுங்கள். உங்கள் அர்ப்பணிப்புக்கு வெகுமதி பெறுங்கள்.')}
          </p>
          <a
            href="#register"
            onClick={scrollToRegister}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-gray-900 hover:bg-gray-100"
          >
            {t('Reserve my free seat', 'என் இலவச இடத்தை உறுதிசெய்')} <ArrowRight size={17} />
          </a>
          <p className="mt-8 text-[13px] font-semibold italic text-amber-300">CentuMania — Winning is Habit.</p>
          <p className="mt-6 text-[12px] text-gray-500">
            <Link href="/" className="hover:text-gray-300">centumania</Link> ·{' '}
            <Link href="/terms" className="hover:text-gray-300">{t('Terms', 'விதிமுறைகள்')}</Link> ·{' '}
            <Link href="/privacy" className="hover:text-gray-300">{t('Privacy', 'தனியுரிமை')}</Link> ·{' '}
            <a href={`https://wa.me/${PILOT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-300">WhatsApp {PILOT.whatsappDisplay}</a>
          </p>
        </div>
      </Container>
    </section>
  )
}

export default function PilotLaunch() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900 antialiased" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
      <style>{CSS}</style>
      <Header />
      <main id="main-content">
        <Hero />
        <Agenda />
        <PaperAnalysis />
        <Programme />
        <Rewards />
        <Register />
        <Closing />
      </main>
    </div>
  )
}
