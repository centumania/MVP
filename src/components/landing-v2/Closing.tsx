'use client'

/**
 * Landing v2 — final CTA + footer. Bilingual (EN/தமிழ்) via useLang.
 */
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap } from './icons'
import { Reveal, Container } from './ui'
import Logo from './Logo'
import { useLang } from './lang'

type FooterLink = { label: { en: string; ta: string }; href: string; external?: boolean }
const FOOTER_COLS: { title: { en: string; ta: string }; links: FooterLink[] }[] = [
  {
    title: { en: 'Programme', ta: 'திட்டம்' },
    links: [
      { label: { en: 'Why CentuMania', ta: 'ஏன் CentuMania' }, href: '#why' },
      { label: { en: 'Features', ta: 'அம்சங்கள்' }, href: '#features' },
      { label: { en: 'Pricing', ta: 'கட்டணம்' }, href: '#pricing' },
      { label: { en: 'FAQ', ta: 'கேள்விகள்' }, href: '#faq' },
    ],
  },
  {
    title: { en: 'Company', ta: 'நிறுவனம்' },
    links: [
      { label: { en: 'About us', ta: 'எங்களைப் பற்றி' }, href: '/about' },
      { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contact' },
    ],
  },
  {
    title: { en: 'Legal', ta: 'சட்டப்பூர்வம்' },
    links: [
      { label: { en: 'Privacy policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
      { label: { en: 'Terms & conditions', ta: 'விதிமுறைகள்' }, href: '/terms' },
      { label: { en: 'Refund policy', ta: 'ரீஃபண்ட் கொள்கை' }, href: '/refund' },
    ],
  },
  {
    title: { en: 'Support', ta: 'ஆதரவு' },
    links: [
      { label: { en: 'WhatsApp support', ta: 'WhatsApp ஆதரவு' }, href: 'https://wa.me/917200132957', external: true },
      { label: { en: '+91 72001 32957', ta: '+91 72001 32957' }, href: 'https://wa.me/917200132957', external: true },
    ],
  },
]

export default function Closing() {
  const { lang, t } = useLang()
  return (
    <>
      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(760px 420px at 50% 60%, rgba(14,165,233,0.1), transparent 65%)' }}
        />
        <Container className="relative">
          <Reveal>
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gray-900 px-6 py-14 text-center shadow-[0_32px_64px_-16px_rgba(16,24,40,0.4)] sm:px-14 sm:py-16">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(600px 300px at 50% -20%, rgba(14,165,233,0.25), transparent 60%), radial-gradient(400px 240px at 85% 110%, rgba(99,102,241,0.2), transparent 55%)',
                }}
              />
              <div className="relative">
                <div className="mb-6 flex justify-center">
                  <Logo size={72} />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
                  {lang === 'ta' ? (
                    <>ஒரே batch. ஒரே வாய்ப்பு.<br />
                    <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">அதை வெற்றியாக்குங்கள்.</span></>
                  ) : (
                    <>One batch. One shot.<br />
                    <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Make it count.</span></>
                  )}
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-300">
                  {t(
                    'The habits you build now can change the next 30 years. Join the most disciplined aspirants in Puducherry and Tamil Nadu.',
                    'இப்போது நீங்கள் உருவாக்கும் பழக்கங்கள் அடுத்த 30 ஆண்டுகளை மாற்றும். புதுச்சேரி & தமிழ்நாட்டின் மிக ஒழுக்கமான மாணவர்களுடன் இணையுங்கள்.',
                  )}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/auth/register"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-bold text-gray-900 shadow-[0_4px_16px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5 hover:bg-sky-50 sm:w-auto"
                  >
                    {t('Start the programme', 'திட்டத்தைத் தொடங்குங்கள்')}
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                  >
                    {t('Sign in', 'உள்நுழைய')}
                  </Link>
                </div>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-gray-400">
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> {t('Performance-linked refund', 'செயல்திறன்-இணைந்த ரீஃபண்ட்')}</span>
                  <span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-amber-400" /> {t('Instant access after payment', 'கட்டணம் செலுத்தியதும் உடனடி அணுகல்')}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200/70 bg-white">
        <Container className="py-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <Logo size={36} />
                <span className="text-[17px] font-bold tracking-tight text-gray-900">
                  Centu<span className="text-sky-600">Mania</span>
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
                {t(
                  'The most disciplined preparation platform for SSC, RRB, Banking & Tamil Nadu / Puducherry government exams. More exams coming soon. Winning is a habit.',
                  'SSC, RRB, வங்கி & தமிழ்நாடு / புதுச்சேரி அரசுத் தேர்வுகளுக்கான மிக ஒழுக்கமான தயாரிப்புத் தளம். மேலும் பல தேர்வுகள் விரைவில். வெற்றி ஒரு பழக்கம்.',
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-14">
              {FOOTER_COLS.map((col) => (
                <div key={col.title.en}>
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">{col.title[lang]}</h4>
                  <ul className="mt-3.5 space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.label.en}>
                        {l.external ? (
                          <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13.5px] text-gray-600 transition-colors hover:text-gray-900">
                            {l.label[lang]}
                          </a>
                        ) : (
                          <Link href={l.href} className="text-[13.5px] text-gray-600 transition-colors hover:text-gray-900">
                            {l.label[lang]}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
            <p className="text-[12.5px] text-gray-500">{t('© 2026 CentuMania. All rights reserved.', '© 2026 CentuMania. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.')}</p>
            <p className="text-[12.5px] font-medium text-gray-500">{t('Winning is a habit.', 'வெற்றி ஒரு பழக்கம்.')}</p>
          </div>
        </Container>
      </footer>
    </>
  )
}
