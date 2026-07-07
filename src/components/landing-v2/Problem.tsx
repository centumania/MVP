/**
 * Landing v2 — "Why CentuMania" problem/solution section.
 * Replaces v1's red-✗ "Why most aspirants fail" wall with a calmer,
 * trust-building before/after comparison.
 */
import { Check, X } from './icons'
import { Reveal, Container, SectionHeading } from './ui'

const WITHOUT = [
  'Scattered preparation with no daily structure',
  'No accountability — easy to skip a day, then a week',
  'No benchmark against real competitors',
  'Generic material not built for the real exam pattern',
  'Motivation fades after the first week',
]

const WITH = [
  'A fixed 30-day plan that covers the full syllabus',
  'A timed exam every morning at 6 AM — no exceptions',
  'A live batch leaderboard updated after every exam',
  'Questions modelled on the actual exam pattern',
  'Streaks, ranks and AI coaching that keep you going',
]

export default function Problem() {
  return (
    <section id="why" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label="Why CentuMania"
          labelTone="sky"
          title="Hard work isn't your problem. Structure is."
          sub="Most aspirants don't fail from lack of effort — they fail from inconsistent, unmeasured effort. CentuMania replaces guesswork with a system."
        />

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          <Reveal delay={80}>
            <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <h3 className="text-[15px] font-bold text-gray-500">Preparing alone</h3>
              <ul className="mt-5 space-y-4">
                {WITHOUT.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <X size={12} />
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-gray-500">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-sky-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_16px_40px_-12px_rgba(2,132,199,0.18)] sm:p-8">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
              <h3 className="text-[15px] font-bold text-sky-700">Preparing with CentuMania</h3>
              <ul className="mt-5 space-y-4">
                {WITH.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                      <Check size={12} />
                    </span>
                    <span className="text-[14.5px] font-medium leading-relaxed text-gray-800">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
