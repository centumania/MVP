'use client'

/**
 * Landing v2 — FAQ.
 * Accessible accordion (button + region semantics), animated expansion
 * via CSS grid-rows trick — no measurement code, no dependencies.
 * Bilingual (EN/தமிழ்) via useLang.
 */
import { useState } from 'react'
import { ChevronDown, MessageCircle } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const FAQS = {
  en: [
    {
      q: "What if I miss a day's exam?",
      a: "If you miss the 6:00–8:30 AM window, that day's exam is automatically marked as missed. Your rank won't update for that day and consecutive misses affect your streak. The programme rewards consistency — plan your schedule before you start.",
    },
    {
      q: 'Which exams does CentuMania cover?',
      a: "CentuMania is building one disciplined platform for India's major competitive government exams — SSC (CGL, CHSL, MTS, CPO), RRB (NTPC, Group D), Banking, and Tamil Nadu & Puducherry state government exams. Every batch is calibrated to its exam's syllabus and question pattern, and more exams are being added — more exams coming soon.",
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
  ],
  ta: [
    {
      q: 'ஒரு நாள் தேர்வைத் தவறவிட்டால் என்ன ஆகும்?',
      a: 'காலை 6:00–8:30 நேரத்தைத் தவறவிட்டால், அன்றைய தேர்வு தானாகவே தவறியதாகப் பதிவாகும். அன்றைக்கு உங்கள் தரவரிசை புதுப்பிக்கப்படாது; தொடர்ந்து தவறினால் உங்கள் தொடர்ச்சி பாதிக்கப்படும். இந்தத் திட்டம் சீரான வருகைக்கு வெகுமதி தருகிறது — தொடங்கும் முன் உங்கள் அட்டவணையைத் திட்டமிடுங்கள்.',
    },
    {
      q: 'CentuMania எந்தெந்தத் தேர்வுகளை உள்ளடக்குகிறது?',
      a: 'இந்தியாவின் முக்கியப் போட்டித் தேர்வுகளுக்கான ஒரே ஒழுக்கமான தளத்தை CentuMania உருவாக்குகிறது — SSC (CGL, CHSL, MTS, CPO), RRB (NTPC, Group D), வங்கி, தமிழ்நாடு & புதுச்சேரி அரசுத் தேர்வுகள். ஒவ்வொரு batch-ும் அந்தத் தேர்வின் பாடத்திட்டம் மற்றும் கேள்வி முறைக்கு ஏற்ப அமைக்கப்படுகிறது. மேலும் பல தேர்வுகள் விரைவில்.',
    },
    {
      q: 'தேர்வுகள் எந்த மொழியில் இருக்கும்?',
      a: 'தேர்வுகள் ஆங்கிலம் மற்றும் தமிழில் கிடைக்கும். கணக்கு அமைப்புகளில் உங்களுக்கு விருப்பமான மொழியை மாற்றிக்கொள்ளலாம்.',
    },
    {
      q: 'ரீஃபண்ட் எப்படி வேலை செய்கிறது?',
      a: 'இரண்டு வழிகள். முழு ரீஃபண்ட்: எல்லா தினசரி தேர்வுகளையும் எழுதி, சராசரி 50%-க்கும் குறைவாக இருந்தால், திட்டம் முடிந்த 7 நாட்களுக்குள் விண்ணப்பியுங்கள். Centum வெகுமதிகள்: Centum Index 75+ உடன் முடித்தால், உங்கள் நிலைக்கு ஏற்ப கட்டணத்தில் 25–50% திரும்பப் பெறுங்கள். இரண்டும் உங்கள் தரவிலிருந்து தானாகச் சரிபார்க்கப்படும்.',
    },
    {
      q: 'திட்டத்தின் நடுவில் சேரலாமா?',
      a: 'முடியாது. ஒவ்வொரு batch-ும் குறிப்பிட்ட தேதியில் தொடங்கி குறிப்பிட்ட காலம் நடக்கும். இது வேண்டுமென்றே — தரவரிசை ஒவ்வொரு batch-க்கும் மீட்டமைக்கப்படுவதால், எல்லோரும் சம நிலையில் போட்டியிடுகிறார்கள். முழு அனுபவத்திற்கும் ரீஃபண்ட் தகுதிக்கும் அடுத்த batch-இல் சேருங்கள்.',
    },
    {
      q: 'இலவச முயற்சி உண்டா?',
      a: 'ஒவ்வொரு batch-இன் முதல் நாள் பதிவு செய்த அனைவருக்கும் முன்னோட்டமாகக் கிடைக்கும். முதல் தினசரி தேர்வை இலவசமாக எழுதலாம். இரண்டாம் நாள் தொடங்கும் முன் முழு அணுகலுக்குக் கட்டணம் தேவை.',
    },
  ],
}

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const { lang, t } = useLang()

  return (
    <section id="faq" className="bg-white py-16 sm:py-24" style={{ boxShadow: 'inset 0 1px 0 rgba(16,24,40,0.05), inset 0 -1px 0 rgba(16,24,40,0.05)' }}>
      <Container>
        <SectionHeading
          label={t('FAQ', 'கேள்விகள்')}
          labelTone="sky"
          title={t('Questions, answered honestly', 'கேள்விகளுக்கு நேர்மையான பதில்கள்')}
          sub={t(
            'Everything you need to know before joining. Anything else — we\'re one WhatsApp message away.',
            'சேரும் முன் தெரிந்துகொள்ள வேண்டியது எல்லாம். வேறு எதுவும் — ஒரு WhatsApp செய்தி தூரத்தில் இருக்கிறோம்.',
          )}
        />

        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
              {FAQS[lang].map((item, i) => {
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
                        className={`shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
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
              {t('Still unsure?', 'இன்னும் சந்தேகமா?')}{' '}
              <a
                href="https://wa.me/917200132957"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle size={14} /> {t('Ask us directly', 'நேரடியாகக் கேளுங்கள்')}
              </a>{' '}
              {t('— we reply fast.', '— விரைவில் பதில் தருவோம்.')}
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
