// src/data/programs.ts
// PROGRAM-AWARE study system: one shared module pool, per-exam weighted day-plans.
// A student's chosen program (onboarding/registration) picks their plan; the same
// modules are reused across exams at different days/weight. Days with no module yet
// render "coming soon" (empty `modules`) until the file is exported + tracking-wired.

export type ProgramId = 'LDC' | 'SSC' | 'Banking'
export type Subject =
  | 'Ancient History' | 'Medieval History' | 'Modern History' | 'World History'
  | 'Physics' | 'Biology' | 'English' | 'Daily Test'

export interface Module {
  id: string            // slug; file served from /study/<id>.html; also the tracking material_id
  title: string
  subject: Subject
  totalNodes?: number
  tracked?: boolean     // has the /api/study/interaction tracking prefix injected yet?
}

// ── Shared module pool (today's canonical set) ──────────────────────────────
export const MODULES: Module[] = [
  // Already tracking-wired (Day-1 originals)
  { id: 'harappa-ivc',            title: 'Indus Valley Civilisation & Epigraphy', subject: 'Ancient History', totalNodes: 14, tracked: true },
  { id: 'prehistory-stone-age',   title: 'Prehistory — Stone Age & Chalcolithic', subject: 'Ancient History', totalNodes: 14, tracked: true },
  { id: 'daily-test-engine',      title: 'Daily Test Engine — GS Weighted',       subject: 'Daily Test',      totalNodes: 30, tracked: true },
  // History (staged, tracking pending)
  { id: 'ancient-1',  title: 'Ancient History — Part 1', subject: 'Ancient History' },
  { id: 'ancient-2',  title: 'Ancient History — Part 2', subject: 'Ancient History' },
  { id: 'ancient-3',  title: 'Ancient History — Part 3', subject: 'Ancient History' },
  { id: 'ancient-4',  title: 'Ancient History — Part 4', subject: 'Ancient History' },
  { id: 'medieval-1', title: 'Medieval History — Part 1', subject: 'Medieval History' },
  { id: 'medieval-2', title: 'Medieval History — Part 2', subject: 'Medieval History' },
  { id: 'modern-1',   title: 'Modern History — Part 1', subject: 'Modern History' },
  { id: 'modern-2',   title: 'Modern History — Part 2', subject: 'Modern History' },
  { id: 'modern-3',   title: 'Modern History — Part 3', subject: 'Modern History' },
  { id: 'modern-4',   title: 'Modern History — Part 4', subject: 'Modern History' },
  { id: 'world-1',    title: 'World History — Part 1', subject: 'World History' },
  // Physics
  { id: 'physics-units-measurement',    title: 'Units & Measurement', subject: 'Physics' },
  { id: 'physics-laws-of-motion',       title: 'Laws of Motion', subject: 'Physics' },
  { id: 'physics-work-energy-power',    title: 'Work, Energy & Power', subject: 'Physics' },
  { id: 'physics-pressure-buoyancy',    title: 'Pressure & Buoyancy', subject: 'Physics' },
  { id: 'physics-heat-thermodynamics',  title: 'Heat & Thermodynamics', subject: 'Physics' },
  { id: 'physics-sound-waves',          title: 'Sound & Waves', subject: 'Physics' },
  { id: 'physics-light',                title: 'Light', subject: 'Physics' },
  { id: 'physics-electricity',          title: 'Electricity', subject: 'Physics' },
  { id: 'physics-magnetism-em-effects', title: 'Magnetism & EM Effects', subject: 'Physics' },
  { id: 'physics-modern-physics-energy',title: 'Modern Physics & Energy', subject: 'Physics' },
  // Biology
  { id: 'biology-life-processes',        title: 'Life Processes', subject: 'Biology' },
  { id: 'biology-human-body-systems',    title: 'Human Body Systems', subject: 'Biology' },
  { id: 'biology-how-organisms-reproduce',title: 'How Organisms Reproduce', subject: 'Biology' },
  { id: 'biology-heredity-evolution',    title: 'Heredity & Evolution', subject: 'Biology' },
  { id: 'biology-control-coordination',  title: 'Control & Coordination', subject: 'Biology' },
  // English (SSC set)
  { id: 'eng-01-articles',  title: 'Articles', subject: 'English' },
  { id: 'eng-02-sva',       title: 'Subject–Verb Agreement', subject: 'English' },
  { id: 'eng-03-tenses',    title: 'Tenses', subject: 'English' },
  { id: 'eng-04-voice',     title: 'Voice', subject: 'English' },
  { id: 'eng-05-narration', title: 'Narration', subject: 'English' },
  { id: 'eng-06-modals',    title: 'Modals', subject: 'English' },
  { id: 'eng-07-prepositions', title: 'Prepositions', subject: 'English' },
  { id: 'eng-08-conjunctions', title: 'Conjunctions', subject: 'English' },
  { id: 'eng-09-synonyms-antonyms', title: 'Synonyms & Antonyms', subject: 'English' },
  { id: 'eng-10-oneword',   title: 'One-word Substitution', subject: 'English' },
  { id: 'eng-11-idioms',    title: 'Idioms & Phrases', subject: 'English' },
  { id: 'eng-12-spelling',  title: 'Spelling', subject: 'English' },
  { id: 'eng-13-reading',   title: 'Reading Comprehension', subject: 'English' },
  { id: 'eng-14-parajumbles', title: 'Para Jumbles', subject: 'English' },
  { id: 'eng-15-error-spotting', title: 'Error Spotting', subject: 'English' },
  { id: 'eng-16-sentence-improvement', title: 'Sentence Improvement', subject: 'English' },
]

