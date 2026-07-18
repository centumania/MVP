// src/data/classroom.ts
// Skool-style CLASSROOM: subject "courses" → topic "lessons" (video on top +
// written explanation below). Deliberately SEPARATE from programs.ts so the
// day-gated Centum system stays untouched. A lesson id is globally unique and
// doubles as the tracking material_id (feeds /api/study/interaction + /api/events).

import { AUTHORED } from './classroom.authored'

export interface Lesson {
  id: string               // global slug = tracking material_id, e.g. 'maths-num-system'
  title: string
  blurb: string            // one-liner (sidebar hover / card)
  videoUrl?: string        // YouTube link or 11-char id (CSP allows youtube-nocookie); or an mp4 URL
  explanation: string      // trusted in-repo HTML rendered under the video
  practiceHtmlPath?: string // optional: link/embed to an existing interactive /study/*.html
  order: number
}

export interface Course {
  subject: string          // 'Maths', 'Ancient History', ...
  slug: string             // url segment, e.g. 'maths'
  title: string
  blurb: string            // card subtitle
  emoji: string            // cover accent (until real cover art)
  accent: string           // cover gradient accent hex
  order: number
  status: 'live' | 'coming-soon'
  hasVideo?: boolean       // true → lesson shows a video slot on top (Maths); false → embeds the interactive module
  lessons: Lesson[]
}

