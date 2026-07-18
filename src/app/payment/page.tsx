'use client'

/**
 * /payment — dedicated payment section (its own nav destination, under
 * "More" in the app shells). Shows the price + UPI QR for the programme THIS
 * student selected at registration (auth user_metadata.program), priced from
 * src/data/pricing. Payment is never forced after sign-up — students come
 * here from the dashboard banner or the nav when they're ready.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppShell } from '@/src/components/dashboard-v2/AppShell'
import { PaymentGate } from '@/src/components/dashboard-v2/PaymentGate'
import { DashboardSkeleton } from '@/src/components/dashboard-v2/ui'
import { getProgramme } from '@/src/data/pricing'

export default function PaymentPage() {
  const router = useRouter()
  const [name, setName] = useState('Student')
  const [program, setProgram] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Student')
      setProgram(session.user.user_metadata?.program ?? null)
      setReady(true)
    })
  }, [router])

  const batchName = program ? getProgramme(program).label : undefined

  if (!ready) {
    return (
      <AppShell userName={name}>
        <div className="mx-auto max-w-md px-4 py-10 sm:px-6"><DashboardSkeleton /></div>
      </AppShell>
    )
  }

  return (
    <AppShell userName={name} batchName={batchName}>
      <PaymentGate program={program} />
    </AppShell>
  )
}