const BY_ID = new Map(MODULES.map(m => [m.id, m]))
export const getModuleById = (id: string): Module | undefined => BY_ID.get(id)

// ── Programs + subject weightage (data-driven per exam pattern) ──────────────
export interface Program {
  id: ProgramId
  name: string
  full: string
  days: number
  weightage: { subject: string; pct: number }[] // exam-paper weight, drives sequencing
}
export const PROGRAMS: Program[] = [
  { id: 'LDC', name: 'Puducherry / TN LDC-UDC', full: 'Lower/Upper Division Clerk', days: 30,
    weightage: [ { subject: 'General Studies', pct: 40 }, { subject: 'Aptitude', pct: 30 }, { subject: 'English / Tamil', pct: 20 }, { subject: 'Current Affairs', pct: 10 } ] },
  { id: 'SSC', name: 'SSC (CGL / CHSL / MTS)', full: 'Staff Selection Commission', days: 30,
    weightage: [ { subject: 'General Awareness', pct: 25 }, { subject: 'Quantitative Aptitude', pct: 25 }, { subject: 'Reasoning', pct: 25 }, { subject: 'English', pct: 25 } ] },
  { id: 'Banking', name: 'Banking (IBPS / SBI)', full: 'IBPS / SBI PO & Clerk', days: 24,
    weightage: [ { subject: 'Quantitative Aptitude', pct: 35 }, { subject: 'Reasoning', pct: 35 }, { subject: 'English', pct: 30 } ] },
]
export const getProgram = (id: string | null | undefined): Program =>
  PROGRAMS.find(p => p.id === id) ?? PROGRAMS[0]

// ── Day plans (Section 1 GS modules · Section 2/3 topics) ───────────────────
export interface DayPlan {
  day: number
  modules: string[]           // module ids for the day (empty = "coming soon")
  reasoningOrArithmetic?: string
  rotating?: string           // CA / English / Ethics / Computer topic label
}

