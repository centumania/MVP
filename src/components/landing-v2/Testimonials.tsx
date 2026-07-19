'use client'

/**
 * Landing v2 — testimonials.
 * Same three real quotes as v1 (no invented social proof), presented
 * with cleaner typography and an honest framing. Headings are bilingual;
 * the quotes themselves stay in the language they were given in — we never
 * fabricate a translated quote.
 */
import { Star } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const TESTIMONIALS = [
  {
    quote:
      'I used to study for hours without knowing if it was actually helping. The daily exam gave me an honest score every morning. By week 3, I could see real improvement in my accuracy across subjects.',
    initials: 'AK',
    name: 'Arun K.',
    role: { en: 'SSC Aspirant', ta: 'SSC மாணவர்' },
    tone: 'from-sky-500 to-sky-600',
  },
  {
    quote:
      'The 6 AM routine was hard to keep up the first week. By week 2 it became automatic. Knowing my rank updated daily pushed me to show up even on days I felt completely unprepared.',
    initials: 'MP',
    name: 'Meena P.',
    role: { en: 'Government Exam Aspirant', ta: 'அரசுத் தேர்வு மாணவர்' },
    tone: 'from-indigo-500 to-indigo-600',
  },
  {
    quote:
      'Finally a system where I could see exactly which subjects needed work. My aptitude accuracy improved noticeably over the programme because I had a clear picture of where I was losing marks.',
    initials: 'RV',
    name: 'Ravi V.',
    role: { en: 'Competitive Exam Aspirant', ta: 'போட்டித் தேர்வு மாணவர்' },
    tone: 'from-emerald-500 to-emerald-600',
  },
]

export default function Testimonials() {
  const { lang, t } = useLang()
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('Real results', 'உண்மையான முடிவுகள்')}
          labelTone="sky"
          title={t('What disciplined preparation feels like', 'ஒழுக்கமான தயாரிப்பு எப்படி இருக்கும்')}
          sub={t('Aspirants who trusted the process — in their own words.', 'இந்த முறையை நம்பிய மாணவர்கள் — அவர்களின் சொந்த வார்த்தைகளில்.')}
        />

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <figure className="flex h-full flex-col rounded-2xl border border-gray-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(16,24,40,0.1)]">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} fill="currentColor" stroke="none" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[14px] leading-relaxed text-gray-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.tone} text-[12px] font-bold text-white`}>
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-[13.5px] font-bold text-gray-900">{t.name}</div>
                    <div className="text-[12px] text-gray-500">{t.role[lang]}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
