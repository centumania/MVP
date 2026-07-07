import type { Metadata } from 'next'
import LandingV2 from '@/src/components/landing-v2/LandingV2'

export const metadata: Metadata = {
  title: 'Crack your government exam with daily discipline',
  description:
    'Intensive daily preparation for India\'s competitive government exams — SSC (CGL, CHSL, MTS, CPO), RRB (NTPC, Group D), Banking and Tamil Nadu & Puducherry state exams. Daily timed tests, AI mentor coaching, a live leaderboard and a performance-linked refund guarantee. More exams coming soon. Winning is a habit.',
}

export default function RootPage() {
  return <LandingV2 />
}