// Puducherry/TN LDC — from the real 30-day planner (gaps = not-yet-exported modules).
const LDC_PLAN: DayPlan[] = [
  { day: 1,  modules: ['prehistory-stone-age', 'harappa-ivc'], reasoningOrArithmetic: 'REASONING: Analogy & Classification', rotating: 'CURRENT AFFAIRS: National affairs & Govt schemes' },
  { day: 2,  modules: ['ancient-1', 'ancient-2', 'eng-01-articles'], reasoningOrArithmetic: 'ARITHMETIC: Number System, HCF & LCM', rotating: 'ENGLISH: Parts of Speech & Articles' },
  { day: 3,  modules: ['ancient-3', 'ancient-4'], reasoningOrArithmetic: 'REASONING: Number & Letter Series', rotating: 'COMPUTER: Fundamentals & generations' },
  { day: 4,  modules: [], reasoningOrArithmetic: 'ARITHMETIC: Simplification, Surds & Indices', rotating: 'ETHICS: Values & morality basics' },
  { day: 5,  modules: ['medieval-1', 'medieval-2'], reasoningOrArithmetic: 'REASONING: Coding–Decoding', rotating: 'CURRENT AFFAIRS: International affairs' },
  { day: 6,  modules: ['eng-03-tenses'], reasoningOrArithmetic: 'ARITHMETIC: Percentages', rotating: 'ENGLISH: Tenses' },
  { day: 7,  modules: [], reasoningOrArithmetic: 'REASONING: Blood Relations', rotating: 'COMPUTER: Input/Output devices' },
  { day: 8,  modules: ['modern-1', 'modern-2'], reasoningOrArithmetic: 'ARITHMETIC: Ratio & Proportion', rotating: 'ETHICS: Integrity & probity' },
  { day: 9,  modules: ['modern-3', 'modern-4'], reasoningOrArithmetic: 'REASONING: Direction Sense', rotating: 'CURRENT AFFAIRS: Economy & Banking' },
  { day: 10, modules: ['eng-02-sva', 'eng-07-prepositions'], reasoningOrArithmetic: 'ARITHMETIC: Average & Ages', rotating: 'ENGLISH: SVA & Prepositions' },
  { day: 11, modules: ['world-1'], reasoningOrArithmetic: 'REASONING: Ranking & Order', rotating: 'COMPUTER: Memory & binary basics' },
  { day: 12, modules: [], reasoningOrArithmetic: 'ARITHMETIC: Profit, Loss & Discount', rotating: 'ETHICS: Attitude & foundational values' },
  { day: 13, modules: [], reasoningOrArithmetic: 'REASONING: Syllogism', rotating: 'CURRENT AFFAIRS: Science & Environment' },
  { day: 14, modules: ['eng-04-voice', 'eng-05-narration'], reasoningOrArithmetic: 'ARITHMETIC: Simple & Compound Interest', rotating: 'ENGLISH: Voice & Narration' },
  { day: 15, modules: [], reasoningOrArithmetic: 'REASONING: Venn Diagrams', rotating: 'COMPUTER: Software & OS' },
  { day: 16, modules: [], reasoningOrArithmetic: 'ARITHMETIC: Time & Work', rotating: 'ETHICS: Emotional intelligence' },
  { day: 17, modules: [], reasoningOrArithmetic: 'REASONING: Seating (Linear)', rotating: 'CURRENT AFFAIRS: Sports & Awards' },
  { day: 18, modules: ['eng-15-error-spotting', 'eng-16-sentence-improvement'], reasoningOrArithmetic: 'ARITHMETIC: Time-Speed-Distance', rotating: 'ENGLISH: Error Spotting & Improvement' },
  { day: 19, modules: ['physics-units-measurement', 'physics-laws-of-motion', 'physics-work-energy-power'], reasoningOrArithmetic: 'REASONING: Seating (Circular) & Puzzles', rotating: 'COMPUTER: MS Office' },
  { day: 20, modules: ['physics-pressure-buoyancy', 'physics-heat-thermodynamics', 'physics-sound-waves'], reasoningOrArithmetic: 'ARITHMETIC: Mixtures & Alligation', rotating: 'ETHICS: Public administration' },
  { day: 21, modules: ['physics-light', 'physics-electricity'], reasoningOrArithmetic: 'REASONING: Clock & Calendar', rotating: 'CURRENT AFFAIRS: Puducherry & TN affairs' },
  { day: 22, modules: ['physics-magnetism-em-effects', 'physics-modern-physics-energy', 'eng-09-synonyms-antonyms', 'eng-10-oneword', 'eng-11-idioms'], reasoningOrArithmetic: 'ARITHMETIC: Mensuration 2D', rotating: 'ENGLISH: Vocabulary' },
  { day: 23, modules: [], reasoningOrArithmetic: 'REASONING: Cubes, Dice & Figures', rotating: 'COMPUTER: Internet & Networking' },
  { day: 24, modules: [], reasoningOrArithmetic: 'ARITHMETIC: Mensuration 3D', rotating: 'ETHICS: Moral reasoning' },
  { day: 25, modules: [], reasoningOrArithmetic: 'REASONING: Non-verbal', rotating: 'CURRENT AFFAIRS: Books, Days, Persons' },
  { day: 26, modules: ['eng-13-reading'], reasoningOrArithmetic: 'ARITHMETIC: Algebra, Geometry & Trig', rotating: 'ENGLISH: Reading Comprehension' },
  { day: 27, modules: ['biology-life-processes', 'biology-control-coordination', 'biology-heredity-evolution'], reasoningOrArithmetic: 'REASONING: Statement–Conclusion', rotating: 'COMPUTER: Security & shortcuts' },
  { day: 28, modules: ['biology-how-organisms-reproduce', 'biology-human-body-systems'], reasoningOrArithmetic: 'ARITHMETIC: Data Interpretation', rotating: 'ETHICS: Case studies' },
  { day: 29, modules: [], reasoningOrArithmetic: 'FULL REASONING MOCK', rotating: 'REVISION: Current Affairs + English' },
  { day: 30, modules: ['daily-test-engine'], reasoningOrArithmetic: 'FULL ARITHMETIC MOCK', rotating: 'FULL GS MOCK + Centum-Score check' },
]

