# Daily Path — test-gated, connected daily journey

**Status:** Approved by founder 2026-08-03, pending implementation plan.
**Owner:** Rajan (platform)

## Problem

Three things surfaced while reviewing the newly-shipped chemistry modules:

1. **"Progress" is fake.** The Classroom's "Mark complete" button and its 0–100% course bar are read/written entirely from `localStorage` (`completionKey()` in `src/data/classroom.ts`). They never touch the database. A student can click "complete" without opening a node, or master every MCQ and never see it reflected. The founder can't see any of it either — it never leaves the browser.
2. **New content is invisible.** The Classroom "Science" course lists 27 lessons as one flat numbered sequence: 10 physics, then 5 biology, then the 12 chemistry lessons at the very bottom. A student has to scroll past 15 unrelated items to reach today's highlighted content.
3. **Nothing is connected, and nothing enforces follow-through.** `Modules` (the day-gated study plan) and `Classroom` (free subject browsing) are two disconnected sidebar destinations. Neither references the Daily Test. A student can open a module and never test on it; a student can skip straight to any future day. The founder's stated core differentiator — "a student learns something consecutive and productive, day by day... a thing no one can procrastinate or leave" — has no mechanism behind it today.

## Goals

- Every "you finished this" signal a student sees must come from real backend data (`node_progress`, `mcq_attempts`, `daily_tests`), never from `localStorage` alone.
- A day's content becomes available in sequence: today's module unlocks today's Daily Test; the next day unlocks only once today's Daily Test has been **attempted** (submitted), regardless of score. Attempting the test is the proof of learning — this repo's founder was explicit that a low score should not wall a student out, only skipping the test should.
- Streak increments once per day, only when both halves (studied + tested) are complete that day.
- The daily flow is visualized as a single connected path (approved design: a winding, Candy-Crush-style map of nodes), not three separate screens a student has to piece together themselves.
- Chemistry (and every subject) gets accurate completion data and better in-list positioning as a side effect of point 1, without a separate special-case fix.

## Non-goals (this spec)

- **Weekly rivals** and **daily side-quests** — good ideas raised during brainstorming, explicitly deferred. Not core to "can't procrastinate," add scope without changing the core mechanic.
- **AI chatbox content retrieval** — a separate, unrelated feature request that came in during this session. Tracked separately; not designed here.
- Changing the underlying exam-plan content or weightage (`PROGRAMS`, `PLANS` in `src/data/programs.ts`) — only the *unlock behavior* around existing days changes, not the curriculum itself.
- Rebuilding Classroom's subject browsing into the gated chain. Classroom stays free-roam/optional revision; only its completion tracking gets fixed to use real data.

## Architecture

### 1. Unlock state — new source of truth

Today, "which day is unlocked" doesn't exist as a concept — `FREE_DAYS` only gates *payment*, not *sequence*. This spec adds a genuine per-student unlock cursor.

- New table `daily_unlock_state` (one row per `user_id` + `program_id`): `current_day`, `day_started_at`, `day_test_attempted_at`.
- A day advances (`current_day += 1`) the moment a row is written to `daily_tests` for that user/day — i.e., the existing grade-submission flow (`/api/study/daily-test/grade`) becomes the trigger. No new "attempt" endpoint is needed; the existing submission *is* the unlock event.
- "Studied" (required before the test node unlocks) is satisfied by at least one `node_opened` or `mcq_attempt` interaction row for that day's modules — reusing the exact tracking pipeline verified today for the chemistry modules. No new tracking mechanism, just a new read query over it.

### 2. Server-side enforcement, not just UI hiding

Given the existing `cm_access` entitlement-gate precedent (static `/study/*.html` files are gated server-side via middleware, not just hidden in the UI), the day-unlock gate must be enforced the same way:

- `/api/materials/open/[id]` (already the chokepoint for opening any module) gains a check: if the requested module's day is beyond `current_day + 1`, reject with a clear "complete today's test first" error, mirroring the existing `payment_verified` check pattern already in that route.
- The Daily Test's own routes (`daily-test-engine/status`, `[day]`, `grade`) already know the day; they gain the same "studied-today" precondition before allowing a submission.
- The client-side path UI reflects this state but is not the enforcement boundary — same principle as the existing entitlement work.

### 3. Path UI component

New component, `DailyPathView`, replacing the current flat "Modules" list as the primary view under the `Modules` nav item (Classroom nav item and its content are untouched structurally).

