// src/data/classroom.ts
// Skool-style CLASSROOM: subject "courses" → topic "lessons" (video on top +
// written explanation below). Deliberately SEPARATE from programs.ts so the
// day-gated Centum system stays untouched. A lesson id is globally unique and
// doubles as the tracking material_id (feeds /api/study/interaction + /api/events).

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
  order: 1,
  status: 'live',
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

// Other subjects appear as "coming soon" cards until their courses are built.
const COMING_SOON: Course[] = [
  { subject: 'Ancient History', slug: 'ancient-history', title: 'Ancient History', blurb: 'IVC to the classical age.', emoji: '🏛️', accent: '#B45309', order: 2, status: 'coming-soon', lessons: [] },
  { subject: 'Science',         slug: 'science',         title: 'Science',         blurb: 'Physics, Biology & Chemistry.', emoji: '🔬', accent: '#16A34A', order: 3, status: 'coming-soon', lessons: [] },
  { subject: 'English',         slug: 'english',         title: 'English',         blurb: 'Grammar & usage to exam accuracy.', emoji: '✍️', accent: '#7C3AED', order: 4, status: 'coming-soon', lessons: [] },
  { subject: 'Polity',          slug: 'polity',          title: 'Polity & Governance', blurb: 'Constitution, rights & institutions.', emoji: '⚖️', accent: '#0891B2', order: 5, status: 'coming-soon', lessons: [] },
  { subject: 'Geography',       slug: 'geography',       title: 'Geography',       blurb: 'Physical, Indian & world geography.', emoji: '🌏', accent: '#059669', order: 6, status: 'coming-soon', lessons: [] },
]

export const COURSES: Course[] = [MATHS, ...COMING_SOON].sort((a, b) => a.order - b.order)

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
