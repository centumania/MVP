'use client'

/**
 * Dashboard v2 — payment pending screen.
 * Business details unchanged from v1: UPI ID, payee name, QR generation
 * via api.qrserver.com, manual coordinator verification, WhatsApp support.
 */
import { useState } from 'react'
import { MessageCircle, ShieldCheck } from '@/src/components/landing-v2/icons'

const UPI_ID = 'anandhamuruugan-1@okicici'
const PAYEE = 'Anandh Muruugan'
const UPI_LINK = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE)}&cu=INR`

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all ${
        copied
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function PaymentGate() {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${PAYEE}&cu=INR`)}&margin=10&color=000000&bgcolor=ffffff`

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-wider text-amber-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Payment pending
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900" style={{ letterSpacing: '-0.02em' }}>
          Complete your payment
        </h1>
        <div className="mt-2 flex items-baseline justify-center gap-1.5">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight text-gray-900" style={{ letterSpacing: '-0.03em' }}>₹999</span>
          <span className="text-[12.5px] font-medium text-gray-500">one-time</span>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-gray-600">
          Scan the QR code or use the UPI ID below to pay and unlock full access.
        </p>
      </div>

      {/* QR card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <div className="flex flex-col items-center border-b border-gray-100 px-6 py-7">
          <a href={UPI_LINK} className="mb-4 block overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_2px_10px_rgba(16,24,40,0.06)]">
            {/* Third-party QR service, unchanged from v1 (flagged in tech-debt) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="UPI QR code — tap to pay ₹999" width={200} height={200} className="block" />
          </a>
          <p className="text-[12px] font-medium text-gray-500">Scan with any UPI app</p>
          <p className="mt-0.5 text-[12px] text-gray-400">PhonePe · GPay · Paytm · BHIM</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">UPI ID</p>
            <p className="select-all text-[14px] font-semibold text-gray-900">{UPI_ID}</p>
          </div>
          <CopyButton value={UPI_ID} />
        </div>

        <div className="px-5 py-4">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Pay to</p>
          <p className="text-[14px] font-medium text-gray-800">{PAYEE}</p>
        </div>
      </div>

      {/* After payment note */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-sky-200/70 bg-sky-50 px-4 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-sky-600" />
        <p className="text-[12.5px] leading-relaxed text-sky-900">
          After paying, your coordinator will verify the payment and unlock your access — usually within a few hours.
        </p>
      </div>

      <p className="mt-4 text-center text-[12.5px] text-gray-500">
        Already paid?{' '}
        <a
          href="https://wa.me/917200132957"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
        >
          <MessageCircle size={13} /> Message us on WhatsApp
        </a>
      </p>
    </div>
  )
}
