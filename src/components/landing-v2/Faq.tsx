'use client'

/**
 * Landing v2 — FAQ.
 * Accessible accordion (button + region semantics), animated expansion
 * via CSS grid-rows trick — no measurement code, no dependencies.
 */
import { useState } from 'react'
import { ChevronDown, MessageCircle } from './icons'
import { Reveal, Container, SectionHeading } from './ui'

const FAQS = [
  {
    q: "What if I miss a day's exam?",
    a: "If you miss the 6:00–8:30 AM window, that day's exam is automatically marked as missed. Your rank won't update for that day and consecutive misses affect your streak. The programme rewards consistency — plan your schedule before you start.",
  },
  {
    q: 'Which exam is this specifically for?',
    a: 'CentuMania is purpose-built for LDC (Lower Division Clerk) and UDC (Upper Division Clerk) government competitive exams. All content is calibrated to the actual exam syllabus and question pattern.',
  },
  {
    q: 'What language are the exams in?',
    a: 'Exams are available in English and Tamil. You can switch your preferred language in account settings.',
  },
  {
    q: 'How does the refund work?',
    a: 'Two ways. Full refund: attempt all daily exams, maintain an average below 50%, and apply within 7 days of programme completion. Centum rewards: finish with a Centum Index of 75+ and earn back 25–50% of your fee based on your tier. Both are verified automatically from your data.',
  },
  {
    q: 'Can I join mid-programme?',
    a: 'No. Each batch starts on a fixed date and runs for a fixed duration. This structure is intentional — the leaderboard resets per batch, so everyone races on equal footing. Join the next available batch to get the full experience and refund eligibility.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Day 1 of each batch is accessible to all registered users as a preview. You can attempt the first daily exam free of charge. Full programme access requires payment before Day 2 begins.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-white py-16 sm:py-24" style={{ boxShadow: 'inset 0 1px 0 rgba(16,24,40,0.05), inset 0 -1px 0 rgba(16,24,40,0.05)' }}>
      <Container>
        <SectionHeading
          label="FAQ"
          labelTone="sky"
          title="Questions, answered honestly"
          sub="Everything you need to know before joining. Anything else — we're one WhatsApp message away."
        />

        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
              {FAQS.map((item, i) => {
                const isOpen = open === i
                return (
                  <div key={i}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50/70"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-button-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                    >
                      <span className="text-[15px] font-semibold text-gray-900">{item.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
                      />
                    </button>
                    <div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                      className="grid transition-[grid-template-rows] duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-5 text-[14px] leading-relaxed text-gray-600">{item.a}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 text-center text-[13.5px] text-gray-500">
              Still unsure?{' '}
              <a
                href="https://wa.me/917200132957"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle size={14} /> Ask us directly
              </a>{' '}
              — we reply fast.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
