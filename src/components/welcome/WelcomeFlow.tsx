'use client'

/**
 * WelcomeFlow — the brand-first entry experience at "/welcome".
 *
 *   Step 0  Language gate  → English / தமிழ் (brand-decode + trust)
 *   Step 1-4 Auto-advancing onboarding MCQs (exam · stage · daily hours · source)
 *            — selecting an option auto-advances; this is the lead/data capture.
 *   Done    → saves { lang, exam, stage, hours, source } to localStorage
 *            (cm_lang + cm_onboarding), fires a best-effort POST to /api/leads,
 *            and returns to the landing "/". Returning visitors skip straight
 *            past the gate (the "/" guard only sends first-timers here).
 *
 * Theme-locked: light theme, existing font var, sky/emerald/amber/gray only.
 * Motion is CSS-only and reduced-motion safe.
 */
import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  WHATSAPP_LINK, WHATSAPP_DISPLAY, WHATSAPP_HOURS, MSME_LABEL, MSME_REG_NO,
} from '@/src/data/contact'

// English + Tamil only — mirrors the bilingual exam medium and professional
// competitor norm. (Tanglish stays a marketing *tone*, never a formal option.)
type Lang = 'en' | 'ta'
const LANGS: { code: Lang; name: string; sample: string; aria: string }[] = [
  { code: 'en', name: 'English', sample: 'Clean, professional English.', aria: 'Continue in English' },
  { code: 'ta', name: 'தமிழ்',   sample: 'முழுவதும் தமிழில் — தெளிவாக.',  aria: 'தமிழில் தொடரவும்' },
]

// Localised onboarding. `value` is the language-neutral key we store.
type Opt = { value: string; en: string; ta: string; tanglish: string }
type Q = { key: 'exam' | 'stage' | 'hours' | 'source'; en: string; ta: string; tanglish: string; opts: Opt[] }
const QUESTIONS: Q[] = [
  {
    key: 'exam',
    en: 'Which exam are you preparing for?',
    ta: 'நீங்கள் எந்தத் தேர்வுக்குத் தயாராகிறீர்கள்?',
    tanglish: 'Neenga edhu exam-ku prepare panreenga?',
    opts: [
      { value: 'SSC',     en: 'SSC (CGL / CHSL / MTS)', ta: 'SSC (CGL / CHSL / MTS)', tanglish: 'SSC (CGL / CHSL / MTS)' },
      { value: 'LDC',     en: 'Puducherry / TN — LDC', ta: 'புதுச்சேரி / தமிழ்நாடு — LDC', tanglish: 'Puducherry / TN — LDC' },
      { value: 'Banking', en: 'Banking (IBPS / SBI)',   ta: 'வங்கி (IBPS / SBI)',     tanglish: 'Banking (IBPS / SBI)' },
      { value: 'RRB',     en: 'Railways (RRB)',         ta: 'ரயில்வே (RRB)',          tanglish: 'Railways (RRB)' },
      { value: 'TNGovt',  en: 'TN Govt (TNPSC)',        ta: 'தமிழ்நாடு அரசு (TNPSC)',  tanglish: 'TN Govt (TNPSC)' },
      { value: 'Other',   en: 'Something else',         ta: 'வேறு ஏதேனும்',           tanglish: 'Vera edhachum' },
    ],
  },
  {
    key: 'stage',
    en: 'Where are you in your preparation?',
    ta: 'உங்கள் தயாரிப்பு எந்த நிலையில் உள்ளது?',
    tanglish: 'Ungaloda prep eppo iruku?',
    opts: [
      { value: 'starting', en: 'Just starting out',   ta: 'இப்போதுதான் தொடங்குகிறேன்', tanglish: 'Ippo dhaan start panren' },
      { value: 'months',   en: 'A few months in',      ta: 'சில மாதங்களாக',            tanglish: 'Konja months aachu' },
      { value: 'near',     en: 'My exam is near',      ta: 'என் தேர்வு நெருங்கிவிட்டது', tanglish: 'Exam romba close-la iruku' },
    ],
  },
  {
    key: 'hours',
    en: 'How many hours can you study daily?',
    ta: 'தினமும் எத்தனை மணி நேரம் படிக்க முடியும்?',
    tanglish: 'Dhinam evlo hours padikka mudiyum?',
    opts: [
      { value: 'lt1', en: 'Less than 1 hour', ta: '1 மணி நேரத்திற்கும் குறைவாக', tanglish: '1 hour-ku kammi' },
      { value: '1-2', en: '1–2 hours',        ta: '1–2 மணி நேரம்',             tanglish: '1–2 hours' },
      { value: '2-4', en: '2–4 hours',        ta: '2–4 மணி நேரம்',             tanglish: '2–4 hours' },
      { value: '4+',  en: '4+ hours',         ta: '4+ மணி நேரம்',              tanglish: '4+ hours' },
    ],
  },
  {
    key: 'source',
    en: 'How did you hear about CentuMania?',
    ta: 'CentuMania பற்றி எப்படித் தெரிந்துகொண்டீர்கள்?',
    tanglish: 'CentuMania-va epdi theriஞ்சuko?',
    opts: [
      { value: 'whatsapp',  en: 'WhatsApp',        ta: 'WhatsApp',    tanglish: 'WhatsApp' },
      { value: 'instagram', en: 'Instagram',       ta: 'Instagram',   tanglish: 'Instagram' },
      { value: 'friend',    en: 'A friend told me', ta: 'நண்பர் சொன்னார்', tanglish: 'Friend sonnaanga' },
      { value: 'search',    en: 'Google / Search',  ta: 'Google / தேடல்', tanglish: 'Google / Search' },
    ],
  },
]

