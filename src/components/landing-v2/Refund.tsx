'use client'

/**
 * Landing v2 — Refund guarantee.
 * Copy matches the official policy at /refund exactly:
 * full refund = all exams attempted + average < 50% + request within 7 days.
 * Bilingual (EN/தமிழ்) via useLang.
 */
import Link from 'next/link'
import { Calendar, BarChart, Timer, CheckCircle, ShieldCheck } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const CONDITIONS = {
  en: [
    { icon: Calendar, title: 'Attempt every daily exam', text: 'Without missing a single day of the programme.' },
    { icon: BarChart, title: 'Average below 50%', text: 'If you did the work and still scored under half, the programme failed you.' },
    { icon: Timer, title: 'Request within 7 days', text: 'Of the final exam day — one message on WhatsApp is enough.' },
    { icon: CheckCircle, title: 'Verified automatically', text: 'Eligibility is checked from your submission data. No arguments, no review board.' },
  ],
  ta: [
    { icon: Calendar, title: 'ஒவ்வொரு தினசரி தேர்வையும் எழுதுங்கள்', text: 'திட்டத்தில் ஒரு நாள் கூட தவறாமல்.' },
    { icon: BarChart, title: 'சராசரி 50%-க்கும் குறைவு', text: 'உழைத்தும் பாதிக்கும் குறைவான மதிப்பெண் என்றால், திட்டம்தான் உங்களைத் தோற்கடித்தது.' },
    { icon: Timer, title: '7 நாட்களுக்குள் கோருங்கள்', text: 'இறுதித் தேர்வு நாளிலிருந்து — WhatsApp-இல் ஒரு செய்தி போதும்.' },
    { icon: CheckCircle, title: 'தானாகச் சரிபார்க்கப்படும்', text: 'உங்கள் சமர்ப்பிப்புத் தரவிலிருந்து தகுதி சரிபார்க்கப்படும். வாக்குவாதம் இல்லை, குழு இல்லை.' },
  ],
}

export default function Refund() {
  const { lang, t } = useLang()
  return (
    <section className="bg-white py-16 sm:py-24" style={{ boxShadow: 'inset 0 1px 0 rgba(16,24,40,0.05), inset 0 -1px 0 rgba(16,24,40,0.05)' }}>
      <Container>
        <SectionHeading
          label={t('Zero-risk enrolment', 'ரிஸ்க் இல்லாத சேர்க்கை')}
          labelTone="emerald"
          title={t('Do the work. If it doesn\'t work, it\'s free.', 'உழையுங்கள். பலன் இல்லை என்றால், கட்டணம் இல்லை.')}
          sub={t(
            'We\'re confident enough in the system to put the fee on the line. Complete the programme honestly — if your scores don\'t reflect it, you get a full refund.',
            'இந்த அமைப்பின் மீது எங்களுக்கு அவ்வளவு நம்பிக்கை — கட்டணத்தையே பணயம் வைக்கிறோம். திட்டத்தை நேர்மையாக முடியுங்கள் — உங்கள் மதிப்பெண்கள் அதைக் காட்டவில்லை என்றால், முழு ரீஃபண்ட்.',
          )}
        />

        <Reveal delay={100}>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/60 to-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.05),0_20px_44px_-16px_rgba(16,185,129,0.18)] sm:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-gray-900">{t('100% money-back guarantee', '100% பணம் திரும்ப உத்தரவாதம்')}</h3>
                <p className="text-[13px] font-medium text-emerald-700">{t('Full refund if all four conditions are met', 'நான்கு நிபந்தனைகளும் பூர்த்தியானால் முழு ரீஃபண்ட்')}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {CONDITIONS[lang].map((c) => (
                <div key={c.title} className="flex items-start gap-3.5 rounded-xl border border-gray-200/60 bg-white p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <c.icon size={17} />
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">{c.title}</div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[12.5px] text-gray-500">
              {t(
                'Approved refunds are processed within 7 business days to your original payment method. First-time enrolments only.',
                'அங்கீகரிக்கப்பட்ட ரீஃபண்டுகள் 7 வேலை நாட்களுக்குள் உங்கள் அசல் கட்டண முறைக்கு வழங்கப்படும். முதல்முறை சேர்க்கைக்கு மட்டும்.',
              )}{' '}
              <Link href="/refund" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800">
                {t('Read the full policy', 'முழு கொள்கையையும் படிக்கவும்')}
              </Link>
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
