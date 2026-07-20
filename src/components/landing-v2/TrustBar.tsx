'use client'

/**
 * Landing v2 — trust strip.
 * Slim credibility band directly under the hero: government registration
 * (MSME Udyam), risk reversal, free preview, and human support. The MSME chip
 * links to the registration section on /about and reveals the real Udyam
 * number on hover (title attribute). Facts come from src/data/contact.
 * Bilingual (EN-Tanglish / தமிழ்) via useLang.
 */
import Link from 'next/link'
import { Check, MessageCircle, ShieldCheck } from './icons'
import { MSME_LABEL, MSME_REG_NO } from '@/src/data/contact'
import { useLang } from './lang'

const ITEMS = {
  en: [
    'Performance-linked refund',
    'Day 1 free — try pannunga, apparam pay pannunga',
    'WhatsApp-la real human support — direct-ah pesunga',
  ],
  ta: [
    'செயல்திறன்-இணைந்த ரீஃபண்ட்',
    'முதல் நாள் இலவசம் — முயற்சி செய்யுங்கள், பிறகு பணம் செலுத்துங்கள்',
    'WhatsApp-இல் உண்மையான மனித ஆதரவு — நேரடியாகப் பேசுங்கள்',
  ],
}

export default function TrustBar() {
  const { lang, t } = useLang()
  return (
    <section aria-label="Why you can trust CentuMania" className="border-y border-gray-200/60 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2.5 px-5 py-4 sm:px-8">
        <Link
          href="/about#registration"
          title={`Udyam Registration No: ${MSME_REG_NO}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700 transition-colors hover:text-emerald-800"
        >
          <ShieldCheck size={15} className="shrink-0" />
          {t(MSME_LABEL, 'MSME (Udyam) பதிவு — இந்திய அரசு')}
        </Link>
        {ITEMS[lang].map((text, i) => (
          <span key={text} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600">
            {i === ITEMS[lang].length - 1
              ? <MessageCircle size={14} className="shrink-0 text-emerald-600" />
              : <Check size={14} className="shrink-0 text-emerald-600" />}
            {text}
          </span>
        ))}
      </div>
    </section>
  )
}
