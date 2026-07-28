'use client'

/**
 * Neutral "access not active yet" screen shown INSIDE the native app in place of
 * the UPI payment screen. Consumption-only compliance: no price, no UPI ID, no
 * QR, no link to any payment method. Students are told (off-app, via email /
 * website) how to activate. A refresh re-checks their access after they pay
 * elsewhere.
 */
import { useState } from 'react'
import { ShieldCheck } from '@/src/components/landing-v2/icons'

export function NativeAccessNotice() {
  const [checking, setChecking] = useState(false)
  function recheck() {
    setChecking(true)
    // Full reload so the freshly-verified payment status is picked up everywhere.
    window.location.href = '/dashboard'
  }
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-[0_2px_10px_rgba(16,24,40,0.05)]">
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
          <ShieldCheck size={22} />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
          Your access isn&apos;t active yet
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
          Once your enrolment is confirmed, your full programme unlocks here
          automatically — daily tests, study modules, classroom and your Centum Index.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
          We&apos;ll notify you by email the moment it&apos;s ready. Already completed
          your enrolment? Tap refresh.
        </p>
        <button
          type="button"
          onClick={recheck}
          disabled={checking}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          {checking ? 'Checking…' : 'Refresh my access'}
        </button>
      </div>
    </div>
  )
}
