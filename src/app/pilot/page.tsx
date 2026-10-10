import type { Metadata } from 'next'
import PilotLaunch from '@/src/components/pilot/PilotLaunch'
import { LangProvider } from '@/src/components/landing-v2/lang'

export const metadata: Metadata = {
  title: 'Vijayadashami Pilot Batch — Free Orientation, Karaikal',
  description:
    'CentuMania Study Arena pilot launch in Karaikal on 20 October 2026. Free orientation: five-paper analysis, a live platform demo, a diagnostic test and the 90-day Centum Index challenge with a 25%–50% performance refund.',
}

// Public page — no LandingGate: people arrive here from a poster QR code or a
// shared link and must land on the orientation, not the /welcome funnel.
export default function PilotPage() {
  return (
    <LangProvider ssr>
      <PilotLaunch />
    </LangProvider>
  )
}
