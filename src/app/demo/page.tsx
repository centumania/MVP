import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/src/components/landing-v2/Logo'

export const metadata: Metadata = {
  title: 'Free sample lesson — Buddhism & Jainism · CentuMania',
  description: 'Try a real CentuMania lesson free, no signup — the exact interactive study experience your daily subscription unlocks.',
}

// PUBLIC demo (no auth): shows a real interactive module so a visitor can
// experience the product before signing up. Served from /public/demo/*.html,
// which middleware treats as public + permissive-CSP + same-origin-frameable.
export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#FAFAF8' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link href="/?stay=1" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-[15px] font-bold tracking-tight text-gray-900">
            Centu<span className="text-sky-600">Mania</span>
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200/70 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Free sample · no signup
          </span>
          <Link href="/auth/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.4)] transition-transform hover:-translate-y-0.5">
            Unlock everything →
          </Link>
        </div>
      </header>

      {/* Intro strip */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-600">
          Live sample lesson · Ancient History
        </p>
        <h1 className="mt-1.5 text-[24px] font-extrabold leading-tight tracking-tight text-gray-900 sm:text-[28px]">
          Buddhism &amp; Jainism
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
          This is a <span className="font-semibold text-gray-900">real</span> CentuMania lesson — flashcards, an
          interactive map and first-attempt scored MCQs. Study it right here, free. Every subject works exactly like this inside.
        </p>
      </div>

      {/* The real module, embedded */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.07),0_20px_44px_-16px_rgba(16,24,40,0.14)]">
          <iframe
            src="/demo/buddhism-jainism.html"
            title="Buddhism & Jainism — sample lesson"
            className="block w-full"
            style={{ height: '82vh', border: 0 }}
          />
        </div>
      </div>

      {/* Bottom conversion bar */}
      <div className="sticky bottom-0 z-20 border-t border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[13px] font-medium text-gray-700">
            Liked it? <span className="font-bold text-gray-900">All 8 subjects</span> + daily tests + a live rank await.
          </p>
          <div className="flex items-center gap-2.5">
            <Link href="/?stay=1" className="text-[13px] font-semibold text-gray-600 hover:text-gray-900">Back</Link>
            <Link href="/auth/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.4)] transition-transform hover:-translate-y-0.5">
              Start free — lock in ₹999 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