// ── Maths / Aptitude course (the founder's first Skool-style course) ─────────
// 3 topics point at finished interactive modules for practice; every topic has a
// written explanation now and an empty video slot for the founder to paste a link.
const MATHS: Course = {
  subject: 'Maths',
  slug: 'maths',
  title: 'Quantitative Aptitude',
  blurb: 'Every arithmetic topic on the exam — a short video, then a clear worked explanation.',
  emoji: '📐',
  accent: '#2563EB',
  order: 3,
  status: 'live',
  hasVideo: true,
  lessons: [
    {
      id: 'maths-num-system',
      title: 'Number System, HCF & LCM',
      blurb: 'Divisibility, factors, HCF/LCM and remainders.',
      order: 1,
      practiceHtmlPath: '/study/num-system.html',
      explanation: `
        <h3>What you'll master</h3>
        <p>The number system underpins almost every other arithmetic topic. Get fluent here and simplification, ratios and remainders all get easier.</p>
        <ul>
          <li><strong>Classification</strong> — natural, whole, integers, rational vs irrational, primes &amp; composites.</li>
          <li><strong>Divisibility rules</strong> — quick tests for 2, 3, 4, 5, 6, 8, 9, 11 that save you seconds in the exam.</li>
          <li><strong>HCF &amp; LCM</strong> — prime-factorisation and division methods; the identity <em>HCF × LCM = product of the two numbers</em>.</li>
          <li><strong>Remainders</strong> — unit-digit cycles and basic remainder theorems for "find the remainder" questions.</li>
        </ul>
        <h3>Exam tip</h3>
        <p>For "largest number that divides…" think <strong>HCF</strong>; for "smallest number divisible by…" think <strong>LCM</strong>. Getting that reflex right solves most word problems in one line.</p>
      `,
    },
    {
      id: 'maths-average-ages',
      title: 'Average & Ages',
      blurb: 'Averages, weighted averages and age puzzles.',
      order: 2,
      practiceHtmlPath: '/study/maths-avg-ages.html',
      explanation: `
        <h3>Averages</h3>
        <p>Average = <em>sum of values ÷ number of values</em>. Most questions are really about the <strong>sum</strong> — find it, then adjust.</p>
        <ul>
          <li>When a new value joins/leaves, work with the change in total, not the individual numbers.</li>
          <li><strong>Weighted average</strong> blends groups of different sizes — never just average the averages.</li>
        </ul>
        <h3>Ages</h3>
        <p>Translate words to one variable and remember: the <em>difference</em> between two people's ages is constant over time, even though the <em>ratio</em> changes. That single idea cracks most age problems.</p>
      `,
    },
    {
      id: 'maths-profit-loss',
      title: 'Profit, Loss & Discount',
      blurb: 'CP, SP, marked price, successive discounts.',
      order: 3,
      practiceHtmlPath: '/study/maths-profit-loss.html',
      explanation: `
        <h3>The core relationships</h3>
        <ul>
          <li>Profit% and Loss% are <strong>always on Cost Price</strong> unless stated otherwise.</li>
          <li>Discount is <strong>always on Marked Price</strong>.</li>
          <li>SP = CP × (100 ± profit/loss%)/100; SP = MP × (100 − discount%)/100.</li>
        </ul>
        <h3>Successive discounts</h3>
        <p>Two discounts of a% and b% are <em>not</em> a+b%. The net is <strong>a + b − ab/100</strong>. Learn this one shortcut — it's a guaranteed exam question.</p>
      `,
    },
    {
      id: 'maths-percentages',
      title: 'Percentages',
      blurb: 'Percentage change, fractions and quick conversions.',
      order: 4,
      explanation: `
        <h3>Think in fractions</h3>
        <p>Memorise the common fraction ↔ percentage pairs (1/8 = 12.5%, 1/6 ≈ 16.67%, 3/8 = 37.5%…). Converting a % to a fraction turns slow multiplication into instant mental maths.</p>
        <h3>Percentage change</h3>
        <p>Increase then decrease by the same % does <strong>not</strong> return the original — the net is a loss of <em>(x²/100)%</em>. Watch for this trap.</p>
      `,
    },
    { id: 'maths-ratio-proportion', title: 'Ratio & Proportion', blurb: 'Dividing quantities, proportion and variation.', order: 5,
      explanation: `<h3>Ratios</h3><p>Keep ratios in their simplest whole-number form and use a common multiplier <em>k</em> (e.g. 3k : 4k) so you can solve with one equation. Proportion just says two ratios are equal — cross-multiply.</p>` },
    { id: 'maths-si-ci', title: 'Simple & Compound Interest', blurb: 'SI, CI, and the difference between them.', order: 6,
      explanation: `<h3>SI vs CI</h3><p>SI grows by a fixed amount each year; CI grows on the new balance. For 2 years, <strong>CI − SI = P(r/100)²</strong> — a one-line shortcut that appears every exam.</p>` },
    { id: 'maths-time-work', title: 'Time & Work', blurb: 'Work rates, pipes & cisterns.', order: 7,
      explanation: `<h3>Work as a rate</h3><p>If A finishes in <em>n</em> days, A's one-day work is 1/n. Add rates for people working together. The LCM method (assume total work = LCM of the days) avoids fractions entirely.</p>` },
    { id: 'maths-tsd', title: 'Time, Speed & Distance', blurb: 'Relative speed, trains, boats & streams.', order: 8,
      explanation: `<h3>The one formula</h3><p>Distance = Speed × Time. Everything else — trains crossing, boats up/downstream, relative speed — is this formula with the right speed. Convert km/h ↔ m/s with × 5/18.</p>` },
    { id: 'maths-mixtures', title: 'Mixtures & Alligation', blurb: 'Alligation rule and repeated replacement.', order: 9,
      explanation: `<h3>Alligation</h3><p>The alligation rule finds the ratio in which two ingredients (or prices) are mixed to hit a target average — a visual cross that replaces heavy algebra.</p>` },
    { id: 'maths-mensuration', title: 'Mensuration (2D & 3D)', blurb: 'Areas, perimeters, surface areas & volumes.', order: 10,
      explanation: `<h3>Build a formula sheet</h3><p>2D (triangle, circle, quadrilaterals) and 3D (cube, cuboid, cylinder, cone, sphere) formulas are pure recall. Keep units consistent and watch for "surface area vs volume".</p>` },
    { id: 'maths-algebra-geometry', title: 'Algebra, Geometry & Trigonometry', blurb: 'Identities, lines, triangles and ratios.', order: 11,
      explanation: `<h3>Foundations</h3><p>Algebraic identities (a±b)², a²−b², and the basic trig ratios + Pythagoras cover most questions. Learn the standard-angle table (0/30/45/60/90°) cold.</p>` },
    { id: 'maths-data-interpretation', title: 'Data Interpretation', blurb: 'Tables, bar/pie charts and quick calculation.', order: 12,
      explanation: `<h3>Read before you calculate</h3><p>DI rewards fast, approximate arithmetic. Scan the chart, note units and totals, and use percentage/ratio shortcuts instead of exact long multiplication.</p>` },
  ],
}

