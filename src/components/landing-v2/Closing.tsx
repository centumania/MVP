/**
 * Landing v2 — final CTA + footer.
 */
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap } from './icons'
import { Reveal, Container } from './ui'
import Logo from './Logo'

const FOOTER_COLS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Programme',
    links: [
      { label: 'Why CentuMania', href: '#why' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms & conditions', href: '/terms' },
      { label: 'Refund policy', href: '/refund' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'WhatsApp support', href: 'https://wa.me/917200132957', external: true },
      { label: '+91 72001 32957', href: 'https://wa.me/917200132957', external: true },
    ],
  },
]

export default function Closing() {
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
                  One batch. One shot.<br />
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Make it count.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-300">
                  The next 30 days can change the next 30 years. Join the most disciplined
                  aspirants in Puducherry and Tamil Nadu.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/auth/register"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-bold text-gray-900 shadow-[0_4px_16px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5 hover:bg-sky-50 sm:w-auto"
                  >
                    Start the programme
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                  >
                    Sign in
                  </Link>
                </div>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-gray-400">
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Performance-linked refund</span>
                  <span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-amber-400" /> Instant access after payment</span>
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
                The most disciplined LDC, UDC &amp; SSC exam preparation platform for Tamil Nadu and Puducherry aspirants. Winning is a habit.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-14">
              {FOOTER_COLS.map((col) => (
                <div key={col.title}>
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-400">{col.title}</h4>
                  <ul className="mt-3.5 space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        {l.external ? (
                          <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13.5px] text-gray-600 transition-colors hover:text-gray-900">
                            {l.label}
                          </a>
                        ) : (
                          <Link href={l.href} className="text-[13.5px] text-gray-600 transition-colors hover:text-gray-900">
                            {l.label}
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
            <p className="text-[12.5px] text-gray-400">© 2026 CentuMania. All rights reserved.</p>
            <p className="text-[12.5px] font-medium text-gray-400">Winning is a habit.</p>
          </div>
        </Container>
      </footer>
    </>
  )
}
