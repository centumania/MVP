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

function toMaterial(m: Module): Material {
  return {
    id: m.id,
    day: earliestDay(m.id),
    title: m.title,
    subject: m.subject,
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
