'use client'

/**
 * Landing v2 — lead capture ("Not ready to enrol yet?").
 * Conversion path for visitors who won't buy today: capture name + phone +
 * target exam, then immediately push the two actions that convert — start the
 * free Day 1 (register) or open a prefilled WhatsApp chat.
 * POSTs to /api/leads (rate-limited, service-role insert into the RLS-locked
 * leads table); leads surface for follow-up in the admin panel.
 * Bilingual (EN-Tanglish / தமிழ்) via useLang.
 */
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, MessageCircle } from './icons'
import { Reveal, Container, SectionHeading } from './ui'
import { useLang } from './lang'

const PROGRAMS = [
  { value: 'UDC', en: 'UDC — Upper Division Clerk', ta: 'UDC — Upper Division Clerk' },
  { value: 'SSC', en: 'SSC — CGL / CHSL / MTS / CPO', ta: 'SSC — CGL / CHSL / MTS / CPO' },
  { value: 'RRB', en: 'RRB — NTPC / Group D', ta: 'RRB — NTPC / Group D' },
  { value: 'Banking', en: 'Banking — IBPS / SBI', ta: 'வங்கி — IBPS / SBI' },
  { value: 'unsure', en: 'Not sure yet — help me choose', ta: 'இன்னும் தெரியவில்லை — தேர்வு செய்ய உதவுங்கள்' },
]

const programLabel = (v: string) =>
  PROGRAMS.find(p => p.value === v)?.en.split(' — ')[0] ?? 'a government exam'

const INPUT_CLS =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

export default function LeadForm() {
  const { lang, t } = useLang()
  const [form, setForm] = useState({ name: '', phone: '', program: '', email: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.name.trim().length < 2) { setError(t('Please enter your name.', 'உங்கள் பெயரை உள்ளிடுங்கள்.')); return }
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) { setError(t('Enter a valid 10-digit Indian mobile number.', 'சரியான 10-இலக்க இந்திய மொபைல் எண்ணை உள்ளிடுங்கள்.')); return }
    if (!form.program) { setError(t('Please select the exam you are preparing for.', 'நீங்கள் தயாராகும் தேர்வைத் தேர்ந்தெடுங்கள்.')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone,
          program: form.program,
          email: form.email.trim() || undefined,
          source: 'landing',
        }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error ?? t('Something went wrong. Please try again.', 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.')); return }
      setDone(true)
    } catch {
      setError(t('Something went wrong. Please try again.', 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.'))
    } finally {
      setLoading(false)
    }
  }

  const waText = encodeURIComponent(
    `Hi CentuMania, I'm ${form.name.trim()}, preparing for ${programLabel(form.program)} — please send me the next batch date and prep plan.`,
  )

  return (
    <section id="lead" className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-xl">
          {done ? (
            /* ── Success: the conversion moment ── */
            <Reveal>
              <div className="lv2m-lift-emerald rounded-3xl border border-emerald-200/80 bg-white p-7 text-center shadow-[0_1px_3px_rgba(16,24,40,0.06),0_16px_40px_-12px_rgba(5,150,105,0.15)] sm:p-9">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle size={24} />
                </span>
                <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                  {t(`Super, ${form.name.trim().split(' ')[0]} — details saved!`, `சூப்பர், ${form.name.trim().split(' ')[0]} — விவரங்கள் சேமிக்கப்பட்டன!`)}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-gray-600">
                  {t('We\'ll send your next batch date and free prep plan on WhatsApp. Why wait, though —', 'உங்கள் அடுத்த batch தேதியும் இலவச படிப்புத் திட்டமும் WhatsApp-இல் அனுப்புவோம். ஆனால் ஏன் காத்திருக்க வேண்டும் —')}
                  <span className="font-semibold text-gray-800"> {t('Day 1 free — ippove try pannunga.', 'முதல் நாள் இலவசம் — இப்போதே முயற்சிக்கவும்.')}</span>
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/auth/register"
                    className="lv2m-sheen group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] transition-all hover:-translate-y-0.5 hover:bg-sky-700"
                  >
                    {t('Start Day 1 free now', 'முதல் நாளை இலவசமாகத் தொடங்குங்கள்')}
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href={`https://wa.me/917200132957?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3.5 text-[15px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <MessageCircle size={17} /> {t('WhatsApp us now', 'இப்போதே WhatsApp செய்யுங்கள்')}
                  </a>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <SectionHeading
                label={t('Innum decide pannala?', 'இன்னும் முடிவு செய்யவில்லையா?')}
                labelTone="sky"
                title={t('Next batch date-um free prep plan-um vaangunga', 'அடுத்த batch தேதியும் இலவச படிப்புத் திட்டமும் பெறுங்கள்')}
                sub={t(
                  'Leave your details and we\'ll send the next batch opening and a daily study plan for your exam. No spam — thevaiyana info mattum.',
                  'உங்கள் விவரங்களைக் கொடுங்கள் — அடுத்த batch தொடக்கமும் உங்கள் தேர்வுக்கான தினசரி படிப்புத் திட்டமும் அனுப்புவோம். Spam இல்லை — தேவையான தகவல் மட்டும்.',
                )}
              />
              <Reveal>
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_16px_40px_-12px_rgba(16,24,40,0.1)] sm:p-8"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="lead-name" className="mb-1.5 block text-[13px] font-semibold text-gray-700">{t('Full name', 'முழு பெயர்')}</label>
                      <input
                        id="lead-name" type="text" autoComplete="name" required placeholder={t('Your full name', 'உங்கள் முழு பெயர்')}
                        className={INPUT_CLS} value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="lead-phone" className="mb-1.5 block text-[13px] font-semibold text-gray-700">{t('Mobile number (WhatsApp)', 'மொபைல் எண் (WhatsApp)')}</label>
                      <input
                        id="lead-phone" type="tel" autoComplete="tel" required placeholder="9876543210" inputMode="numeric"
                        className={INPUT_CLS} value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="lead-program" className="mb-1.5 block text-[13px] font-semibold text-gray-700">{t('Which exam are you preparing for?', 'எந்தத் தேர்வுக்குத் தயாராகிறீர்கள்?')}</label>
                      <select
                        id="lead-program" required
                        className={`${INPUT_CLS} ${form.program ? '' : 'text-gray-400'}`}
                        value={form.program}
                        onChange={e => setForm(p => ({ ...p, program: e.target.value }))}
                      >
                        <option value="" disabled>{t('Select your exam', 'உங்கள் தேர்வைத் தேர்ந்தெடுங்கள்')}</option>
                        {PROGRAMS.map(p => <option key={p.value} value={p.value}>{p[lang]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="lead-email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                        {t('Email', 'மின்னஞ்சல்')} <span className="font-normal text-gray-400">{t('(optional)', '(விருப்பம்)')}</span>
                      </label>
                      <input
                        id="lead-email" type="email" autoComplete="email" placeholder="you@example.com"
                        className={INPUT_CLS} value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>

                    {error && (
                      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="lv2m-sheen group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.35)] transition-all hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? t('Saving…', 'சேமிக்கிறது…') : t('Get my batch date & prep plan', 'எனது batch தேதி & படிப்புத் திட்டம் வேண்டும்')}
                      {!loading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />}
                    </button>
                    <p className="text-center text-[12px] text-gray-400">{t('We\'ll never share your details.', 'உங்கள் விவரங்களை யாருடனும் பகிர மாட்டோம்.')}</p>
                  </div>
                </form>
              </Reveal>
            </>
          )}
        </div>
      </Container>
    </section>
  )
}
