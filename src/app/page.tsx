import type { Metadata } from 'next'
import LandingV2 from '@/src/components/landing-v2/LandingV2'

export const metadata: Metadata = {
  title: 'CentuMania — Crack your government exam with daily discipline',
  description:
    'Intensive LDC/UDC (30-day) and SSC (50-day) exam preparation for Tamil Nadu & Puducherry aspirants. Daily timed exams, AI mentor coaching, live leaderboard and a performance-linked refund guarantee. Winning is a habit.',
}

export default function RootPage() {
  return <LandingV2 />
}
