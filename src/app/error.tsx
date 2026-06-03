'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-error-subtle flex items-center justify-center mx-auto mb-5">
        <svg className="w-6 h-6 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-text mb-2">Something went wrong</h1>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        An unexpected error occurred. Our team has been notified.
      </p>
      <button
        onClick={reset}
        className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
