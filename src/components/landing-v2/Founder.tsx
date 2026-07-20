'use client'

/**
 * Landing v2 — founder trust section.
 * Real facts only: name, credentials, MSME registration and WhatsApp
 * contact all come from src/data/contact.ts. No stock photos — an
 * initials avatar stands in until a real portrait file is added.
 * Bilingual (EN-Tanglish / தமிழ்) via useLang.
 */
import Link from 'next/link'
import { ArrowRight, MessageCircle, ShieldCheck } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'
import {
  FOUNDER_NAME,
  FOUNDER_CREDENTIALS,
  FOUNDER_CITY,
  MSME_LABEL,
  MSME_REG_NO,
  WHATSAPP_DISPLAY,
  WHATSAPP_LINK,
} from '@/src/data/contact'

/* Premium 3D tilt + CTA sheen. Transform/box-shadow only (no layout
   animation); everything lives inside prefers-reduced-motion: no-preference
   so reduced-motion users get a plain static card. */
const FOUNDER3D_CSS = `
@media (prefers-reduced-motion: no-preference){
  .founder3d-wrap{perspective:1100px;}
  .founder3d-card{transform-style:preserve-3d;transition:transform .24s cubic-bezier(.21,.65,.36,1),box-shadow .24s ease;}
  .founder3d-wrap:hover .founder3d-card{transform:rotateX(2.5deg) rotateY(-2deg) translateY(-6px);box-shadow:0 24px 48px -12px rgba(14,165,233,.22),0 8px 24px -8px rgba(99,102,241,.16);}
  .founder3d-pop{transition:transform .24s cubic-bezier(.21,.65,.36,1);}
  .founder3d-wrap:hover .founder3d-pop{transform:translateZ(28px);}
  .founder3d-cta{position:relative;overflow:hidden;}
  .founder3d-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-130%);transition:transform .5s ease;pointer-events:none;}
  .founder3d-cta:hover::after{transform:translateX(130%);}
}
`

export default function Founder() {
  const { lang, t } = useLang()
  return (
    <section id="founder" className="py-16 sm:py-24">
      <style>{FOUNDER3D_CSS}</style>
      <Container>
        <SectionHeading
          label={t('Meet the founder', 'நிறுவனரைச் சந்தியுங்கள்')}
          labelTone="indigo"
          title={
            lang === 'ta'
              ? <>யார் உருவாக்கியது? <span className="text-sky-600">இவர்தான்.</span></>
              : <>Yaaru build pannadhu? <span className="text-sky-600">Ivar dhaan.</span></>
          }
          sub={t(
            'CentuMania is not a faceless ed-tech app — it was designed, engineered and is run day-to-day by its founder.',
            'CentuMania ஒரு முகமற்ற ed-tech app இல்லை — அதன் நிறுவனரே வடிவமைத்து, உருவாக்கி, தினமும் நேரடியாக நடத்துகிறார்.',
          )}
        />

        <Reveal>
          <div className="founder3d-wrap mx-auto max-w-3xl">
            <div className="founder3d-card rounded-3xl border border-gray-200/70 bg-white p-7 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-10">
              {/* ── Identity row ── */}
              <div className="flex flex-wrap items-center gap-5">
                {/*
                  Photo slot: once a real portrait exists at
                  /public/founder-prasanna.jpg, replace the <span> below with:
                  <img
                    src="/founder-prasanna.jpg"
                    alt="Prasanna Kumar, founder of CentuMania"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-sky-100"
                  />
                */}
                <span
                  aria-hidden
                  className="founder3d-pop flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[26px] font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(14,165,233,0.45)]"
                >
                  PK
                </span>
                <div className="min-w-[200px]">
                  <h3 className="text-2xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                    {FOUNDER_NAME}
                  </h3>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-sky-600">{t('Founder & CEO', 'நிறுவனர் & CEO')}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                    {FOUNDER_CREDENTIALS} · {FOUNDER_CITY}
                  </p>
                </div>
              </div>

              {/* ── Story ── */}
              <p className="mt-6 text-[15px] leading-relaxed text-gray-700">
                {t(
                  'Aspirants fail aagurathu material illaama illa — material-la drown aagi dhaan. So Prasanna made discipline itself the product: a 6 AM exam you can\'t negotiate with, an honest leaderboard, an AI mentor that reviews every answer. Exam engine, AI mentor, live current-affairs pipeline — ellame end-to-end, one engineer built it. One person accountable — every exam, every rank, every rupee.',
                  'மாணவர்கள் தோற்பது material இல்லாததால் அல்ல — material-இல் மூழ்கிப்போவதால்தான். எனவே Prasanna ஒழுக்கத்தையே product ஆக்கினார்: பேரம் பேச முடியாத காலை 6 மணி தேர்வு, நேர்மையான தரவரிசை, ஒவ்வொரு பதிலையும் ஆய்வு செய்யும் AI வழிகாட்டி. தேர்வு engine, AI வழிகாட்டி, நேரடி நடப்பு நிகழ்வுகள் pipeline — எல்லாமே ஒரே engineer உருவாக்கியது. ஒவ்வொரு தேர்வுக்கும், தரவரிசைக்கும், ரூபாய்க்கும் ஒருவரே பொறுப்பு.',
                )}
              </p>

              {/* ── CTAs ── */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="founder3d-cta group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-[14.5px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(2,132,199,0.45)] transition-colors hover:bg-sky-700 sm:w-auto"
                >
                  {t('Start pannunga — Day 1 free', 'தொடங்குங்கள் — முதல் நாள் இலவசம்')}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-[14.5px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  {t('Full story', 'முழு கதை')}
                </Link>
              </div>

              {/* ── Registration + contact facts ── */}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-gray-100 pt-5">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                  {MSME_LABEL} · {MSME_REG_NO}
                </span>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 py-1.5 text-[12px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MessageCircle size={13} />
                  {WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