- Renders a vertical winding path (validated in the interactive browser mockup): one **study node** per day, one **test node** (styled as a "Boss Fight") immediately after.
- Node states: `locked` (grey), `available`/`current` (pulsing green, or purple for an unlocked test), `done` (gold, with 1–3 stars derived from that day's real `daily_tests` accuracy — not from a self-report).
- Tapping a locked node shows why it's locked ("Finish today's test first") rather than silently doing nothing.
- Tapping the test node opens a modal reusing the *existing* Daily Test flow (`daily-test-engine`) inside a "Boss Fight" frame — same questions, same grading, new wrapper chrome only. No parallel quiz engine.

### 4. Streak, XP, avatar, badges

- **Streak**: extends the existing `StreakCard`/`streak` computation (`DashboardView`) to require both `node_opened`/`mcq_attempt` activity *and* a `daily_tests` row for the same calendar day, instead of today's looser "attended" definition. One earnable "streak freeze" (consumes accumulated XP) forgives exactly one missed day, surfaced on the streak card.
- **XP**: additive counter already partially present in the Classroom's local `P.xp`/`award()` pattern — this spec promotes it to a real, server-recorded value (derived from `mcq_attempts.is_correct` counts + test completion), not the current per-browser localStorage tally.
- **Avatar**: replaces the flat blue "PK" initials circle (the founder's earlier, still-open request) with a small evolving glyph keyed off total XP tier — Rookie (0–49 XP), Scholar (50–149), Topper (150+), matching the thresholds validated in the interactive mockup. One feature satisfies two backlog items.
- **Badges**: computed, not stored as new state — derived at render time from existing data (streak length, perfect-accuracy test days, subject-completion counts). No new write path.

### 5. Classroom changes (small, isolated)

- `completionKey()`/`localStorage` read-write in `src/data/classroom.ts` and `src/components/classroom/lib.tsx` is replaced with a real read from `node_progress`/`mcq_attempts` for that lesson's `practiceHtmlPath` id, and a write path already exists (the tracking pipeline) — this is a **removal** of fake state, not a new system.
- Chemistry's position in the Science course lesson list is addressed by grouping the existing flat list into visible subject sub-headers (Physics / Chemistry / Biology) inside `ClassroomGrid`/the course view, using the `subject` field already present on each `Module`. No data model change — purely a rendering grouping fix.

## Data flow summary

```
Student opens today's module
  → node_opened / mcq_attempt rows land in node_progress / mcq_attempts (existing pipeline)
  → Path UI reads this to flip the test node from locked → available (Boss Fight)
Student submits Daily Test
  → existing /api/study/daily-test/grade write to daily_tests (existing)
  → NEW: daily_unlock_state.current_day advances
  → NEW: streak/XP recompute includes this day
  → Path UI reads updated state, flips next day's node to available
```

## Error handling / edge cases

- **Missed day**: `current_day` does not auto-advance without a test submission — a student returning after a gap resumes exactly where they left off, path shows the gap as still-locked-but-reachable (not skipped, not punished beyond the streak reset).
- **Retaking a test**: a day already marked `done` can still be reopened for practice; re-submission does not regress `current_day` or double-count streak/XP for that day.
- **Multi-program students**: `daily_unlock_state` is keyed per `(user_id, program_id)` since `PLANS` differ by program (LDC/SSC/Banking) — a student's unlock cursor on one plan is independent of another if they ever switch.
- **Existing paid students mid-plan**: on rollout, `current_day` backfills from each student's actual furthest-attended day (via existing attendance data) so nobody already past Day 20 gets locked back to Day 1.

## Testing

- Unit coverage on the new `daily_unlock_state` advance logic (submission → advance, no double-advance on resubmission, per-program isolation).
- Server-side gate test: requesting a locked day's module via `/api/materials/open/[id]` returns the same class of rejection as the existing `payment_verified` gate.
- Streak calculation test: a day with study-only (no test) does not extend streak; a day with test-only (no study interaction) — decide during planning whether this is possible given the enforced order, likely unreachable by construction.
- Manual verification pass on the real chemistry content (Day 16–18), same approach used to verify tracking earlier today: click through, capture the actual network payloads, confirm `daily_unlock_state` advances only on real submission.

## Phased build (for the implementation plan)

1. **Phase 1 — mechanic only**: `daily_unlock_state` table + advance logic, server-side gate on `/api/materials/open/[id]` and the daily-test routes, real streak recompute. No new UI yet — ships the enforcement before the polish.
2. **Phase 2 — path UI**: `DailyPathView` replacing the flat Modules list, Boss Fight modal wrapper around the existing Daily Test flow.
3. **Phase 3 — game layer**: real XP, evolving avatar, badges, streak freeze.
4. **Phase 4 (separate, low-risk, can ship anytime)**: Classroom `completionKey()` → real data swap, and subject sub-headers for the Science course list.

Phase 4 is independent of 1–3 and could ship first if the founder wants the "stop lying about progress" fix live sooner than the full path rebuild.
