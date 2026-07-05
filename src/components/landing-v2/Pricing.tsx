/**
 * Landing v2 — pricing.
 * Two programmes: LDC/UDC Founder Batch (30 days, ₹999 founder learners
 * discount) and SSC Programme (50 days, ₹1,999). One-time payments,
 * WhatsApp escape hatch for hesitant buyers. Cards use the .lv2-card3d
 * tilt hover defined in LandingV2.
 */
import Link from 'next/link'
import { ArrowRight, Check, MessageCircle, ShieldCheck, Zap } from './icons'
import { Reveal, Container, SectionHeading } from './ui'

const SHARED_FEATURES = [
  'AI Mentor coaching report after every exam',
  'Daily study materials, published every day',
  'Live batch leaderboard & rank tracking',
  'Performance analytics — subject-wise accuracy & trends',
  'Centum Index with refund rewards up to 50%',
  'Streaks, XP and achievement badges',
  'WhatsApp support from real humans',
]

const PLANS = [
  {
    name: 'LDC / UDC Founder Batch',
    badge: 'Founder Learners Discount',
    featured: true,
    price: '₹999',
    period: 'one-time · 30-day programme',
    hook: '≈ ₹33 a day — less than a plate of parotta, for a government job shot.',
    features: ['30 daily full-length timed exams', ...SHARED_FEATURES],
    cta: 'Claim my founder seat',
  },
  {
    name: 'SSC Programme',
    badge: '50-day intensive',
    featured: false,
    price: '₹1,999',
    period: 'one-time · 50-day programme',
    hook: 'Extended syllabus coverage for the SSC exam pattern.',
    features: ['50 daily full-length timed exams', ...SHARED_FEATURES],
    cta: 'Join the SSC programme',
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label="Founder member offer"
          labelTone="indigo"
          title="Simple pricing. Everything included."
          sub="No tiers, no upsells, no subscriptions. Founder learners lock in the lowest price CentuMania will ever have."
        />

        <div className="relative mx-auto max-w-4xl">
          <div aria-hidden className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-sky-100/70 via-indigo-100/40 to-emerald-100/40 blur-2xl" />

          <div className="relative grid gap-6 md:grid-cols-2">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 120}>
                <div
                  className={`lv2-card3d relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white ${
                    plan.featured
                      ? 'border-sky-300/80 shadow-[0_1px_3px_rgba(16,24,40,0.07),0_28px_56px_-16px_rgba(2,132,199,0.25)]'
                      : 'border-gray-200/80 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_20px_44px_-16px_rgba(16,24,40,0.12)]'
                  }`}
                >
                  <div aria-hidden className={`h-1 ${plan.featured ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500' : 'bg-gray-100'}`} />
                  <div className="flex flex-1 flex-col p-7 sm:p-8">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14.5px] font-bold text-gray-900">{plan.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                          plan.featured
                            ? 'bg-amber-50 text-amber-700 ring-amber-200/80'
                            : 'bg-gray-50 text-gray-500 ring-gray-200/80'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-[44px] font-extrabold leading-none tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                        {plan.price}
                      </span>
                      <span className="text-[13px] font-medium text-gray-500">{plan.period}</span>
                    </div>
                    <p className={`mt-2 text-[13px] font-medium ${plan.featured ? 'text-emerald-700' : 'text-gray-500'}`}>{plan.hook}</p>

                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-gray-700">
                          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                            <Check size={11} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/auth/register"
                      className={`group mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 ${
                        plan.featured
                          ? 'bg-sky-600 text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] hover:bg-sky-700 hover:shadow-[0_8px_24px_rgba(2,132,199,0.4)]'
                          : 'border border-gray-300 bg-white text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={220}>
            <div className="relative mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-5 text-[12.5px] font-medium text-gray-500">
                <span className="inline-flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-600" /> Refund guarantee on both plans</span>
                <span className="inline-flex items-center gap-1"><Zap size={13} className="text-amber-500" /> Instant access</span>
              </div>
              <p className="text-center text-[13px] text-gray-500">
                Not sure which programme fits you?{' '}
                <a
                  href="https://wa.me/917200132957"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle size={14} /> Chat with us on WhatsApp
                </a>
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
