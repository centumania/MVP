import type { Metadata } from 'next'
import LandingV2 from '@/src/components/landing-v2/LandingV2'

export const dynamic = 'force-dynamic'

/**
 * /v2 — preview route for the redesigned landing page.
 * The production landing page at / is untouched. Once approved,
 * swap src/app/page.tsx to render <LandingV2 /> and retire this route.
 */
export const metadata: Metadata = {
  title: 'CentuMania — Crack your government exam with daily discipline',
  description:
    'Intensive LDC/UDC (30-day) and SSC (50-day) exam preparation for Tamil Nadu & Puducherry aspirants. Daily timed exams, AI mentor coaching, live leaderboard and a performance-linked refund guarantee. Winning is a habit.',
}

export default function LandingV2Page() {
  return <LandingV2 />
}
