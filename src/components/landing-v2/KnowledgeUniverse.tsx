'use client'

// The neural "knowledge universe" — moved out of the hero (which now shows a live
// demo) into its own band lower on the page.
import NeuralMap from './NeuralMap'
import { Reveal } from './ui'
import { useLang } from './lang'

const LEGEND: { en: string; ta: string; color: string }[] = [
  { en: 'General Studies', ta: 'பொது அறிவு', color: '#0284c7' },
  { en: 'Aptitude', ta: 'Aptitude', color: '#6366f1' },
  { en: 'Reasoning', ta: 'Reasoning', color: '#059669' },
  { en: 'English', ta: 'ஆங்கிலம்', color: '#d97706' },
  { en: 'Tamil', ta: 'தமிழ்', color: '#e11d48' },
  { en: 'Current Affairs', ta: 'நடப்பு நிகழ்வுகள்', color: '#7c3aed' },
]

export default function KnowledgeUniverse() {
  const { lang, t } = useLang()
  return (
    <section id="knowledge-universe" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <Reveal>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">{t('One connected syllabus', 'இணைந்த ஒரே பாடத்திட்டம்')}</p>
          <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-gray-900 sm:text-[32px]">{t('Your knowledge universe', 'உங்கள் அறிவு பிரபஞ்சம்')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-gray-600">
            {t(
              'Every subject you\'ll master — woven into one disciplined path for SSC, RRB, Banking & TN-Govt exams.',
              'நீங்கள் தேர்ச்சி பெறப்போகும் ஒவ்வொரு பாடமும் — SSC, RRB, வங்கி & TN அரசுத் தேர்வுகளுக்கான ஒரே ஒழுக்கமான பாதையில் இணைக்கப்பட்டுள்ளது.',
            )}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative mx-auto mt-7 max-w-lg overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-[0_1px_3px_rgba(16,24,40,0.07),0_24px_48px_-12px_rgba(16,24,40,0.12)] backdrop-blur-sm sm:p-5">
            <div className="relative h-[320px] w-full sm:h-[380px]">
              <NeuralMap />
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5">
              {LEGEND.map((item) => (
                <span key={item.en} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  {item[lang]}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
