// src/data/materials.ts
// Live study catalog. One entry per HTML file.
// Standard: Day 1 is the free preview day — open to every registered student.
// The old pre-Centum-Path catalog lives in materials.archive.ts; entries return
// here one by one as each file is upgraded to the two-layer tracking template.

export interface Material {
  id: string
  day: number
  title: string
  subject?: string      // eyebrow label on the material card, e.g. 'Ancient History'
  description?: string
  features?: string[]   // feature chips on the material card
  htmlPath: string
  videoUrl?: string
  pdfPath?: string
  isStaticLocked?: boolean
  totalNodes?: number   // total study nodes in the HTML file; used for mode-unlock threshold
}

export const materials: Material[] = [
  // ── Day 1 ──────────────────────────────────────────────────────────────────
  // ids must stay 'harappa-ivc' / 'prehistory-stone-age' — the HTML files use them
  // as their built-in fallback material_id for /api/study/interaction tracking.
  {
    id: 'harappa-ivc', day: 1,
    subject: 'Ancient History',
    title: 'Indus Valley Civilisation & Epigraphy',
    description: 'Two complete topics — the Harappan world and India’s inscriptions — built as a sequential mastery path. Every first attempt is scored once, forever.',
    features: ['🧠 Neural Mind Map', '📅 Interactive Timeline', '🎯 14-node Centum Path', '✍️ 210 exam-grade MCQs'],
    htmlPath: '/study/harappa-ivc.html', totalNodes: 14,
  },
  {
    id: 'prehistory-stone-age', day: 1,
    subject: 'Ancient History',
    title: 'Prehistory — Stone Age & Chalcolithic',
    description: 'From the first pebble tools to the copper age — two topics on a sequential mastery path with flashcards, error-spotting and timed first-attempt rounds.',
    features: ['🧠 Neural Mind Map', '📅 Interactive Timeline', '🎯 14-node Centum Path', '✍️ 210 exam-grade MCQs'],
    htmlPath: '/study/prehistory-stone-age.html', totalNodes: 14,
  },
  // id must stay 'daily-test-engine' — the HTML file uses it as its built-in
  // fallback material_id for /api/study/interaction tracking.
  {
    id: 'daily-test-engine', day: 1,
    subject: 'Daily Test',
    title: 'Daily Test Engine — GS Weighted',
    description: 'Full exam-style daily test on the previous day\'s syllabus: 25 questions, 30-minute timer, +1/−0.25 marking, question palette and complete answer review. Submit 6:00–8:30 AM for Centum Index attendance.',
    features: ['⏱ 30-min real exam timer', '🎯 25 Q · +1 / −0.25', '🗂 Question palette & review marks', '📊 Counts toward Centum Index'],
    htmlPath: '/study/daily-test-engine.html', totalNodes: 30,
  },
]

export function getMaterialById(id: string): Material | undefined {
  return materials.find(m => m.id === id)
}

export function getMaterialsByDay(day: number): Material[] {
  return materials.filter(m => m.day === day)
}

export function getUniqueDays(): number[] {
  return [...new Set(materials.map(m => m.day))].sort((a, b) => a - b)
}
