/**
 * Landing v2 — Centum Index explainer.
 * Formula and tiers mirror production code exactly:
 *   centum_index = attendance×60% + node_index×40%   (calculate_centum_index)
 *   tiers: ≥95 Gold (50% refund) · ≥85 Silver (35%) · ≥75 Bronze (25%)  (getRefundTier)
 */
import { Medal, Target, Calendar } from './icons'
import { Reveal, Container, SectionHeading } from './ui'

const TIERS = [
  { name: 'Gold', threshold: '95+', reward: '50% refund reward', ring: 'ring-amber-300/70', bg: 'bg-amber-50', text: 'text-amber-700', bar: '#f59e0b' },
  { name: 'Silver', threshold: '85+', reward: '35% refund reward', ring: 'ring-gray-300/80', bg: 'bg-gray-50', text: 'text-gray-600', bar: '#94a3b8' },
  { name: 'Bronze', threshold: '75+', reward: '25% refund reward', ring: 'ring-orange-300/60', bg: 'bg-orange-50', text: 'text-orange-700', bar: '#fb923c' },
]

export default function CentumIndex() {
  return (
    <section id="centum-index" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label="Centum Index™"
          labelTone="amber"
          title="One score that measures your discipline"
          sub="Marks fluctuate. Discipline compounds. The Centum Index tracks the two things that actually predict selection — showing up and mastering what you study."
        />

        <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Formula card */}
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">How it&apos;s calculated</h3>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Calendar size={16} /></span>
                      Attendance
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-sky-600">60%</span>
                  </div>
                  <p className="ml-10 mt-1.5 text-[13px] leading-relaxed text-gray-500">
                    Did you take every daily test? Showing up is the single biggest predictor of clearing the exam.
                  </p>
                  <div className="ml-10 mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-sky-500 to-sky-400" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Target size={16} /></span>
                      Learning mastery
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-indigo-600">40%</span>
                  </div>
                  <p className="ml-10 mt-1.5 text-[13px] leading-relaxed text-gray-500">
                    Did you complete your assigned learning units — and get them right on the first attempt?
                  </p>
                  <div className="ml-10 mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <div className="rounded-xl bg-gray-50 px-5 py-4 text-center">
                  <span className="text-[13px] font-medium text-gray-500">Your Centum Index = </span>
                  <span className="text-[13px] font-bold text-sky-700">Attendance × 60%</span>
                  <span className="text-[13px] font-medium text-gray-500"> + </span>
                  <span className="text-[13px] font-bold text-indigo-700">Mastery × 40%</span>
                  <p className="mt-1.5 text-[12px] text-gray-500">Recalculated daily. Fully automatic. Impossible to game.</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Tiers card */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Medal size={18} /></span>
                <h3 className="text-lg font-bold tracking-tight text-gray-900">Discipline pays. Literally.</h3>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-gray-600">
                Finish the programme with a high Centum Index and earn back part of your fee —
                a reward for the discipline that gets people selected.
              </p>

              <div className="mt-6 space-y-3">
                {TIERS.map((t) => (
                  <div key={t.name} className={`flex items-center gap-4 rounded-xl ${t.bg} px-4 py-3.5 ring-1 ${t.ring}`}>
                    <span className={`text-[14px] font-extrabold ${t.text}`}>{t.name}</span>
                    <div className="ml-auto text-right">
                      <div className="text-[13px] font-bold text-gray-900">Index {t.threshold}</div>
                      <div className={`text-[12px] font-semibold ${t.text}`}>{t.reward}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-auto pt-5 text-[12px] leading-relaxed text-gray-500">
                Refund rewards are computed automatically from your Centum Index at programme end.
                No forms, no negotiation — the data decides.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
