'use client'

/**
 * Streak card — the "don't break the chain" panel.
 *
 * A streak only motivates if the student can see it, so this is deliberately
 * the loudest card on the dashboard: a large count, and the current week laid
 * out as seven dots so a gap is visible at a glance.
 *
 * The dashboard API returns `streak` as a count of consecutive active days, not
 * a per-day history, so the week strip is derived: the most recent `streak`
 * days (up to today) are filled. That is exact whenever the streak is 7 or
 * fewer — which is the only range the strip can show anyway — and it never
 * claims activity on a future day.
 */

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Encouragement scales with the streak so day 1 and day 40 don't read alike. */
function encouragement(streak: number): string {
  if (streak === 0) return 'Start today'
  if (streak === 1) return 'Day one — begin the habit'
  if (streak < 5) return 'Keep it going'
  if (streak < 10) return "You're on a roll!"
  if (streak < 30) return "You're unstoppable!"
  return 'Extraordinary discipline'
}

export function StreakCard({ streak }: { streak: number }) {
  const today = new Date()
  const todayIdx = today.getDay() // 0 = Sunday

  // Seven calendar days ending today, oldest first.
  const week = Array.from({ length: 7 }, (_, i) => {
    const offsetFromToday = 6 - i        // 6 days ago … 0 (today)
    const dayIdx = (todayIdx - offsetFromToday + 7) % 7
    return {
      initial: DAY_INITIALS[dayIdx],
      label: DAY_LABELS[dayIdx],
      // Filled when this day falls inside the current streak.
      active: offsetFromToday < streak,
      isToday: offsetFromToday === 0,
    }
  })

  return (
    <section
      className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-[0_12px_32px_-12px_rgba(79,70,229,0.5)] sm:p-6"
      aria-label={`Study streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
    >
      <h2 className="text-[19px] font-extrabold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
        Streak
      </h2>
      <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-indigo-100">
        Every day you study, the chain grows. Show up tomorrow and it grows again.
      </p>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
        <span aria-hidden className="text-[15px]">🔥</span>
        <span className="text-[13.5px] font-bold text-gray-900">{encouragement(streak)}</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white">
        <div className="flex items-stretch">
          {/* Count */}
          <div className="flex shrink-0 flex-col items-center justify-center px-6 py-5">
            <span aria-hidden className="text-[30px] leading-none">🔥</span>
            <span
              className="mt-1 text-[34px] font-extrabold leading-none tabular-nums text-gray-900"
              style={{ letterSpacing: '-0.03em' }}
            >
              {streak}
            </span>
            <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Week strip */}
          <div className="grid flex-1 grid-cols-4 gap-y-2 border-l border-gray-100 bg-gray-50/70 px-4 py-4 sm:grid-cols-7">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] font-bold transition-colors ${
                    d.active
                      ? 'bg-amber-500 text-white shadow-[0_2px_6px_rgba(245,158,11,0.4)]'
                      : 'bg-white text-gray-300 ring-1 ring-gray-200'
                  } ${d.isToday && !d.active ? 'ring-2 ring-indigo-300' : ''}`}
                >
                  {d.initial}
                </span>
                <span className="text-[9.5px] font-semibold uppercase tracking-wide text-gray-400">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
