'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { getCourse, getLesson, type Course, type Lesson } from '@/src/data/classroom'
import {
  CT, useClassroomSession, isDone, setDone,
  trackLessonOpen, trackLessonComplete, beaconLessonDwell,
  postClassroomProgress, fetchClassroomCompleted,
} from './lib'

function ytId(url?: string): string | null {
  if (!url) return null
  if (/^[\w-]{11}$/.test(url)) return url
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

function CheckCircle({ done }: { done: boolean }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: 20, height: 20, border: `1.5px solid ${done ? CT.GREEN : '#D4D4D0'}`, background: done ? CT.GREEN : 'transparent' }}>
      {done && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  )
}

function Sidebar({ course, activeId, doneMap }: { course: Course; activeId: string; doneMap: Record<string, boolean> }) {
  const total = course.lessons.length
  const done = course.lessons.filter(l => doneMap[l.id]).length
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: CT.PAPER, border: `1px solid ${CT.HAIRLINE}` }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${CT.HAIRLINE}` }}>
        <Link href="/classroom" className="text-[11px] font-bold inline-flex items-center gap-1 mb-2" style={{ color: CT.SKY }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          All subjects
        </Link>
        <p className="text-[15px] font-extrabold" style={{ color: CT.INK_SOFT }}>{course.title}</p>
        <div className="h-1.5 rounded-full overflow-hidden mt-2.5" style={{ background: '#EEF0F2' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CT.GREEN }} />
        </div>
        <p className="text-[11px] font-semibold mt-1.5" style={{ color: pct > 0 ? CT.GREEN : CT.FAINT }}>{pct}% complete · {done}/{total}</p>
      </div>
      <nav className="py-1.5">
        {course.lessons.map((l, i) => {
          const active = l.id === activeId
          return (
            <Link key={l.id} href={`/classroom/${course.slug}/${l.id}`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 transition-colors"
              style={{ background: active ? 'rgba(2,132,199,0.06)' : 'transparent' }}>
              <CheckCircle done={!!doneMap[l.id]} />
              <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: CT.FAINT, width: 16 }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[13px] leading-snug" style={{ color: active ? CT.SKY : CT.INK_SOFT, fontWeight: active ? 700 : 500 }}>{l.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function LessonPane({
  course, lesson, index, token, done, onToggle,
}: { course: Course; lesson: Lesson; index: number; token: string; done: boolean; onToggle: () => void }) {
  const hasVideo = !!course.hasVideo
  const vid = ytId(lesson.videoUrl)
  const prev = course.lessons[index - 1]
  const next = course.lessons[index + 1]

  return (
    <div>
      {/* Breadcrumb */}
      <p className="text-[11px] font-semibold mb-3" style={{ color: CT.FAINT }}>
        <Link href="/classroom" style={{ color: CT.FAINT }}>Classroom</Link> · <span style={{ color: CT.AMBER }}>{course.subject}</span> · Topic {index + 1}
      </p>

      {/* VIDEO on top (16:9) — video courses only (Maths) */}
      {hasVideo && (
        <div className="rounded-[16px] overflow-hidden mb-5" style={{ aspectRatio: '16 / 9', background: CT.INK, border: `1px solid ${CT.HAIRLINE}` }}>
          {vid ? (
            <iframe
              className="w-full h-full" style={{ border: 0 }}
              src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`}
              title={lesson.title} allow="accelerated-sensors; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen
            />
          ) : lesson.videoUrl ? (
            <video className="w-full h-full" controls src={lesson.videoUrl} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Video coming soon</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>The explanation below is ready to study now.</p>
            </div>
          )}
        </div>
      )}

      {/* Title + mark-complete */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: CT.INK_SOFT, letterSpacing: '-0.01em' }}>{lesson.title}</h1>
        <button onClick={onToggle}
          className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 transition-all active:scale-[0.98]"
          style={done
            ? { background: 'rgba(22,163,74,0.10)', color: CT.GREEN, border: `1px solid rgba(22,163,74,0.30)` }
            : { background: CT.INK, color: '#fff', boxShadow: '0 6px 18px rgba(26,26,46,0.22)' }}>
          <CheckCircle done={done} />
          {done ? 'Completed' : 'Mark complete'}
        </button>
      </div>
      <p className="text-[13px] mb-5" style={{ color: CT.MUTED }}>{lesson.blurb}</p>

      {/* EXPLANATION below */}
      <article className="cm-lesson" dangerouslySetInnerHTML={{ __html: lesson.explanation }} />

      {/* Interactive module — EMBEDDED for non-video courses (their primary media) */}
      {lesson.practiceHtmlPath && !hasVideo && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-extrabold uppercase" style={{ color: CT.AMBER, letterSpacing: '0.16em' }}>Interactive lesson</p>
            <a href={lesson.practiceHtmlPath} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold inline-flex items-center gap-1" style={{ color: CT.SKY }}>
              Full screen
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </a>
          </div>
          <div className="rounded-[16px] overflow-hidden" style={{ border: `1px solid ${CT.HAIRLINE}`, background: CT.PAPER }}>
            <iframe key={lesson.id} src={lesson.practiceHtmlPath} title={lesson.title} className="w-full" style={{ height: '78vh', border: 0, display: 'block' }} />
          </div>
        </div>
      )}

      {/* Practice link — video courses (Maths) keep the module as a side link */}
      {lesson.practiceHtmlPath && hasVideo && (
        <a href={lesson.practiceHtmlPath} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-5 pl-4 pr-4 py-2.5 rounded-xl text-[13px] font-bold"
          style={{ background: '#F7F6F3', border: `1px solid ${CT.HAIRLINE}`, color: CT.INK_SOFT }}>
          ✍️ Practice questions
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </a>
      )}

      {/* Prev / Next */}
      <div className="flex items-center justify-between gap-3 mt-8 pt-5" style={{ borderTop: `1px solid ${CT.HAIRLINE}` }}>
        {prev ? (
          <Link href={`/classroom/${course.slug}/${prev.id}`} className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: CT.MUTED }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/classroom/${course.slug}/${next.id}`} className="flex items-center gap-1.5 text-[13px] font-bold text-right" style={{ color: CT.SKY }}>
            {next.title}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}

export default function LessonView({ subjectSlug, topicId }: { subjectSlug: string; topicId: string }) {
  const router = useRouter()
  const { ready, userName, token } = useClassroomSession()
  const found = getLesson(subjectSlug, topicId)
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({})
  const openedAt = useRef<number>(0)

  // Load completion ticks from localStorage once the course is known.
  const course = found?.course
  useEffect(() => {
    if (!course) return
    const map: Record<string, boolean> = {}
    for (const l of course.lessons) map[l.id] = isDone(l.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoneMap(map)
  }, [course])

  // Cross-device sync: fold the student's SERVER-side completions into the ticks,
  // so progress survives a new device or cleared storage.
  useEffect(() => {
    if (!ready || !token || !course) return
    let cancelled = false
    void fetchClassroomCompleted(token).then(list => {
      if (cancelled || list.length === 0) return
      setDoneMap(m => {
        const next = { ...m }
        for (const id of list) { next[id] = true; setDone(id, true) }
        return next
      })
    })
    return () => { cancelled = true }
  }, [ready, token, course])

  // Fire open metrics + dwell beacon per topic.
  useEffect(() => {
    if (!ready || !token || !found) return
    openedAt.current = Date.now()
    trackLessonOpen(token, topicId)
    postClassroomProgress(token, topicId, found.course.subject, 'open')
    const onHide = () => beaconLessonDwell(topicId, Date.now() - openedAt.current)
    window.addEventListener('pagehide', onHide)
    return () => { window.removeEventListener('pagehide', onHide); onHide() }
  }, [ready, token, topicId, found])

  // Let an embedded interactive module authenticate its own /api/study/interaction
  // posts (same pattern the [studentId] viewer uses before iframing a module).
  useEffect(() => {
    if (!token) return
    try { localStorage.setItem('cm:access_token', token); localStorage.setItem('cm:material_id', topicId) } catch { /* ignore */ }
  }, [token, topicId])

  const toggle = useCallback(() => {
    if (!found) return
    const nextDone = !doneMap[topicId]
    const dwellMs = Date.now() - openedAt.current
    setDone(topicId, nextDone)
    setDoneMap(m => ({ ...m, [topicId]: nextDone }))
    if (!token) return
    if (nextDone) trackLessonComplete(token, topicId, dwellMs)
    // Dedicated per-student record (survives device changes / cleared storage).
    postClassroomProgress(token, topicId, found.course.subject, nextDone ? 'complete' : 'uncomplete', nextDone ? dwellMs : 0)
  }, [found, doneMap, topicId, token])

  if (!ready) {
    return <AppLayout userName={userName}><div className="max-w-6xl mx-auto px-4 py-8"><div className="rounded-[16px] animate-pulse" style={{ aspectRatio: '16/9', background: '#F1F1EF', maxWidth: 760 }} /></div></AppLayout>
  }

  if (!found) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-[15px] font-bold mb-2" style={{ color: CT.INK_SOFT }}>Topic not found</p>
          <button onClick={() => router.replace('/classroom')} className="text-[13px] font-bold" style={{ color: CT.SKY }}>Back to Classroom →</button>
        </div>
      </AppLayout>
    )
  }

  const { lesson, index } = found
  return (
    <AppLayout userName={userName}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
          {/* Sidebar (top on mobile, left rail on desktop) */}
          <aside className="lg:sticky lg:top-6 self-start"><Sidebar course={found.course} activeId={topicId} doneMap={doneMap} /></aside>
          {/* Lesson */}
          <main style={{ maxWidth: 760 }}>
            <LessonPane course={found.course} lesson={lesson} index={index} token={token} done={!!doneMap[topicId]} onToggle={toggle} />
          </main>
        </div>
      </div>
    </AppLayout>
  )
}

export function courseExists(slug: string): Course | undefined { return getCourse(slug) }