// ── Reasoning course (the second video subject, alongside Maths) ─────────────
// Video slots ready for the founder's links; each topic has a written method now.
const REASONING: Course = {
  subject: 'Reasoning',
  slug: 'reasoning',
  title: 'Logical & Verbal Reasoning',
  blurb: 'Every reasoning type on the exam — a short video, then the method that cracks it.',
  emoji: '🧩',
  accent: '#4F46E5',
  order: 4,
  status: 'live',
  hasVideo: true,
  lessons: [
    { id: 'reasoning-analogy', title: 'Analogy & Classification', blurb: 'Spot the relationship, then apply or odd-one-out.', order: 1,
      explanation: `<h3>Analogy & Classification</h3><p>Both test one skill: identifying the <em>relationship</em> inside a pair or group, then extending it (analogy) or breaking it (odd-one-out).</p><ul><li>Name the exact link — cause–effect, worker–tool, synonym, part–whole — before you look at options.</li><li>Apply the <strong>same</strong> relationship in the same order to the second pair.</li><li>For classification, four share a property and one doesn't — find the shared rule first.</li></ul>` },
    { id: 'reasoning-series', title: 'Number & Letter Series', blurb: 'Find the pattern in numbers, letters and mixed series.', order: 2,
      explanation: `<h3>Number & Letter Series</h3><p>Test the gaps between terms first — a constant difference, a ratio, squares/cubes, or an alternating pattern.</p><ul><li>Check <strong>differences</strong>, then <strong>second differences</strong>, then ratios.</li><li>Watch for two interleaved series (alternate terms).</li><li>For letters, convert to position numbers (A=1…Z=26) and treat it as a number series.</li></ul>` },
    { id: 'reasoning-coding-decoding', title: 'Coding–Decoding', blurb: 'Letter-shift, substitution and number codes.', order: 3,
      explanation: `<h3>Coding–Decoding</h3><p>A rule hides the message — most often a fixed letter shift, a substitution, or a position/number code.</p><ul><li>Compare the word and its code letter-by-letter to find the shift.</li><li>Common types: <strong>letter-shift</strong> (+1, −2), <strong>substitution</strong>, and <strong>number coding</strong>.</li><li>Write the alphabet with positions to spot ±k shifts instantly.</li></ul>` },
    { id: 'reasoning-blood-relations', title: 'Blood Relations', blurb: 'Family trees, pointing puzzles and coded relations.', order: 4,
      explanation: `<h3>Blood Relations</h3><p>Draw a small <em>family tree</em> instead of holding relations in your head — use symbols for male/female and lines for generations.</p><ul><li>Break "pointing" statements (<em>that man's father is my son's father</em>) from the end backwards.</li><li>Mark <strong>+ / −</strong> or ♂/♀ so gender never trips you.</li><li>In coded relations, decode one link at a time.</li></ul>` },
    { id: 'reasoning-direction', title: 'Direction Sense', blurb: 'Track turns and find distance/direction.', order: 5,
      explanation: `<h3>Direction Sense</h3><p>Draw every move on paper with N up; each left/right turn is 90°. The answer is usually a straight-line distance or a final direction.</p><ul><li>Use the <strong>Pythagoras</strong> shortcut for net displacement.</li><li>Left/right depends on the direction you are <em>facing</em>, not the page.</li><li>Watch shadow/sunrise questions (sun in east at dawn, west at dusk).</li></ul>` },
    { id: 'reasoning-ranking', title: 'Ranking & Order', blurb: 'Positions from top/bottom, left/right.', order: 6,
      explanation: `<h3>Ranking & Order</h3><p>Convert "from the left" and "from the right" into one line, and use the identity <strong>Total = left + right − 1</strong>.</p><ul><li>Rank from top = (Total − rank from bottom) + 1.</li><li>When two ranks overlap, the overlap gives the total.</li><li>Draw the row; don't compute blind.</li></ul>` },
    { id: 'reasoning-syllogism', title: 'Syllogism', blurb: 'All/Some/No statements and valid conclusions.', order: 7,
      explanation: `<h3>Syllogism</h3><p>Test conclusions with <em>Venn diagrams</em> — a conclusion is valid only if it holds in <strong>every</strong> possible diagram.</p><ul><li>Draw the least-overlapping case first; if the conclusion fails there, it's false.</li><li>"Some A are B" always allows "Some B are A".</li><li>Check "either–or" pairs when neither single conclusion always holds.</li></ul>` },
    { id: 'reasoning-seating', title: 'Seating Arrangement & Puzzles', blurb: 'Linear, circular and floor/box puzzles.', order: 8,
      explanation: `<h3>Seating Arrangement & Puzzles</h3><p>Start from the <em>most definite</em> clue and build outward; track facing direction carefully in circular puzzles.</p><ul><li>In a circle facing centre, left/right are <strong>reversed</strong> vs a line.</li><li>Pencil in fixed positions first, then relative clues.</li><li>For floors/boxes, a top-to-bottom grid beats mental juggling.</li></ul>` },
    { id: 'reasoning-clock-calendar', title: 'Clock & Calendar', blurb: 'Angles, coincidences and finding the day.', order: 9,
      explanation: `<h3>Clock & Calendar</h3><p>For clocks, the minute hand gains 5.5° per minute on the hour hand; for calendars, work in <em>odd days</em>.</p><ul><li>Angle between hands = |30H − 5.5M|.</li><li>Hands coincide 11 times every 12 hours.</li><li>Calendar: use odd-days and the leap-year rule (÷4, century ÷400).</li></ul>` },
    { id: 'reasoning-cubes-dice', title: 'Cubes, Dice & Figures', blurb: 'Painted cubes, dice faces and paper folding.', order: 10,
      explanation: `<h3>Cubes, Dice & Figures</h3><p>For a painted cube cut into n³ pieces, memorise the corner/edge/face/inner counts; for dice, use the opposite-face rule.</p><ul><li>Corners (3 faces) = 8; edges (2) = 12(n−2); one face = 6(n−2)²; inner (0) = (n−2)³.</li><li>Opposite faces of a standard die sum to 7.</li><li>For folding, track one marked edge through each fold.</li></ul>` },
    { id: 'reasoning-venn', title: 'Venn Diagrams', blurb: 'Relate groups and read set overlaps.', order: 11,
      explanation: `<h3>Venn Diagrams</h3><p>Pick the diagram whose overlaps match how the groups relate in the real world (e.g. dog–animal–pet).</p><ul><li>Fully-contained sets nest inside; partly-overlapping sets intersect.</li><li>Disjoint groups (men, women, doctors → careful: doctors overlaps both).</li><li>Read the question's exact wording — "some" vs "all" changes the picture.</li></ul>` },
    { id: 'reasoning-statement-conclusion', title: 'Statement & Conclusion', blurb: 'Assumptions, inferences and courses of action.', order: 12,
      explanation: `<h3>Statement & Conclusion</h3><p>Accept only what <em>must</em> follow from the statement — never add outside knowledge.</p><ul><li>An <strong>assumption</strong> is something taken for granted for the statement to make sense.</li><li>A <strong>conclusion</strong> must be directly supported; reject "too strong" options.</li><li>For course-of-action, the action must be practical and clearly address the problem.</li></ul>` },
  ],
}

// Every subject is live. Maths & Reasoning are video courses (defined here); the
// rest are authored from their interactive modules in classroom.authored.ts.
export const COURSES: Course[] = [MATHS, REASONING, ...AUTHORED].sort((a, b) => a.order - b.order)

export function getCourse(slug: string): Course | undefined {
  return COURSES.find(c => c.slug === slug)
}

export function getLesson(slug: string, topicId: string): { course: Course; lesson: Lesson; index: number } | undefined {
  const course = getCourse(slug)
  if (!course) return undefined
  const index = course.lessons.findIndex(l => l.id === topicId)
  if (index < 0) return undefined
  return { course, lesson: course.lessons[index]!, index }
}

// localStorage key for instant completion ticks (backend also gets node_completed).
export const completionKey = (topicId: string) => `cm:classroom:done:${topicId}`