const UI = {
  chooseTitle: { en: 'Continue in…', ta: 'எந்த மொழியில் தொடர விரும்புகிறீர்கள்?', tanglish: 'Edhu language-la continue panreenga?' },
  q: { en: 'Question', ta: 'கேள்வி', tanglish: 'Question' },
  of: { en: 'of', ta: '/', tanglish: '/' },
  back: { en: 'Back', ta: 'பின்செல்', tanglish: 'Back' },
  finishing: { en: 'Setting up your plan…', ta: 'உங்கள் திட்டம் தயாராகிறது…', tanglish: 'Ungaloda plan ready aaguthu…' },
}

export default function WelcomeFlow() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang | null>(null)
  const [step, setStep] = useState(0) // 0..QUESTIONS.length-1 (only once lang chosen)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [finishing, setFinishing] = useState(false)
  const t = (o: { en: string; ta: string; tanglish: string }) => (lang ? o[lang] : o.en)

  const finish = useCallback((finalAnswers: Record<string, string>, chosen: Lang) => {
    setFinishing(true)
    const payload = { lang: chosen, ...finalAnswers, ts: new Date().toISOString() }
    try {
      localStorage.setItem('cm_lang', chosen)
      localStorage.setItem('cm_onboarding', JSON.stringify(payload))
    } catch { /* private mode — proceed anyway */ }
    // Best-effort lead capture; never blocks the redirect.
    try {
      fetch('/api/leads', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    } catch { /* ignore */ }
    // Small beat so the "setting up" state reads as intentional, then to the landing.
    setTimeout(() => router.replace('/?stay=1'), 550)
  }, [router])

  function chooseLang(code: Lang) {
    try { localStorage.setItem('cm_lang', code) } catch { /* ignore */ }
    // Already onboarded before? Pick language → straight to the site (no repeat
    // survey, and without overwriting the saved answers).
    let done = false
    try { done = !!localStorage.getItem('cm_onboarding') } catch { /* ignore */ }
    if (done) { setFinishing(true); setTimeout(() => router.replace('/?stay=1'), 350); return }
    setLang(code)
    setStep(0)
  }

  function pick(qKey: string, value: string) {
    const next = { ...answers, [qKey]: value }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      // brief highlight before auto-advance
      setTimeout(() => setStep(step + 1), 180)
    } else {
      finish(next, lang as Lang)
    }
  }

  const progressPct = lang ? Math.round(((step + (finishing ? 1 : 0)) / QUESTIONS.length) * 100) : 0

  return (
    <main
      className="wf-root relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12 text-gray-900 antialiased sm:px-6"
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#FAFAF8]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 wf-glow" />

      {/* Brand */}
      <div className="flex flex-col items-center text-center">
        <span className="wf-logo inline-flex">
          <Image src="/centumania-logo.png" alt="CentuMania logo" width={64} height={64} priority className="rounded-2xl" />
        </span>
        <h1 className="mt-4 text-[26px] font-extrabold leading-none tracking-tight sm:text-[32px]" style={{ letterSpacing: '-0.03em' }}>
          Centu<span className="text-sky-600">Mania</span>
        </h1>
        <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-gray-200/90 bg-white/80 px-3.5 py-1.5 text-[12px] shadow-sm">
          <span className="font-extrabold text-sky-600">CentuM</span>
          <span className="text-gray-500">= 100/100 marks</span>
          <span className="text-gray-300">+</span>
          <span className="font-extrabold text-amber-600">Mania</span>
          <span className="text-gray-500">= obsession</span>
        </div>
      </div>

      {/* Card */}
      <div className="wf-card mt-7 w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_10px_40px_-18px_rgba(16,24,40,0.25)] sm:p-7">
        {/* progress (only after language chosen) */}
        {lang && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-[11.5px] font-semibold text-gray-400">
              <span>{finishing ? t(UI.finishing) : `${t(UI.q)} ${step + 1} ${t(UI.of)} ${QUESTIONS.length}`}</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-sky-600 transition-all duration-300" style={{ width: `${Math.max(progressPct, 6)}%` }} />
            </div>
          </div>
        )}

        {/* STEP 0 — language gate */}
        {!lang && (
          <div>
            <p className="mb-4 text-center text-[13.5px] font-semibold text-gray-500">{UI.chooseTitle.en}</p>
            <p className="-mt-3 mb-4 text-center text-[12.5px] text-gray-400">{UI.chooseTitle.ta}</p>
            <div className="grid gap-3">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => chooseLang(l.code)}
                  aria-label={l.aria}
                  className="wf-opt group flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  <span>
                    <span className="block text-[18px] font-extrabold tracking-tight text-gray-900">{l.name}</span>
                    <span className="mt-0.5 block text-[12.5px] text-gray-500">{l.sample}</span>
                  </span>
                  <span className="wf-arrow flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEPS 1-4 — onboarding MCQs (auto-advance) */}
        {lang && !finishing && (
          <div key={step} className="wf-fade">
            <h2 className="mb-4 text-[19px] font-extrabold leading-snug tracking-tight text-gray-900 sm:text-[21px]">
              {t(QUESTIONS[step])}
            </h2>
            <div className="grid gap-2.5">
              {QUESTIONS[step].opts.map((o) => {
                const selected = answers[QUESTIONS[step].key] === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() => pick(QUESTIONS[step].key, o.value)}
                    className={`wf-opt flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                      selected ? 'border-sky-500 bg-sky-50 text-sky-800' : 'border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-sky-500 bg-sky-500' : 'border-gray-300'}`}>
                      {selected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    {t(o)}
                  </button>
                )
              })}
            </div>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-gray-400 transition-colors hover:text-gray-600"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                {t(UI.back)}
              </button>
            )}
          </div>
        )}

        {/* finishing spinner */}
        {finishing && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
            <p className="text-[13.5px] font-semibold text-gray-500">{t(UI.finishing)}</p>
          </div>
        )}
      </div>

      {/* Trust footer */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <span title={MSME_REG_NO} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
          </svg>
          {MSME_LABEL}
        </span>
        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" title={WHATSAPP_HOURS}
          className="wf-chip inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white px-3 py-1.5 text-[11.5px] font-bold text-emerald-700 outline-none transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.5-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.8-1.8c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.5 9c0 1.7 1.2 3.3 1.4 3.5a9.4 9.4 0 0 0 3.9 3.3c1.4.6 1.9.6 2.6.5.4 0 1.4-.5 1.6-1.1.2-.6.2-1 .1-1.1z" />
          </svg>
          {WHATSAPP_DISPLAY}
        </a>
      </div>

      <style>{`
        .wf-glow{ background:
          radial-gradient(56rem 28rem at 78% -10%, rgba(2,132,199,0.10), transparent 60%),
          radial-gradient(46rem 24rem at 12% 6%, rgba(16,185,129,0.05), transparent 60%); }
        .wf-opt{ transition: transform .18s cubic-bezier(.2,.7,.2,1), box-shadow .18s ease, border-color .18s ease; }
        .wf-arrow{ transition: transform .18s cubic-bezier(.2,.7,.2,1), background-color .18s ease; }
        .wf-fade{ animation: wfFade .28s ease both; }
        @keyframes wfFade{ from{ opacity:0; transform: translateY(6px) } to{ opacity:1; transform:none } }
        @media (prefers-reduced-motion: no-preference){
          .wf-opt:hover{ transform: translateY(-2px); box-shadow: 0 12px 26px -14px rgba(2,132,199,.35); border-color: rgba(2,132,199,.4); }
          .wf-opt:hover .wf-arrow{ transform: translateX(3px); }
          .wf-logo{ display:inline-block; animation: wfFloat 5s ease-in-out infinite; }
          .wf-chip:hover{ transform: translateY(-1px); }
          @keyframes wfFloat{ 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-5px) } }
        }
        @media (prefers-reduced-motion: reduce){ .wf-fade{ animation: none } }
      `}</style>
    </main>
  )
}
