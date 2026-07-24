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
      q: "What do I get with the subscription?",
      a: "Everything, one price: a daily AI-personalised test, an AI mentor report after every attempt, the full classroom (video + notes per subject), interactive study modules, daily exam-tuned current affairs, a live batch leaderboard, and your Centum Index — all in English and Tamil. No add-ons, no upsells.",
    },
    {
      q: 'Is it a subscription or a one-time payment?',
      a: "It's a subscription per exam — pay monthly, or go annual and get 2 months free. Billing is automatic and you can cancel anytime from your account; you keep full access until the end of the period you've paid for.",
    },
    {
      q: 'Is there a free trial?',
      a: "Yes — Day 1 is free, no card needed to start. Take a real daily test, open a classroom lesson and see your Centum Index move before you decide to subscribe.",
    },
    {
      q: 'Can I cancel anytime?',
      a: "Anytime, in two taps, no lock-in and no cancellation fee. You won't be charged again, and your access stays live until your current month or year runs out.",
    },
    {
      q: 'Which exams does CentuMania cover?',
      a: "SSC (CGL, CHSL, MTS, CPO), RRB (NTPC, Group D), Banking (IBPS & SBI PO/Clerk), UDC and Tamil Nadu & Puducherry state government exams. Each track is tuned to its exam's syllabus and question pattern — and more exams are being added.",
    },
    {
      q: 'What is the Centum Index?',
      a: "It's your real readiness score, updated daily. It blends attendance (did you show up and take the daily test?) with mastery (are you getting your first attempts right?). Unlike raw marks, it can't be gamed — showing up every day is what moves it, and it's the single best predictor of clearing the exam.",
    },
    {
      q: 'What language is everything in?',
      a: "English and Tamil, across the whole platform — tests, materials, classroom and current affairs. Switch your language anytime with one tap.",
    },
  ],
  ta: [
    {
      q: 'சந்தாவில் எனக்கு என்ன கிடைக்கும்?',
      a: 'எல்லாமே, ஒரே விலையில்: தினசரி AI தனிப்பயன் தேர்வு, ஒவ்வொரு முயற்சிக்குப் பின் AI வழிகாட்டி அறிக்கை, முழு classroom (பாடத்திற்கு வீடியோ + குறிப்புகள்), ஊடாடும் படிப்பு பாடங்கள், தேர்வுக்கு ஏற்ற தினசரி நடப்பு நிகழ்வுகள், நேரடி batch தரவரிசை, மற்றும் உங்கள் Centum Index — ஆங்கிலம் & தமிழில். கூடுதல் கட்டணம் இல்லை.',
    },
    {
      q: 'இது சந்தாவா அல்லது ஒருமுறை கட்டணமா?',
      a: 'ஒவ்வொரு தேர்வுக்கும் ஒரு சந்தா — மாதந்தோறும் செலுத்துங்கள், அல்லது ஆண்டுத் திட்டத்தில் 2 மாதம் இலவசம். கட்டணம் தானாகச் செலுத்தப்படும்; எப்போது வேண்டுமானாலும் கணக்கிலிருந்து நிறுத்தலாம். செலுத்திய காலம் முடியும் வரை முழு அணுகல் தொடரும்.',
    },
    {
      q: 'இலவச முயற்சி உண்டா?',
      a: 'ஆம் — முதல் நாள் இலவசம், தொடங்க கார்டு தேவையில்லை. உண்மையான தினசரி தேர்வை எழுதுங்கள், ஒரு classroom பாடத்தைத் திறங்கள், சந்தா செலுத்தும் முன் உங்கள் Centum Index நகர்வதைப் பாருங்கள்.',
    },
    {
      q: 'எப்போது வேண்டுமானாலும் நிறுத்தலாமா?',
      a: 'எப்போது வேண்டுமானாலும், இரண்டு தட்டுகளில் — கட்டுப்பாடு இல்லை, நிறுத்தக் கட்டணம் இல்லை. மீண்டும் கட்டணம் விதிக்கப்படாது; உங்கள் நடப்பு மாதம்/ஆண்டு முடியும் வரை அணுகல் தொடரும்.',
    },
    {
      q: 'CentuMania எந்தெந்தத் தேர்வுகளை உள்ளடக்குகிறது?',
      a: 'SSC (CGL, CHSL, MTS, CPO), RRB (NTPC, Group D), வங்கி (IBPS & SBI PO/Clerk), UDC மற்றும் தமிழ்நாடு & புதுச்சேரி அரசுத் தேர்வுகள். ஒவ்வொரு பாதையும் அந்தத் தேர்வின் பாடத்திட்டம் & கேள்வி முறைக்கு ஏற்ப அமைக்கப்பட்டுள்ளது — மேலும் பல தேர்வுகள் விரைவில்.',
    },
    {
      q: 'Centum Index என்றால் என்ன?',
      a: 'இது தினமும் புதுப்பிக்கப்படும் உங்கள் உண்மையான தயார்நிலை மதிப்பெண். வருகை (தினசரி தேர்வு எழுதினீர்களா?) + தேர்ச்சி (முதல் முயற்சியில் சரியாகச் செய்கிறீர்களா?) இரண்டையும் இணைக்கிறது. வெறும் மதிப்பெண்களைப் போல் இதை ஏமாற்ற முடியாது — தினமும் வருவதே இதை நகர்த்தும், தேர்வில் வெற்றிக்கான சிறந்த அறிகுறியும் இதுவே.',
    },
    {
      q: 'எல்லாம் எந்த மொழியில் இருக்கும்?',
      a: 'ஆங்கிலம் & தமிழ், முழுத் தளத்திலும் — தேர்வுகள், பாடங்கள், classroom, நடப்பு நிகழ்வுகள். ஒரு தட்டில் உங்கள் மொழியை மாற்றிக்கொள்ளுங்கள்.',
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