// SSC — equal GA/Quant/Reasoning/English. Shares GS (history/science) + English modules;
// Quant/Reasoning modules not exported yet → topic-only days.
const SSC_PLAN: DayPlan[] = [
  { day: 1,  modules: ['prehistory-stone-age', 'harappa-ivc'], rotating: 'GA: Ancient India' },
  { day: 2,  modules: ['ancient-1', 'ancient-2'], rotating: 'ENGLISH: Articles' },
  { day: 3,  modules: ['ancient-3', 'ancient-4', 'eng-01-articles'], reasoningOrArithmetic: 'REASONING: Series' },
  { day: 4,  modules: ['medieval-1', 'medieval-2'], reasoningOrArithmetic: 'QUANT: Number System' },
  { day: 5,  modules: ['modern-1', 'modern-2', 'eng-03-tenses'], rotating: 'ENGLISH: Tenses' },
  { day: 6,  modules: ['modern-3', 'modern-4'], reasoningOrArithmetic: 'REASONING: Analogy' },
  { day: 7,  modules: ['world-1'], reasoningOrArithmetic: 'QUANT: Percentages' },
  { day: 8,  modules: ['physics-units-measurement', 'physics-laws-of-motion'], rotating: 'GA: Physics' },
  { day: 9,  modules: ['physics-work-energy-power', 'physics-light', 'eng-02-sva'], rotating: 'ENGLISH: SVA' },
  { day: 10, modules: ['physics-electricity', 'physics-heat-thermodynamics'], reasoningOrArithmetic: 'QUANT: Ratio & Average' },
  { day: 11, modules: ['biology-life-processes', 'biology-control-coordination'], rotating: 'GA: Biology' },
  { day: 12, modules: ['biology-heredity-evolution', 'eng-15-error-spotting'], rotating: 'ENGLISH: Error Spotting' },
  { day: 13, modules: ['eng-09-synonyms-antonyms', 'eng-10-oneword', 'eng-11-idioms'], rotating: 'ENGLISH: Vocabulary' },
  { day: 14, modules: ['eng-13-reading', 'eng-14-parajumbles'], rotating: 'ENGLISH: RC & Para Jumbles' },
  { day: 15, modules: ['daily-test-engine'], rotating: 'FULL MOCK: mixed GS + English' },
]

// Banking — Quant/Reasoning heavy + English; GS only for Mains. English-forward.
const BANKING_PLAN: DayPlan[] = [
  { day: 1,  modules: ['eng-01-articles', 'eng-02-sva'], rotating: 'ENGLISH: Grammar foundation' },
  { day: 2,  modules: ['eng-03-tenses', 'eng-07-prepositions'], reasoningOrArithmetic: 'QUANT: Number System' },
  { day: 3,  modules: ['eng-15-error-spotting', 'eng-16-sentence-improvement'], reasoningOrArithmetic: 'REASONING: Puzzles' },
  { day: 4,  modules: ['eng-13-reading'], reasoningOrArithmetic: 'QUANT: Simplification & DI' },
  { day: 5,  modules: ['eng-09-synonyms-antonyms', 'eng-10-oneword', 'eng-11-idioms'], reasoningOrArithmetic: 'REASONING: Seating' },
  { day: 6,  modules: ['eng-14-parajumbles'], reasoningOrArithmetic: 'QUANT: Percentages & Ratio' },
  { day: 7,  modules: ['eng-04-voice', 'eng-05-narration'], reasoningOrArithmetic: 'REASONING: Syllogism' },
  { day: 8,  modules: ['prehistory-stone-age', 'harappa-ivc'], rotating: 'MAINS GA: Ancient India' },
  { day: 9,  modules: ['physics-units-measurement', 'physics-electricity'], rotating: 'MAINS GA: Science' },
  { day: 10, modules: ['biology-life-processes', 'modern-1'], rotating: 'MAINS GA: Bio + Modern' },
  { day: 11, modules: ['eng-12-spelling', 'eng-08-conjunctions'], reasoningOrArithmetic: 'QUANT: DI sets' },
  { day: 12, modules: ['daily-test-engine'], rotating: 'FULL MOCK: Prelims pattern' },
]

export const PLANS: Record<ProgramId, DayPlan[]> = {
  LDC: LDC_PLAN, SSC: SSC_PLAN, Banking: BANKING_PLAN,
}

// ── Program-aware accessors ─────────────────────────────────────────────────
export function getPlan(programId: string | null | undefined): DayPlan[] {
  return PLANS[getProgram(programId).id]
}
export function getDayPlan(programId: string | null | undefined, day: number): DayPlan | undefined {
  return getPlan(programId).find(d => d.day === day)
}
export function getDayModules(programId: string | null | undefined, day: number): Module[] {
  return (getDayPlan(programId, day)?.modules ?? [])
    .map(id => BY_ID.get(id))
    .filter((m): m is Module => !!m)
}
export function getProgramDays(programId: string | null | undefined): number[] {
  return getPlan(programId).map(d => d.day)
}
export const moduleHtmlPath = (id: string) => `/study/${id}.html`
