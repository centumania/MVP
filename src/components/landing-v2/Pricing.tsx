'use client'

/**
 * Landing v2 — pricing.
 * Four exam programmes, each a one-time founder-discounted price (original
 * struck through) with its own duration: UDC (30d), SSC (50d), RRB (45d),
 * Banking (60d). Shared benefits are listed once below the grid to keep the
 * page short and mobile-first. TNPSC intentionally omitted for now. Cards use
 * the .lv2-card3d tilt hover defined in LandingV2. Bilingual via useLang.
 */
import Link from 'next/link'
import { ArrowRight, Calendar, Check, MessageCircle, ShieldCheck, Star, Zap } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const SHARED_FEATURES = {
  en: [
    'One full-length timed exam every morning',
    'AI Mentor coaching report after every exam',
    'Fresh daily study materials',
    'Live batch leaderboard & rank tracking',
    'Subject-wise accuracy & trend analytics',
    'Centum Index with refund rewards up to 50%',
    'Streaks, XP and achievement badges',
    'WhatsApp support from real humans',
  ],
  ta: [
    'தினமும் காலை ஒரு முழு நேரக் கட்டுப்பாட்டுத் தேர்வு',
    'ஒவ்வொரு தேர்வுக்குப் பின் AI வழிகாட்டி அறிக்கை',
    'தினமும் புதிய பாடப் பொருட்கள்',
    'நேரடி batch தரவரிசை & rank கண்காணிப்பு',
    'பாடவாரியான துல்லியம் & போக்கு பகுப்பாய்வு',
    '50% வரை ரீஃபண்ட் வெகுமதிகளுடன் Centum Index',
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
  original: string
  price: string
  save: L10n
  days: number
  perDay: L10n
  coverage: L10n
}

const PLANS: Plan[] = [
  {
    exam: 'UDC',
    full: 'Upper Division Clerk',
    tag: { en: 'Founder entry', ta: 'Founder நுழைவு' },
    tagTone: 'gray',
    featured: false,
    original: '₹1,499',
    price: '₹999',
    save: { en: 'Save ₹500', ta: '₹500 சேமிப்பு' },
    days: 30,
    perDay: { en: '≈ ₹33 / day', ta: '≈ ₹33 / நாள்' },
    coverage: { en: 'GK, aptitude, English & Tamil for clerical-cadre exams.', ta: 'எழுத்தர் பணித் தேர்வுகளுக்கான GK, aptitude, ஆங்கிலம் & தமிழ்.' },
  },
  {
    exam: 'SSC',
    full: 'Staff Selection Commission',
    tag: { en: 'Most popular', ta: 'மிகவும் பிரபலம்' },
    tagTone: 'amber',
    featured: true,
    original: '₹2,499',
    price: '₹1,499',
    save: { en: 'Save ₹1,000', ta: '₹1,000 சேமிப்பு' },
    days: 50,
    perDay: { en: '≈ ₹30 / day', ta: '≈ ₹30 / நாள்' },
    coverage: { en: 'CGL · CHSL · MTS · CPO — the full SSC Tier-1 pattern.', ta: 'CGL · CHSL · MTS · CPO — முழு SSC Tier-1 முறை.' },
  },
  {
    exam: 'RRB',
    full: 'Railway Recruitment Board',
    tag: { en: 'Save 41%', ta: '41% சேமிப்பு' },
    tagTone: 'emerald',
    featured: false,
    original: '₹2,199',
    price: '₹1,299',
    save: { en: 'Save ₹900', ta: '₹900 சேமிப்பு' },
    days: 45,
    perDay: { en: '≈ ₹29 / day', ta: '≈ ₹29 / நாள்' },
    coverage: { en: 'NTPC & Group D — maths, reasoning, GS & current affairs.', ta: 'NTPC & Group D — கணிதம், reasoning, GS & நடப்பு நிகழ்வுகள்.' },
  },
  {
    exam: 'Banking',
    full: 'IBPS / SBI',
    tag: { en: 'Save 40%', ta: '40% சேமிப்பு' },
    tagTone: 'emerald',
    featured: false,
    original: '₹2,999',
    price: '₹1,799',
    save: { en: 'Save ₹1,200', ta: '₹1,200 சேமிப்பு' },
    days: 60,
    perDay: { en: '≈ ₹30 / day', ta: '≈ ₹30 / நாள்' },
    coverage: { en: 'IBPS & SBI PO / Clerk — quant, reasoning, English & GA.', ta: 'IBPS & SBI PO / Clerk — quant, reasoning, ஆங்கிலம் & GA.' },
  },
]

const TAG_CLASS: Record<Plan['tagTone'], string> = {
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
          label={t('Founder member offer', 'Founder உறுப்பினர் சலுகை')}
          labelTone="indigo"
          title={t('One-time price. Everything included.', 'ஒருமுறை கட்டணம். எல்லாம் அடக்கம்.')}
          sub={t(
            'Pick your exam. No subscriptions, no upsells — founder learners lock in the lowest price CentuMania will ever have. More exams coming soon.',
            'உங்கள் தேர்வைத் தேர்ந்தெடுங்கள். சந்தா இல்லை, கூடுதல் விற்பனை இல்லை — CentuMania-வின் என்றுமே மிகக் குறைந்த விலையை founder மாணவர்கள் உறுதி செய்கிறார்கள். மேலும் பல தேர்வுகள் விரைவில்.',
          )}
        />

        <div className="relative mx-auto max-w-6xl">
          <div aria-hidden className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-sky-100/60 via-indigo-100/35 to-emerald-100/35 blur-2xl sm:-inset-5" />

          {/* ── Plan grid — mobile-first: 1 → 2 → 4 ── */}
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan, i) => (
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

                    {/* Price */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-gray-400 line-through">{plan.original}</span>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/60">{plan.save[lang]}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[40px] font-extrabold leading-none tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                        {plan.price}
                      </span>
                      <span className="text-[12px] font-medium text-gray-500">{t('one-time', 'ஒருமுறை')}</span>
                    </div>

                    {/* Duration + per-day */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-sky-600" /> {t(`${plan.days}-day programme`, `${plan.days}-நாள் திட்டம்`)}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500">{plan.perDay[lang]}</span>
                    </div>

                    {/* Coverage */}
                    <p className="mt-3 border-t border-gray-100 pt-3 text-[12.5px] leading-relaxed text-gray-600">
                      {plan.coverage[lang]}
                    </p>

                    {/* CTA */}
                    <Link
                      href="/auth/register"
                      aria-label={`Start ${plan.exam} preparation`}
                      className={`group mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14.5px] font-bold transition-all hover:-translate-y-0.5 ${
                        plan.featured
                          ? 'bg-sky-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] hover:bg-sky-700 hover:shadow-[0_8px_24px_rgba(2,132,199,0.4)]'
                          : 'border border-gray-300 bg-white text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {t(`Start ${plan.exam} prep`, `${plan.exam} தயாரிப்பைத் தொடங்கு`)}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* ── Everything included (listed once) ── */}
          <Reveal delay={200}>
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-7">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                  <Check size={15} />
                </span>
                <h3 className="text-[14.5px] font-bold tracking-tight text-gray-900">{t('Every programme includes', 'ஒவ்வொரு திட்டத்திலும் அடங்கியவை')}</h3>
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
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> {t('Performance-linked refund on every plan', 'எல்லா திட்டங்களிலும் செயல்திறன்-இணைந்த ரீஃபண்ட்')}</span>
                <span className="inline-flex items-center gap-1.5"><Zap size={13} className="text-amber-500" /> {t('Instant access after payment', 'கட்டணம் செலுத்தியதும் உடனடி அணுகல்')}</span>
              </div>
              <p className="text-center text-[13px] text-gray-500">
                {t('Not sure which programme fits you?', 'எந்தத் திட்டம் உங்களுக்குப் பொருந்தும் என்று தெரியவில்லையா?')}{' '}
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
