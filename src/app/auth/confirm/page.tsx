'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'

/**
 * Handles the Supabase email confirmation code exchange.
 * Receives ?code= from /auth/callback, exchanges it for a session,
 * then redirects to /dashboard.
 */
export default function ConfirmPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.replace('/auth/login')
      return
    }

    getSupabaseBrowserClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setError('Confirmation link has expired. Please register again or contact support.')
        } else {
          router.replace('/dashboard')
        }
      })
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-error mb-4">{error}</p>
          <a href="/auth/login" className="text-gold underline">Back to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center">
      <p className="text-muted font-subheading tracking-widest uppercase text-sm animate-pulse">
        Confirming your account…
      </p>
    </div>
  )
}
