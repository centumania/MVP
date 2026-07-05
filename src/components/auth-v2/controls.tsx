'use client'

/**
 * Auth v2 — form controls for the light design system.
 * Field / PasswordField / Checkbox / banners / AuthButton.
 * Pure presentation: all business logic stays in the pages.
 */
import { useState, type InputHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'

const INPUT_CLASS =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15'

export function Field({
  id,
  label,
  labelRight,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; labelRight?: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
          {label}
        </label>
        {labelRight}
      </div>
      <input id={id} className={INPUT_CLASS} {...props} />
    </div>
  )
}

export function PasswordField({
  id,
  label,
  labelRight,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; labelRight?: ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} className={`${INPUT_CLASS} pr-12`} {...props} />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 transition-colors hover:text-gray-700"
        >
          {show ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <span
        className={`relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all ${
          checked ? 'border-sky-600 bg-sky-600' : 'border-gray-300 bg-white'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <polyline points="1 4 3.7 6.7 9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </span>
      <span className="text-[13px] leading-relaxed text-gray-600">{children}</span>
    </label>
  )
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-3">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-[13px] leading-snug text-red-700">{children}</p>
    </div>
  )
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-3">
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
        <path d="m9 11 3 3L22 4" />
      </svg>
      <p className="text-[13px] leading-snug text-emerald-700">{children}</p>
    </div>
  )
}

export function AuthButton({
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(2,132,199,0.3)] transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-[0_8px_24px_rgba(2,132,199,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-sky-600 disabled:hover:shadow-[0_4px_14px_rgba(2,132,199,0.3)]"
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/30"
          style={{ borderTopColor: '#fff' }}
        />
      )}
      {children}
    </button>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span aria-hidden className="h-7 w-7 animate-spin rounded-full border-2 border-sky-200" style={{ borderTopColor: '#0284c7' }} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  )
}

export function StatusIcon({ tone }: { tone: 'success' | 'error' }) {
  return (
    <div
      className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
        tone === 'success' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70' : 'bg-red-50 text-red-500 ring-1 ring-red-200/70'
      }`}
    >
      {tone === 'success' ? (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
    </div>
  )
}
