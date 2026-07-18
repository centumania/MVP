// src/data/materials.ts
// Compatibility + program-aware bridge over the shared module pool (programs.ts).
// The viewer / open-gateway resolve any module id → htmlPath via getMaterialById;
// the materials page renders a student's chosen program plan via the day helpers.

import {
  MODULES, PLANS, getProgram, getDayModules, getProgramDays, moduleHtmlPath,
  type Module, type ProgramId,
} from '@/src/data/programs'

export interface Material {
  id: string
  day: number           // earliest day the module appears in any plan (drives free-preview gate)
  title: string
  subject?: string
  description?: string
  features?: string[]
  htmlPath: string
  videoUrl?: string
  pdfPath?: string
  isStaticLocked?: boolean
  totalNodes?: number
}

// Earliest day a module appears across ALL programs → its free-preview day.
const earliestDay = (id: string): number => {
  let min = Infinity
  for (const plan of Object.values(PLANS)) {
    for (const d of plan) if (d.modules.includes(id) && d.day < min) min = d.day
  }
  return Number.isFinite(min) ? min : 99
}

// ── Presentational copy ─────────────────────────────────────────────────────
// The 3 Day-1 originals keep their EXACT live copy — no regression for students
// already studying. Every other module gets an honest, consistent default so no
// card ever renders bare beside them.
const CURATED: Record<string, { description: string; features: string[] }> = {
  'harappa-ivc': {
    description: 'Two complete topics — the Harappan world and India’s inscriptions — built as a sequential mastery path. Every first attempt is scored once, forever.',
    features: ['🧠 Neural Mind Map', '📅 Interactive Timeline', '🎯 14-node Centum Path', '✍️ 210 exam-grade MCQs'],
  },
  'prehistory-stone-age': {
    description: 'From the first pebble tools to the copper age — two topics on a sequential mastery path with flashcards, error-spotting and timed first-attempt rounds.',
    features: ['🧠 Neural Mind Map', '📅 Interactive Timeline', '🎯 14-node Centum Path', '✍️ 210 exam-grade MCQs'],
  },
  'daily-test-engine': {
    description: 'Full exam-style daily test on the previous day\'s syllabus: 25 questions, 30-minute timer, +1/−0.25 marking, question palette and complete answer review. Submit 6:00–8:30 AM for Centum Index attendance.',
    features: ['⏱ 30-min real exam timer', '🎯 25 Q · +1 / −0.25', '🗂 Question palette & review marks', '📊 Counts toward Centum Index'],
  },
}

const SUBJECT_BLURB: Record<string, string> = {
  'Ancient History':  'Core Ancient-India history',
  'Medieval History': 'Medieval-India rulers, revenue & culture',
  'Modern History':   'The freedom struggle & modern-India milestones',
  'World History':    'World-history turning points that shape GS',
  'Physics':          'Exam-weighted Physics with worked reasoning',
  'Biology':          'NCERT-grade Biology essentials',
  'English':          'Grammar & usage drilled to exam accuracy',
  'Daily Test':       'Full exam-style assessment',
}

function defaultFeatures(m: Module): string[] {
  return [
    m.totalNodes ? `🎯 ${m.totalNodes}-node Centum Path` : '🎯 Centum Path',
    '✍️ Exam-grade MCQs',
    '📊 First attempt feeds Centum Index',
  ]
}

function defaultDescription(m: Module): string {
  const blurb = SUBJECT_BLURB[m.subject] ?? m.subject
  return `${blurb} — a sequential mastery path where every first attempt is scored once and feeds your Centum Index.`
}

function toMaterial(m: Module): Material {
  const c = CURATED[m.id]
  return {
    id: m.id,
    day: earliestDay(m.id),
    title: m.title,
    subject: m.subject,
    description: c?.description ?? defaultDescription(m),
    features:    c?.features    ?? defaultFeatures(m),
    htmlPath: moduleHtmlPath(m.id),
    totalNodes: m.totalNodes,
  }
}

// Full pool as Materials — used by getMaterialById (viewer + /api/materials/open gate).
export const materials: Material[] = MODULES.map(toMaterial)

export function getMaterialById(id: string): Material | undefined {
  return materials.find(m => m.id === id)
}

// ── Program-aware (default program = LDC for any legacy caller) ──────────────
export function getMaterialsByDay(day: number, programId?: string | null): Material[] {
  return getDayModules(programId, day).map(toMaterial)
}

export function getUniqueDays(programId?: string | null): number[] {
  return getProgramDays(programId)
}

export function getProgramMeta(programId?: string | null) {
  return getProgram(programId)
}

export type { ProgramId }
