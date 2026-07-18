import LessonView from '@/src/components/classroom/LessonView'

export default async function LessonPage({ params }: { params: Promise<{ subject: string; topic: string }> }) {
  const { subject, topic } = await params
  return <LessonView subjectSlug={subject} topicId={topic} />
}
