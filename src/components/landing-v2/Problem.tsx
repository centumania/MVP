'use client'

/**
 * Landing v2 — "Why CentuMania" problem/solution section.
 * Replaces v1's red-✗ "Why most aspirants fail" wall with a calmer,
 * trust-building before/after comparison. Bilingual (EN/தமிழ்) via useLang.
 */
import { Check, X } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const WITHOUT = {
  en: [
    'Scattered preparation with no daily structure',
    'No accountability — easy to skip a day, then a week',
    'No benchmark against real competitors',
    'Generic material not built for the real exam pattern',
    'Motivation fades after the first week',
  ],
  ta: [
    'தினசரி திட்டம் இல்லாத சிதறிய படிப்பு',
    'கண்காணிப்பு இல்லை — ஒரு நாள் தவறினால், ஒரு வாரமே தவறும்',
    'உண்மையான போட்டியாளர்களுடன் ஒப்பீடு இல்லை',
    'உண்மையான தேர்வு முறைக்கு ஏற்ப இல்லாத பொதுவான பாடங்கள்',
    'முதல் வாரத்திற்குப் பிறகு உற்சாகம் குறைந்துவிடும்',
  ],
}

const WITH = {
  en: [
    'A fixed daily plan that covers the full syllabus',
    'A timed exam every morning at 6 AM — no exceptions',
    'A live batch leaderboard updated after every exam',
    'Questions modelled on the actual exam pattern',
    'Streaks, ranks and AI coaching that keep you going',
  ],
  ta: [
    'முழு பாடத்திட்டத்தையும் உள்ளடக்கிய உறுதியான தினசரி திட்டம்',
    'தினமும் காலை 6 மணிக்கு நேரக் கட்டுப்பாட்டுடன் தேர்வு — விதிவிலக்கே இல்லை',
    'ஒவ்வொரு தேர்வுக்குப் பிறகும் புதுப்பிக்கப்படும் நேரடி தரவரிசை',
    'உண்மையான தேர்வு முறையில் அமைக்கப்பட்ட கேள்விகள்',
    'தொடர்ச்சி, தரவரிசை, AI பயிற்சி — உங்களை முன்னேற்றிக்கொண்டே இருக்கும்',
  ],
}

export default function Problem() {
  const { lang, t } = useLang()
  return (
    <section id="why" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label={t('Why CentuMania', 'ஏன் CentuMania')}
          labelTone="sky"
          title={t('Hard work isn\'t your problem. Structure is.', 'உழைப்பு உங்கள் பிரச்சனை இல்லை. திட்டமிடல்தான்.')}
          sub={t(
            'Most aspirants don\'t fail from lack of effort — they fail from inconsistent, unmeasured effort. CentuMania replaces guesswork with a system.',
            'பெரும்பாலான மாணவர்கள் உழைப்பு இல்லாமல் தோற்பதில்லை — சீரற்ற, அளவிடப்படாத உழைப்பால்தான் தோற்கிறார்கள். CentuMania யூகத்தை ஒரு முறையான அமைப்பாக மாற்றுகிறது.',
          )}
        />

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          <Reveal delay={80}>
            <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <h3 className="text-[15px] font-bold text-gray-500">{t('Preparing alone', 'தனியாகப் படிக்கும்போது')}</h3>
              <ul className="mt-5 space-y-4">
                {WITHOUT[lang].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <X size={12} />
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-gray-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-sky-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_16px_40px_-12px_rgba(2,132,199,0.18)] sm:p-8">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
              <h3 className="text-[15px] font-bold text-sky-700">{t('Preparing with CentuMania', 'CentuMania உடன் படிக்கும்போது')}</h3>
              <ul className="mt-5 space-y-4">
                {WITH[lang].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60">
                      <Check size={12} />
                    </span>
                    <span className="text-[14.5px] font-medium leading-relaxed text-gray-800">{item}</span>
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
