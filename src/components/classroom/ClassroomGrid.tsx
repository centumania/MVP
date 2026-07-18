'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { COURSES, type Course } from '@/src/data/classroom'
import { CT, useClassroomSession, isDone } from './lib'

function courseProgress(course: Course): { done: number; total: number; pct: number } {
  const total = course.lessons.length
  const done = course.lessons.filter(l => isDone(l.id)).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

function CourseCard({ course }: { course: Course }) {
  const [{ done, total, pct }, setP] = useState({ done: 0, total: course.lessons.length, pct: 0 })
  // Read localStorage after mount (SSR-safe).
  useEffect(() => { setP(courseProgress(course)) }, [course])

  const live = course.status === 'live'
  const href = live && course.lessons[0] ? `/classroom/${course.slug}/${course.lessons[0].id}` : `/classroom/${course.slug}`

  const inner = (
    <div
      className="group rounded-[20px] overflow-hidden transition-all duration-200"
      style={{
        background: CT.PAPER,
        border: `1px solid ${CT.HAIRLINE}`,
        boxShadow: '0 1px 2px rgba(17,24,39,0.04), 0 10px 30px rgba(17,24,39,0.05)',
        opacity: live ? 1 : 0.72,
      }}
    >
      {/* 16:9 cover */}
      <div
        className="relative flex items-center justify-center"
        style={{ aspectRatio: '16 / 9', background: `linear-gradient(135deg, ${course.accent} 0%, ${CT.INK} 120%)` }}
      >
        <span style={{ fontSize: 54, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.35))' }}>{course.emoji}</span>
        <span className="absolute top-3 right-3 text-[9px] font-extrabold uppercase px-2 py-[3px] rounded-md"
          style={{ background: live ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)', color: CT.INK, letterSpacing: '0.14em' }}>
          {live ? `${total} lessons` : 'Coming soon'}
        </span>
      </div>
      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <p className="text-[10px] font-extrabold uppercase mb-1.5" style={{ color: CT.AMBER, letterSpacing: '0.16em' }}>
          {course.subject}
        </p>
        <h2 className="text-[16px] font-bold leading-snug" style={{ color: CT.INK_SOFT, letterSpacing: '-0.01em' }}>
          {course.title}
        </h2>
        <p className="text-[12.5px] leading-relaxed mt-1" style={{ color: CT.MUTED }}>{course.blurb}</p>
        {live && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EEF0F2' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CT.GREEN }} />
            </div>
            <p className="text-[11px] font-semibold mt-1.5" style={{ color: pct > 0 ? CT.GREEN : CT.FAINT }}>
              {pct > 0 ? `${pct}% complete · ${done}/${total}` : 'Start course →'}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return live
    ? <Link href={href} className="block hover:-translate-y-[3px] transition-transform duration-200">{inner}</Link>
    : <div className="cursor-default">{inner}</div>
}

export default function ClassroomGrid() {
  const { ready, userName } = useClassroomSession()

  if (!ready) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-[20px] animate-pulse" style={{ height: 260, background: '#F1F1EF' }} />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="mb-6">
          <p className="text-[10px] font-extrabold uppercase mb-2" style={{ color: CT.AMBER, letterSpacing: '0.22em' }}>
            CentuMania · Classroom
          </p>
          <h1 className="text-[28px] font-extrabold leading-tight" style={{ color: CT.INK_SOFT, letterSpacing: '-0.02em' }}>
            Classroom
          </h1>
          <p className="text-[13.5px] mt-2 leading-relaxed max-w-[54ch]" style={{ color: CT.MUTED }}>
            Pick a subject. Each topic has a clear <span className="font-semibold" style={{ color: CT.INK_SOFT }}>explanation</span> and
            hands-on <span className="font-semibold" style={{ color: CT.INK_SOFT }}>practice</span> — mark each one complete as you go.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COURSES.map(c => <CourseCard key={c.slug} course={c} />)}
        </div>
      </div>
    </AppLayout>
  )
}
