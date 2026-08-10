'use client'

/**
 * Landing v2 — one-time exam-cycle pricing.
 * Matches what actually happens at checkout: a single one-time payment per
 * programme (see src/data/pricing.ts, the source of truth also used by
 * registration/payment), not a recurring subscription. There is no payment
 * gateway or recurring billing in this app — don't imply "cancel anytime" or
 * "monthly/annual" again; it was never true and confused more than it converted.
 * Value-stacked against an external coaching-cost anchor. Bilingual via useLang.
 */
import Link from 'next/link'
import { ArrowRight, Check, MessageCircle, ShieldCheck, Star, Zap } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'
import { PROGRAMMES, formatINR } from '@/src/data/pricing'

const SHARED_FEATURES = {
  en: [
    'One full-length timed exam every morning',
    'AI Mentor coaching report after every exam',
    'Fresh daily study materials + classroom',
    'Daily current affairs, exam-tuned',
    'Live batch leaderboard & rank tracking',
    'Subject-wise accuracy & Centum Index',
    'Streaks, XP and achievement badges',
    'WhatsApp support from real humans',
  ],
  ta: [
    'தினமும் காலை ஒரு முழு நேரக் கட்டுப்பாட்டுத் தேர்வு',
    'ஒவ்வொரு தேர்வுக்குப் பின் AI வழிகாட்டி அறிக்கை',
    'தினமும் புதிய பாடங்கள் + classroom',
    'தேர்வுக்கு ஏற்ற தினசரி நடப்பு நிகழ்வுகள்',
    'நேரடி batch தரவரிசை & rank கண்காணிப்பு',
    'பாடவாரியான துல்லியம் & Centum Index',
    'தொடர்ச்சி, XP & சாதனை பேட்ஜ்கள்',
    'உண்மையான மனிதர்களின் WhatsApp ஆதரவு',
  ],
}

type L10n = { en: string; ta: string }
type PlanDisplay = {
  tag: L10n
  tagTone: 'amber' | 'emerald' | 'gray'
  featured: boolean
  anchor: number         // ₹ — what external coaching + test series would cost, for comparison only
  coverage: L10n
}

// Display-only copy, keyed by the same `value` PROGRAMMES uses. The actual
// prices (priceINR, originalINR, days) come from src/data/pricing.ts — the
// one place checkout and registration also read from — so this file can
// never drift out of sync with what a student is really charged again.
const PLAN_DISPLAY: Record<string, PlanDisplay> = {
  UDC: {
    tag: { en: 'Founder entry', ta: 'Founder நுழைவு' }, tagTone: 'gray', featured: false,
    anchor: 12000,
    coverage: { en: 'GK, aptitude, English & Tamil for clerical-cadre exams.', ta: 'எழுத்தர் பணித் தேர்வுகளுக்கான GK, aptitude, ஆங்கிலம் & தமிழ்.' },
  },
  SSC: {
    tag: { en: 'Most popular', ta: 'மிகவும் பிரபலம்' }, tagTone: 'amber', featured: true,
    anchor: 18000,
    coverage: { en: 'CGL · CHSL · MTS · CPO — the full SSC Tier-1 pattern.', ta: 'CGL · CHSL · MTS · CPO — முழு SSC Tier-1 முறை.' },
  },
  RRB: {
    tag: { en: 'Great value', ta: 'சிறந்த மதிப்பு' }, tagTone: 'emerald', featured: false,
    anchor: 15000,
    coverage: { en: 'NTPC & Group D — maths, reasoning, GS & current affairs.', ta: 'NTPC & Group D — கணிதம், reasoning, GS & நடப்பு நிகழ்வுகள்.' },
  },
  Banking: {
    tag: { en: 'Pro track', ta: 'Pro பாதை' }, tagTone: 'emerald', featured: false,
    anchor: 20000,
    coverage: { en: 'IBPS & SBI PO / Clerk — quant, reasoning, English & GA.', ta: 'IBPS & SBI PO / Clerk — quant, reasoning, ஆங்கிலம் & GA.' },
  },
}

const TAG_CLASS: Record<PlanDisplay['tagTone'], string> = {
  amber:   'bg-amber-50 text-amber-700 ring-amber-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  gray:    'bg-gray-50 text-gray-500 ring-gray-200/80',
}

