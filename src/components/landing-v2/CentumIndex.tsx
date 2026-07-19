'use client'

/**
 * Landing v2 — Centum Index explainer.
 * Formula and tiers mirror production code exactly:
 *   centum_index = attendance×60% + node_index×40%   (calculate_centum_index)
 *   tiers: ≥95 Gold (50% refund) · ≥85 Silver (35%) · ≥75 Bronze (25%)  (getRefundTier)
 * Bilingual (EN/தமிழ்) via useLang.
 */
import { Medal, Target, Calendar } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const TIERS = [
  { name: 'Gold', threshold: '95+', reward: { en: '50% refund reward', ta: '50% ரீஃபண்ட் வெகுமதி' }, ring: 'ring-amber-300/70', bg: 'bg-amber-50', text: 'text-amber-700', bar: '#f59e0b' },
  { name: 'Silver', threshold: '85+', reward: { en: '35% refund reward', ta: '35% ரீஃபண்ட் வெகுமதி' }, ring: 'ring-gray-300/80', bg: 'bg-gray-50', text: 'text-gray-600', bar: '#94a3b8' },
  { name: 'Bronze', threshold: '75+', reward: { en: '25% refund reward', ta: '25% ரீஃபண்ட் வெகுமதி' }, ring: 'ring-orange-300/60', bg: 'bg-orange-50', text: 'text-orange-700', bar: '#fb923c' },
]

export default function CentumIndex() {
  const { lang, t } = useLang()
  return (
    <section id="centum-index" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          label="Centum Index™"
          labelTone="amber"
          title={t('One score that measures your discipline', 'உங்கள் ஒழுக்கத்தை அளக்கும் ஒரே மதிப்பெண்')}
          sub={t(
            'Marks fluctuate. Discipline compounds. The Centum Index tracks the two things that actually predict selection — showing up and mastering what you study.',
            'மதிப்பெண்கள் மாறும். ஒழுக்கம் வளரும். தேர்வாவதை உண்மையில் தீர்மானிக்கும் இரண்டு விஷயங்களை Centum Index கண்காணிக்கிறது — தவறாமல் வருவது, படித்ததில் தேர்ச்சி பெறுவது.',
          )}
        />

        <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Formula card */}
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">{t('How it\'s calculated', 'எப்படி கணக்கிடப்படுகிறது')}</h3>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Calendar size={16} /></span>
                      {t('Attendance', 'வருகை')}
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-sky-600">60%</span>
                  </div>
                  <p className="ml-10 mt-1.5 text-[13px] leading-relaxed text-gray-500">
                    {t(
                      'Did you take every daily test? Showing up is the single biggest predictor of clearing the exam.',
                      'ஒவ்வொரு தினசரி தேர்வையும் எழுதினீர்களா? தவறாமல் வருவதே தேர்வில் வெற்றி பெறுவதற்கான மிகப்பெரிய அறிகுறி.',
                    )}
                  </p>
                  <div className="ml-10 mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-sky-500 to-sky-400" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Target size={16} /></span>
                      {t('Learning mastery', 'கற்றல் தேர்ச்சி')}
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-indigo-600">40%</span>
                  </div>
                  <p className="ml-10 mt-1.5 text-[13px] leading-relaxed text-gray-500">
                    {t(
                      'Did you complete your assigned learning units — and get them right on the first attempt?',
                      'உங்களுக்கு ஒதுக்கப்பட்ட பாடங்களை முடித்து, முதல் முயற்சியிலேயே சரியாகச் செய்தீர்களா?',
                    )}
                  </p>
                  <div className="ml-10 mt-2.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <div className="rounded-xl bg-gray-50 px-5 py-4 text-center">
                  <span className="text-[13px] font-medium text-gray-500">{t('Your Centum Index = ', 'உங்கள் Centum Index = ')}</span>
                  <span className="text-[13px] font-bold text-sky-700">{t('Attendance × 60%', 'வருகை × 60%')}</span>
                  <span className="text-[13px] font-medium text-gray-500"> + </span>
                  <span className="text-[13px] font-bold text-indigo-700">{t('Mastery × 40%', 'தேர்ச்சி × 40%')}</span>
                  <p className="mt-1.5 text-[12px] text-gray-500">{t('Recalculated daily. Fully automatic. Impossible to game.', 'தினமும் மறு கணக்கீடு. முழுவதும் தானியங்கி. ஏமாற்றவே முடியாது.')}</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Tiers card */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05)] sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Medal size={18} /></span>
                <h3 className="text-lg font-bold tracking-tight text-gray-900">{t('Discipline pays. Literally.', 'ஒழுக்கத்திற்கு ஊதியம். உண்மையாகவே.')}</h3>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-gray-600">
                {t(
                  'Finish the programme with a high Centum Index and earn back part of your fee — a reward for the discipline that gets people selected.',
                  'உயர்ந்த Centum Index உடன் திட்டத்தை முடித்தால் உங்கள் கட்டணத்தின் ஒரு பகுதி திரும்பக் கிடைக்கும் — தேர்வாக்கும் ஒழுக்கத்திற்கான வெகுமதி.',
                )}
              </p>

              <div className="mt-6 space-y-3">
                {TIERS.map((t) => (
                  <div key={t.name} className={`flex items-center gap-4 rounded-xl ${t.bg} px-4 py-3.5 ring-1 ${t.ring}`}>
                    <span className={`text-[14px] font-extrabold ${t.text}`}>{t.name}</span>
                    <div className="ml-auto text-right">
                      <div className="text-[13px] font-bold text-gray-900">Index {t.threshold}</div>
                      <div className={`text-[12px] font-semibold ${t.text}`}>{t.reward[lang]}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-auto pt-5 text-[12px] leading-relaxed text-gray-500">
                {t(
                  'Refund rewards are computed automatically from your Centum Index at programme end. No forms, no negotiation — the data decides.',
                  'திட்ட முடிவில் உங்கள் Centum Index-இலிருந்து ரீஃபண்ட் வெகுமதிகள் தானாகக் கணக்கிடப்படும். படிவம் இல்லை, பேரம் இல்லை — தரவே முடிவு செய்யும்.',
                )}
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
