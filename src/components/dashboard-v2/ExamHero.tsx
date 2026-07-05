/**
 * Dashboard v2 — daily action cards.
 * ExamHero surfaces today's formal exam (v1 fetched this data but never
 * rendered it — the platform's core action had no dashboard entry point).
 * DailyTestCard is the secondary AI revision action.
 */
import Link from 'next/link'
import { ArrowRight, Brain, CheckCircle, Timer } from '@/src/components/landing-v2/icons'

export type TodayExam = {
  dayNumber: number
  examId: string
  alreadySubmitted: boolean
  score?: number
  totalMarks?: number
}

export function ExamHero({ exam }: { exam: TodayExam | null }) {
  if (!exam) {
    return (
      <section className="flex items-center gap-4 rounded-2xl border border-gray-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
          <Timer size={20} />
        </span>
        <div>
          <p className="text-[14.5px] font-bold text-gray-900">No exam scheduled today</p>
          <p className="mt-0.5 text-[13px] text-gray-500">Use the time to revise — your AI test below is ready.</p>
        </div>
      </section>
    )
  }

  if (exam.alreadySubmitted) {
    const pct = exam.totalMarks ? Math.round(((exam.score ?? 0) / exam.totalMarks) * 100) : null
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle size={20} />
        </span>
        <div className="flex-1">
          <p className="text-[14.5px] font-bold text-gray-900">Day {exam.dayNumber} exam submitted ✓</p>
          <p className="mt-0.5 text-[13px] text-gray-600">
            {exam.score != null && exam.totalMarks != null ? (
              <>You scored <strong className="tabular-nums text-emerald-700">{exam.score}/{exam.totalMarks}</strong>{pct != null && <> · {pct}%</>}. Your AI Mentor report is ready.</>
            ) : (
              'Well done showing up. Your AI Mentor report is ready.'
            )}
          </p>
        </div>
        <Link
          href={`/mentor/${exam.examId}`}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-300/70 bg-white px-4 py-2.5 text-[13.5px] font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
        >
          View mentor report <ArrowRight size={14} />
        </Link>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 p-5 text-white shadow-[0_10px_28px_-8px_rgba(2,132,199,0.4)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(420px 200px at 85% -20%, rgba(255,255,255,0.14), transparent 60%)' }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Timer size={21} />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold">Day {exam.dayNumber} exam is live</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Open
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-sky-100">Window closes at 8:30 AM IST — auto-submits on timeout.</p>
        </div>
        <Link
          href="/exam/today"
          className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-[14px] font-bold text-sky-700 shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5"
        >
          Start now <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}

export function DailyTestCard() {
  return (
    <Link
      href="/study/daily-test"
      className="group flex items-center gap-4 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-300/70 hover:shadow-[0_10px_24px_-8px_rgba(99,102,241,0.3)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-105">
        <Brain size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14.5px] font-bold text-gray-900">AI Daily Revision Test</span>
          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-700">AI</span>
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-gray-500">
          Personalised questions from your weak topics · generated nightly at 11:30 PM IST
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white shadow-[0_3px_10px_rgba(79,70,229,0.3)] transition-all group-hover:bg-indigo-700">
        Take test <ArrowRight size={13} />
      </span>
    </Link>
  )
}
