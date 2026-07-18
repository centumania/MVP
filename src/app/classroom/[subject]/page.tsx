import { redirect } from 'next/navigation'
import { getCourse } from '@/src/data/classroom'

// A course opens straight into its first lesson (Skool behaviour).
export default async function CourseIndex({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  const course = getCourse(subject)
  if (course && course.lessons[0]) redirect(`/classroom/${subject}/${course.lessons[0].id}`)
  redirect('/classroom')
}