export default function Pricing() {
  const { lang, t } = useLang()

  return (
    <section id="pricing" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('Founder member pricing', 'Founder உறுப்பினர் விலை')}
          labelTone="indigo"
          title={t('One price. Your whole exam cycle, handled.', 'ஒரே விலை. உங்கள் முழு தேர்வுக் காலமும், கவனிக்கப்படும்.')}
          sub={t(
            'Pay once for your exam — daily test, AI mentor, classroom, current affairs, leaderboard, all included. No auto-renewal, no recurring charges.',
            'உங்கள் தேர்வுக்கு ஒரே முறை செலுத்துங்கள் — தினசரி தேர்வு, AI வழிகாட்டி, classroom, நடப்பு நிகழ்வுகள், தரவரிசை, அனைத்தும் அடங்கும். தானாக புதுப்பிக்கப்படாது, மீண்டும் மீண்டும் கட்டணம் இல்லை.',
          )}
        />

        <div className="relative mx-auto max-w-6xl">
          <div aria-hidden className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-sky-100/60 via-indigo-100/35 to-emerald-100/35 blur-2xl sm:-inset-5" />

          {/* ── Plan grid ── */}
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PROGRAMMES.map((programme, i) => {
              const plan = PLAN_DISPLAY[programme.value]
              if (!plan) return null
              return (
                <Reveal key={programme.value} delay={i * 90}>
                  <div
                    className={`lv2-card3d relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white ${
                      plan.featured
                        ? 'border-sky-300 shadow-[0_1px_3px_rgba(16,24,40,0.07),0_24px_48px_-16px_rgba(2,132,199,0.28)] ring-1 ring-sky-200'
                        : 'border-gray-200/80 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_16px_36px_-18px_rgba(16,24,40,0.14)]'
                    }`}
                  >
                    <div aria-hidden className={`h-1 ${plan.featured ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500' : 'bg-gray-100'}`} />

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[16px] font-extrabold tracking-tight text-gray-900">{programme.exam}</div>
                          <div className="truncate text-[11.5px] font-medium text-gray-500">{programme.full}</div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${TAG_CLASS[plan.tagTone]}`}>
                          {plan.featured && <Star size={10} />}
                          {plan.tag[lang]}
                        </span>
                      </div>

                      {/* Value anchor */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-gray-400 line-through">{formatINR(plan.anchor)}{t('/yr coaching', '/ஆண்டு coaching')}</span>
                      </div>

                      {/* Price */}
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-[15px] font-semibold text-gray-400 line-through">{formatINR(programme.originalINR)}</span>
                        <span className="text-[38px] font-extrabold leading-none tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                          {formatINR(programme.priceINR)}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] font-medium text-gray-600">
                        {t(`One-time · full ${programme.days}-day access`, `ஒரே முறை · முழு ${programme.days} நாள் அணுகல்`)}
                      </p>

                      {/* Coverage */}
                      <p className="mt-3 border-t border-gray-100 pt-3 text-[12.5px] leading-relaxed text-gray-600">
                        {plan.coverage[lang]}
                      </p>

                      {/* CTA */}
                      <Link
                        href="/auth/register"
                        aria-label={`Start ${programme.exam}`}
                        className={`group mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-bold transition-all hover:-translate-y-0.5 ${
                          plan.featured
                            ? 'bg-sky-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] hover:bg-sky-700 hover:shadow-[0_8px_24px_rgba(2,132,199,0.4)]'
                            : 'border border-gray-300 bg-white text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {t(`Start ${programme.exam}`, `${programme.exam} தொடங்கு`)}
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      <p className="mt-2 text-center text-[11px] text-gray-400">{t('Day 1 free preview · pay to unlock the full cycle', 'முதல் நாள் இலவச முன்னோட்டம் · முழு அணுகலுக்கு செலுத்துங்கள்')}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>

          {/* ── Everything included (the value stack) ── */}
          <Reveal delay={200}>
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-7">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                  <Check size={15} />
                </span>
                <h3 className="text-[14.5px] font-bold tracking-tight text-gray-900">{t('Every plan includes', 'ஒவ்வொரு திட்டத்திலும் அடங்கியவை')}</h3>
              </div>
              <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {SHARED_FEATURES[lang].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                    <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                      <Check size={11} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* ── Reassurance + WhatsApp ── */}
          <Reveal delay={260}>
            <div className="relative mt-6 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-gray-500">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> {t('Pay once — no recurring charges', 'ஒரே முறை செலுத்துங்கள் — மீண்டும் மீண்டும் கட்டணம் இல்லை')}</span>
                <span className="inline-flex items-center gap-1.5"><Zap size={13} className="text-amber-500" /> {t('Instant access after signup', 'பதிவுக்குப் பின் உடனடி அணுகல்')}</span>
              </div>
              <p className="text-center text-[13px] text-gray-500">
                {t('Not sure which exam fits you?', 'எந்தத் தேர்வு உங்களுக்குப் பொருந்தும் என்று தெரியவில்லையா?')}{' '}
                <a
                  href="https://wa.me/917200132957"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle size={14} /> {t('Chat with us on WhatsApp', 'WhatsApp-இல் எங்களுடன் பேசுங்கள்')}
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
