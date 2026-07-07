import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Daily Test' }

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return children
}
