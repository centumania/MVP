'use client'

/**
 * Landing v2 — subscription pricing.
 * Per-exam monthly / annual subscription (annual = 2 months free). Value-stacked
 * against a coaching-cost anchor, risk-reversed with a free trial + cancel
 * anytime. Bilingual via useLang.
 *
 * NOTE: this is the OFFER/presentation layer. Recurring checkout still needs a
 * payment gateway (Razorpay/UPI AutoPay) — the "Start free trial" CTAs route to
 * /auth/register today; wire real recurring billing before launch.
 *
 * Prices are proposals (₹/mo). Tune PLANS[].monthly and the anchors freely.
 */
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, MessageCircle, ShieldCheck, Star, Zap } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

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
type Plan = {
  exam: string
  full: string
  tag: L10n
  tagTone: 'amber' | 'emerald' | 'gray'
  featured: boolean
  monthly: number        // ₹ / month
  anchor: number         // ₹ / year — what coaching + test series would cost
  coverage: L10n
}

// Annual = 10 months (2 months free). Change `monthly` and everything follows.
const PLANS: Plan[] = [
  {
    exam: 'UDC', full: 'Upper Division Clerk',
    tag: { en: 'Founder entry', ta: 'Founder நுழைவு' }, tagTone: 'gray', featured: false,
    monthly: 299, anchor: 12000,
    coverage: { en: 'GK, aptitude, English & Tamil for clerical-cadre exams.', ta: 'எழுத்தர் பணித் தேர்வுகளுக்கான GK, aptitude, ஆங்கிலம் & தமிழ்.' },
  },
  {
    exam: 'SSC', full: 'Staff Selection Commission',
    tag: { en: 'Most popular', ta: 'மிகவும் பிரபலம்' }, tagTone: 'amber', featured: true,
    monthly: 399, anchor: 18000,
    coverage: { en: 'CGL · CHSL · MTS · CPO — the full SSC Tier-1 pattern.', ta: 'CGL · CHSL · MTS · CPO — முழு SSC Tier-1 முறை.' },
  },
  {
    exam: 'RRB', full: 'Railway Recruitment Board',
    tag: { en: 'Great value', ta: 'சிறந்த மதிப்பு' }, tagTone: 'emerald', featured: false,
    monthly: 349, anchor: 15000,
    coverage: { en: 'NTPC & Group D — maths, reasoning, GS & current affairs.', ta: 'NTPC & Group D — கணிதம், reasoning, GS & நடப்பு நிகழ்வுகள்.' },
  },
  {
    exam: 'Banking', full: 'IBPS / SBI',
    tag: { en: 'Pro track', ta: 'Pro பாதை' }, tagTone: 'emerald', featured: false,
    monthly: 449, anchor: 20000,
    coverage: { en: 'IBPS & SBI PO / Clerk — quant, reasoning, English & GA.', ta: 'IBPS & SBI PO / Clerk — quant, reasoning, ஆங்கிலம் & GA.' },
  },
]

const TAG_CLASS: Record<Plan['tagTone'], string> = {
  amber:   'bg-amber-50 text-amber-700 ring-amber-200/80',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  gray:    'bg-gray-50 text-gray-500 ring-gray-200/80',
}

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function Pricing() {
  const { lang, t } = useLang()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  return (
    <section id="pricing" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('Founder member pricing', 'Founder உறுப்பினர் விலை')}
          labelTone="indigo"
          title={t('One subscription. Your whole exam, handled.', 'ஒரு சந்தா. உங்கள் தேர்வு முழுவதும், கவனிக்கப்படும்.')}
          sub={t(
            'Everything — daily test, AI mentor, classroom, current affairs, leaderboard — for less than a plate of lunch a day. Start free, cancel anytime.',
            'எல்லாமே — தினசரி தேர்வு, AI வழிகாட்டி, classroom, நடப்பு நிகழ்வுகள், தரவரிசை — ஒரு நாள் மதிய உணவை விட குறைவாக. இலவசமாகத் தொடங்குங்கள், எப்போது வேண்டுமானாலும் நிறுத்துங்கள்.',
          )}
        />

        {/* ── Billing toggle ── */}
        <Reveal>
          <div className="mb-8 flex items-center justify-center">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              {(['monthly', 'annual'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBilling(b)}
                  className={`relative rounded-full px-5 py-2 text-[13.5px] font-bold transition-colors ${
                    billing === b ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {b === 'monthly' ? t('Monthly', 'மாதம்') : t('Annual', 'ஆண்டு')}
                  {b === 'annual' && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${billing === 'annual' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                      {t('2 months free', '2 மாதம் இலவசம்')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="relative mx-auto max-w-6xl">
          <div aria-hidden className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-sky-100/60 via-indigo-100/35 to-emerald-100/35 blur-2xl sm:-inset-5" />

          {/* ── Plan grid ── */}
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan, i) => {
              const annual = plan.monthly * 10
              const shown  = billing === 'annual' ? annual : plan.monthly
              const perMo  = billing === 'annual' ? Math.round(annual / 12) : plan.monthly
              return (
                <Reveal key={plan.exam} delay={i * 90}>
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
                          <div className="text-[16px] font-extrabold tracking-tight text-gray-900">{plan.exam}</div>
                          <div className="truncate text-[11.5px] font-medium text-gray-500">{plan.full}</div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${TAG_CLASS[plan.tagTone]}`}>
                          {plan.featured && <Star size={10} />}
                          {plan.tag[lang]}
                        </span>
                      </div>

                      {/* Value anchor */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-gray-400 line-through">{rupee(plan.anchor)}{t('/yr coaching', '/ஆண்டு coaching')}</span>
                      </div>

                      {/* Price */}
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-[38px] font-extrabold leading-none tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                          {rupee(shown)}
                        </span>
                        <span className="text-[12px] font-medium text-gray-500">{billing === 'annual' ? t('/year', '/ஆண்டு') : t('/month', '/மாதம்')}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-medium text-gray-600">
                        {billing === 'annual'
                          ? t(`≈ ${rupee(perMo)}/mo · 2 months free`, `≈ ${rupee(perMo)}/மாதம் · 2 மாதம் இலவசம்`)
                          : t('billed monthly · cancel anytime', 'மாதந்தோறும் · எப்போது வேண்டுமானாலும் நிறுத்தலாம்')}
                      </p>

                      {/* Coverage */}
                      <p className="mt-3 border-t border-gray-100 pt-3 text-[12.5px] leading-relaxed text-gray-600">
                        {plan.coverage[lang]}
                      </p>

                      {/* CTA */}
                      <Link
                        href="/auth/register"
                        aria-label={`Start ${plan.exam} free trial`}
                        className={`group mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-bold transition-all hover:-translate-y-0.5 ${
                          plan.featured
                            ? 'bg-sky-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] hover:bg-sky-700 hover:shadow-[0_8px_24px_rgba(2,132,199,0.4)]'
                            : 'border border-gray-300 bg-white text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {t(`Start ${plan.exam} free`, `${plan.exam} இலவசமாகத் தொடங்கு`)}
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      <p className="mt-2 text-center text-[11px] text-gray-400">{t('Day 1 free · no card to start', 'முதல் நாள் இலவசம் · கார்டு தேவையில்லை')}</p>
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
                <h3 className="text-[14.5px] font-bold tracking-tight text-gray-900">{t('Every subscription includes', 'ஒவ்வொரு சந்தாவிலும் அடங்கியவை')}</h3>
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
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> {t('Cancel anytime — no lock-in', 'எப்போது வேண்டுமானாலும் நிறுத்தலாம் — கட்டுப்பாடு இல்லை')}</span>
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
