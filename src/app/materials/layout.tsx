import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Study Material' }

export default function MaterialsLayout({ children }: { children: React.ReactNode }) {
  return children
}
