/**
 * Landing v2 — Refund guarantee.
 * Copy matches the official policy at /refund exactly:
 * full refund = all exams attempted + average < 50% + request within 7 days.
 */
import Link from 'next/link'
import { Calendar, BarChart, Timer, CheckCircle, ShieldCheck } from './icons'
import { Reveal, Container, SectionHeading } from './ui'

const CONDITIONS = [
  { icon: Calendar, title: 'Attempt every daily exam', text: 'Without missing a single day of the programme.' },
  { icon: BarChart, title: 'Average below 50%', text: 'If you did the work and still scored under half, the programme failed you.' },
  { icon: Timer, title: 'Request within 7 days', text: 'Of the final exam day — one message on WhatsApp is enough.' },
  { icon: CheckCircle, title: 'Verified automatically', text: 'Eligibility is checked from your submission data. No arguments, no review board.' },
]

export default function Refund() {
  return (
    <section className="bg-white py-16 sm:py-24" style={{ boxShadow: 'inset 0 1px 0 rgba(16,24,40,0.05), inset 0 -1px 0 rgba(16,24,40,0.05)' }}>
      <Container>
        <SectionHeading
          label="Zero-risk enrolment"
          labelTone="emerald"
          title="Do the work. If it doesn't work, it's free."
          sub="We're confident enough in the system to put the fee on the line. Complete the programme honestly — if your scores don't reflect it, you get a full refund."
        />

        <Reveal delay={100}>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/60 to-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05),0_20px_44px_-16px_rgba(16,185,129,0.18)] sm:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-gray-900">100% money-back guarantee</h3>
                <p className="text-[13px] font-medium text-emerald-700">Full refund if all four conditions are met</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {CONDITIONS.map((c) => (
                <div key={c.title} className="flex items-start gap-3.5 rounded-xl border border-gray-200/60 bg-white p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <c.icon size={17} />
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">{c.title}</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[12.5px] text-gray-500">
              Approved refunds are processed within 7 business days to your original payment method. First-time enrolments only.{' '}
              <Link href="/refund" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">
                Read the full policy
              </Link>
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
