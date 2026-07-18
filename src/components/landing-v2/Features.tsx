/**
 * Landing v2 — Features / interactive product preview.
 * Two showcase rows (daily exam system, leaderboard) + a supporting grid.
 * All numbers mirror real platform mechanics: 6:00–8:30 AM window,
 * server-graded scores, AI mentor report per exam, batch leaderboard.
 */
import { BarChart, BookOpen, Brain, Calendar, Flame, MessageCircle, Target, Timer, Trophy, Zap } from './icons'
import { Reveal, Container, SectionHeading } from './ui'

const LEADERBOARD_ROWS = [
  { rank: 1, name: 'Meena P.', streak: '25-day streak', score: '2,840', tone: 'text-amber-500' },
  { rank: 2, name: 'Ravi V.', streak: '23-day streak', score: '2,710', tone: 'text-gray-500' },
  { rank: 3, name: 'Arun K.', streak: '21-day streak', score: '2,590', tone: 'text-orange-400' },
]

const GRID = [
  {
    icon: Brain,
    tone: 'bg-indigo-50 text-indigo-600',
    title: 'AI Mentor reports',
    text: 'After every exam, an AI coach analyses your answers and tells you exactly what to fix — strengths, weak topics, and a predicted score range.',
  },
  {
    icon: BookOpen,
    tone: 'bg-sky-50 text-sky-600',
    title: 'Daily study materials',
    text: 'Fresh, exam-calibrated material published every day. Read it, take the test on it next morning. No hunting for resources.',
  },
  {
    icon: BarChart,
    tone: 'bg-emerald-50 text-emerald-600',
    title: 'Performance analytics',
    text: 'Subject-wise accuracy, rank trajectory and score trends — so you always know where your next mark comes from.',
  },
  {
    icon: Target,
    tone: 'bg-amber-50 text-amber-600',
    title: 'Adaptive question selection',
    text: 'The system learns your weak topics and serves more questions from them — your practice targets your gaps automatically.',
  },
  {
    icon: Flame,
    tone: 'bg-orange-50 text-orange-600',
    title: 'Streaks & achievements',
    text: 'Daily streaks, XP and badges reward consistency. Small wins every morning compound into exam-day confidence.',
  },
  {
    icon: MessageCircle,
    tone: 'bg-sky-50 text-sky-600',
    title: 'Direct support',
    text: 'Real humans on WhatsApp for payment, access or exam-day issues. No ticket queues, no bots.',
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-white py-16 sm:py-24" style={{ boxShadow: 'inset 0 1px 0 rgba(16,24,40,0.05), inset 0 -1px 0 rgba(16,24,40,0.05)' }}>
      <Container>
        <SectionHeading
          label="The system"
          labelTone="indigo"
          title="Everything you need. Nothing you don't."
          sub="One programme that handles your study plan, testing, analysis and motivation — end to end."
        />

        {/* Showcase 1 — daily exam */}
        <div className="mx-auto mb-16 grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-sky-600">
              <Timer size={15} /> Daily exam system
            </span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              One timed exam.<br />Every morning. 6 AM sharp.
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600 sm:text-base">
              The window opens at 6:00 and closes at 8:30 AM IST. Miss it, and the day is marked missed —
              that&apos;s the point. Exam-day pressure becomes a daily habit, not a one-time shock.
            </p>
            <ul className="mt-6 space-y-3.5">
              {[
                ['Auto-submit on timeout', 'exactly like the real exam hall'],
                ['Instant results & explanations', 'learn from mistakes while they’re fresh'],
                ['Server-graded scores', 'no self-marking, no cheating the system'],
              ].map(([h, s]) => (
                <li key={h} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-200/60">
                    <Zap size={11} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-gray-700">
                    <strong className="font-semibold text-gray-900">{h}</strong> — {s}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={140}>
            {/* Exam window mock */}
            <div className="relative mx-auto max-w-sm">
              <div aria-hidden className="absolute -inset-5 rounded-[28px] bg-gradient-to-br from-sky-100/70 to-indigo-100/50 blur-xl" />
              <div className="relative rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_20px_44px_-12px_rgba(16,24,40,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-gray-900">Day 14 · General Studies</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Window open
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Closes in</div>
                  <div className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-gray-900">01:24:37</div>
                  <div className="mt-1 text-[12px] text-gray-500">6:00 – 8:30 AM IST · auto-submits</div>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-600">Questions</span>
                    <span className="font-semibold tabular-nums text-gray-900">100 MCQs · 100 marks</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-gray-600">Your average</span>
                    <span className="font-semibold tabular-nums text-emerald-600">78% ↑</span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-sky-600 py-3 text-center text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]">
                  Start today&apos;s exam
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Showcase 2 — leaderboard */}
        <div className="mx-auto mb-20 grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={140} className="order-last lg:order-first">
            <div className="relative mx-auto max-w-sm">
              <div aria-hidden className="absolute -inset-5 rounded-[28px] bg-gradient-to-br from-amber-100/60 to-sky-100/60 blur-xl" />
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06),0_20px_44px_-12px_rgba(16,24,40,0.12)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                  <span className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-900">
                    <Trophy size={15} className="text-amber-500" /> Batch leaderboard
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">updates after every exam</span>
                </div>
                {LEADERBOARD_ROWS.map((r) => (
                  <div key={r.rank} className="flex items-center gap-3 border-b border-gray-50 px-5 py-3">
                    <span className={`w-5 text-center text-[15px] font-bold tabular-nums ${r.tone}`}>{r.rank}</span>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold text-gray-900">{r.name}</div>
                      <div className="text-[11.5px] text-gray-500">{r.streak}</div>
                    </div>
                    <span className="text-[13.5px] font-bold tabular-nums text-gray-700">{r.score}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 border-l-2 border-sky-500 bg-sky-50/70 px-5 py-3">
                  <span className="w-5 text-center text-[15px] font-bold tabular-nums text-sky-600">12</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-bold text-sky-700">You</div>
                    <div className="text-[11.5px] text-sky-600/70">14-day streak · climbing</div>
                  </div>
                  <span className="text-[13.5px] font-bold tabular-nums text-sky-700">1,980</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 opacity-60">
                  <span className="w-5 text-center text-[15px] font-bold tabular-nums text-gray-500">13</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-semibold text-gray-900">Kavya S.</div>
                    <div className="text-[11.5px] text-gray-500">12-day streak</div>
                  </div>
                  <span className="text-[13.5px] font-bold tabular-nums text-gray-700">1,940</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-amber-600">
              <Trophy size={15} /> Live leaderboard
            </span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              Your rank is public.<br />So is your discipline.
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600 sm:text-base">
              Every submission updates the batch leaderboard in real time. You always know exactly where
              you stand against the people you&apos;ll face in the actual exam — and that healthy pressure
              keeps you showing up on the days motivation doesn&apos;t.
            </p>
            <ul className="mt-6 space-y-3.5">
              {[
                ['Real competitors, real stakes', 'ranked against your own batch, not anonymous millions'],
                ['Streak tracking built in', 'consistency is scored, not just marks'],
                ['Fresh start every batch', 'the board resets — early or late joiner, same fair race'],
              ].map(([h, s]) => (
                <li key={h} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                    <Zap size={11} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-gray-700">
                    <strong className="font-semibold text-gray-900">{h}</strong> — {s}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Supporting grid */}
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRID.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="group h-full rounded-2xl border border-gray-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-[0_12px_32px_-8px_rgba(16,24,40,0.12)]">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.tone} transition-transform duration-300 group-hover:scale-110`}>
                  <f.icon size={19} />
                </span>
                <h4 className="mt-4 text-[15.5px] font-bold text-gray-900">{f.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-gray-600">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Programme stats strip */}
        <Reveal delay={120}>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200/70 bg-gray-200/70 sm:grid-cols-4">
            {[
              [<Calendar key="i" size={18} className="text-sky-600" />, '8 subjects', 'one daily syllabus'],
              [<Timer key="i" size={18} className="text-indigo-600" />, '6:00 AM', 'daily exam window'],
              [<Brain key="i" size={18} className="text-emerald-600" />, '1 report', 'AI coaching per exam'],
              [<Trophy key="i" size={18} className="text-amber-500" />, 'Live', 'batch leaderboard'],
            ].map(([icon, big, small], i) => (
              <div key={i} className="flex flex-col items-center gap-1 bg-white px-4 py-6 text-center">
                {icon}
                <div className="mt-1 text-xl font-bold tracking-tight text-gray-900">{big}</div>
                <div className="text-[12px] font-medium text-gray-500">{small}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
