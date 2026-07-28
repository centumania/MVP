/**
 * Free-tier content allowlist — the single source of truth for WHICH static
 * study files an unpaid (but signed-in) student may read.
 *
 * WHY THIS EXISTS: every lesson under /public/study is a plain static file.
 * The middleware cookie gate used to check only that `cm_access` was present,
 * and /api/materials/status set that cookie for ANY authenticated user — so a
 * free account could read every paid lesson just by knowing its URL, even
 * though the /api/materials/open gateway correctly returns 402. Front door
 * locked, back door open. Middleware now checks entitlement against this list.
 *
 * The list is DERIVED from the same data the UI gates on, never hardcoded, so
 * newly added modules and classroom topics stay correctly gated automatically:
 *   - modules scheduled on day <= FREE_DAYS in ANY program  (matches
 *     src/app/materials/page.tsx and /api/materials/open/[id])
 *   - the first FREE_TOPICS practice modules of each classroom course
 *     (matches src/components/classroom/LessonView.tsx)
 *   - the daily test engine, which is always reachable but self-gates per day
 *     server-side (see /api/study/daily-test-engine/*) and no longer contains
 *     any answers.
 */
import { PLANS, moduleHtmlPath } from '@/src/data/programs'
import { COURSES } from '@/src/data/classroom'

/** Must match FREE_DAYS in /api/materials/open/[id] and materials/page.tsx. */
export const FREE_DAYS = 2
/** Must match FREE_TOPICS in components/classroom/LessonView.tsx. */
export const FREE_TOPICS = 5

/** Always reachable: it holds no answers and gates each day server-side. */
const ALWAYS_FREE = ['/study/daily-test-engine.html']

function buildFreeStudyPaths(): ReadonlySet<string> {
  const paths = new Set<string>(ALWAYS_FREE)

  // Modules that appear on a free day in any programme's plan.
  for (const plan of Object.values(PLANS)) {
    for (const dayPlan of plan) {
      if (dayPlan.day > FREE_DAYS) continue
      for (const moduleId of dayPlan.modules) paths.add(moduleHtmlPath(moduleId))
    }
  }

  // Practice modules embedded in the free head of each classroom course.
  for (const course of COURSES) {
    for (const lesson of course.lessons) {
      if (lesson.order <= FREE_TOPICS && lesson.practiceHtmlPath) {
        paths.add(lesson.practiceHtmlPath)
      }
    }
  }

  return paths
}

export const FREE_STUDY_PATHS = buildFreeStudyPaths()

/**
 * True when `pathname` is free-tier content. Compares the path only (any query
 * string is ignored) and is case-insensitive, so a casing or `?v=` variation
 * can't be used to slip past the check.
 */
export function isFreeStudyPath(pathname: string): boolean {
  const clean = pathname.split('?')[0].split('#')[0].toLowerCase()
  for (const p of FREE_STUDY_PATHS) {
    if (p.toLowerCase() === clean) return true
  }
  return false
}
