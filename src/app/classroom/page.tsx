import type { Metadata } from 'next'
import ClassroomGrid from '@/src/components/classroom/ClassroomGrid'

export const metadata: Metadata = { title: 'Classroom · CentuMania' }

export default function ClassroomPage() {
  return <ClassroomGrid />
}
