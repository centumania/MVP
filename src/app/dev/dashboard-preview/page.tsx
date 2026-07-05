'use client'

/**
 * /dev/dashboard-preview — DEV-ONLY design review route.
 * Renders DashboardView + AppShell with realistic mock data so the v2
 * dashboard can be reviewed without a login session or live data.
 * Returns 404 in production builds. Remove once the redesign ships.
 */
import { notFound } from 'next/navigation'
import { AppShell } from '@/src/components/dashboard-v2/AppShell'
import { DashboardView, type DashData } from '@/src/components/dashboard-v2/DashboardView'
import type { CurrentAffairsItem } from '@/src/app/api/current-affairs/route'

const MOCK_DATA: DashData = {
  paymentPending: false,
  todayExam: { dayNumber: 14, examId: 'mock-exam-id', alreadySubmitted: false },
  batchTotalDays: 30,
  leaderboard: { rank: 12, score: 1980, days: 14, accuracy: 78, percentile: 88 },
  xp: 4200, xpLevel: 4, xpInLevel: 200, xpToNext: 800,
  streak: 14, daysAttended: 14,
  last7: [
    { score: 62, totalMarks: 100, pct: 62 },
    { score: 58, totalMarks: 100, pct: 58 },
    { score: 71, totalMarks: 100, pct: 71 },
    { score: 68, totalMarks: 100, pct: 68 },
    { score: 75, totalMarks: 100, pct: 75 },
    { score: 81, totalMarks: 100, pct: 81 },
    { score: 78, totalMarks: 100, pct: 78 },
  ],
  history: Array.from({ length: 8 }, (_, i) => ({
    dayNumber: 14 - i,
    score: [78, 81, 75, 68, 71, 58, 62, 55][i],
    totalMarks: 100,
    pct: [78, 81, 75, 68, 71, 58, 62, 55][i],
    submittedAt: new Date(Date.now() - i * 864e5).toISOString(),
  })),
  centumIndex: 72.4,
  nodeScore: 68, attendanceScore: 93, accuracyScore: 74, depthScore: 41,
  nodesOpened: 142, nodesCompleted: 58, mcqsDone: 420, mcqsCorrect: 311,
  activeDaysInBatch: 13, daysElapsed: 14,
}

const MOCK_INSIGHTS = {
  available: true,
  hasData: true,
  profile: {
    topics: [],
    critical: ['Percentages', 'Time & Work'],
    weak: ['Indian Polity', 'Reasoning'],
    moderate: ['Geography', 'English Grammar'],
    strong: ['Tamil', 'History', 'General Science'],
  },
}

const MOCK_NEWS: CurrentAffairsItem[] = [
  {
    id: 'm1', title: 'Union Cabinet approves new National Education Policy amendments',
    category: 'National', exam_relevance: 'High',
    summary: 'The amendments focus on digital learning infrastructure and regional language instruction — a frequent source of prelim questions.',
    tags: ['NEP', 'Education'],
  },
  {
    id: 'm2', title: 'RBI holds repo rate steady at quarterly review',
    category: 'Economy', exam_relevance: 'Medium',
    summary: 'The Monetary Policy Committee kept the repo rate unchanged, citing stable inflation. Know the current rate and MPC composition.',
    tags: ['RBI', 'MPC'],
  },
  {
    id: 'm3', title: 'Puducherry announces coastal restoration project',
    category: 'State', exam_relevance: 'High',
    summary: 'A ₹120-crore project covering mangrove restoration across three coastal districts — directly relevant for the regional GK section.',
    tags: ['Puducherry', 'Environment'],
  },
  {
    id: 'm4', title: 'ISRO completes crewed-flight abort test',
    category: 'Science', exam_relevance: 'Medium',
    summary: 'The test validated the crew escape system for the Gaganyaan programme. Remember mission names and their sequence.',
    tags: ['ISRO', 'Gaganyaan'],
  },
  {
    id: 'm5', title: 'National Sports Awards announced',
    category: 'Sports', exam_relevance: 'Low',
    summary: 'Arjuna and Khel Ratna awardees announced — scan the list once; one mark often hides here.',
    tags: ['Awards'],
  },
] as CurrentAffairsItem[]

export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <AppShell userName="Prasanna Kumar">
      <div className="mx-auto max-w-2xl px-4 pt-3 sm:px-6">
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2 text-[12px] font-semibold text-amber-700">
          Design preview — mock data, dev only
        </p>
      </div>
      <DashboardView firstName="Prasanna" data={MOCK_DATA} insights={MOCK_INSIGHTS} currentAffairs={{ items: MOCK_NEWS, generatedToday: true, todayDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) }} />
    </AppShell>
  )
}
