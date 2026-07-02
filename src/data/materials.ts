// src/data/materials.ts
// 30-day study catalog. One entry per HTML file.
// To unlock Days 11–30: set isStaticLocked: false and drop HTML in public/content/day-N/

export interface Material {
  id: string
  day: number
  title: string
  description?: string
  htmlPath: string
  videoUrl?: string
  pdfPath?: string
  isStaticLocked?: boolean
  totalNodes?: number   // total study nodes in the HTML file; used for mode-unlock threshold
}

export const materials: Material[] = [
  // ── Day 1 ──────────────────────────────────────────────────────────────────
  { id: 'day-1-anc1', day: 1, title: 'Ancient History — Part 1', htmlPath: '/study/anc-history-1.html', totalNodes: 22 },
  { id: 'day-1-anc2', day: 1, title: 'Ancient History — Part 2', htmlPath: '/study/anc-history-2.html', totalNodes: 20 },
  { id: 'day-1-geo1', day: 1, title: 'Geography — Part 1',       htmlPath: '/study/geo-part1.html',     totalNodes: 8  },

  // ── Day 2 ──────────────────────────────────────────────────────────────────
  { id: 'day-2-anc3', day: 2, title: 'Ancient History — Part 3', htmlPath: '/study/anc-history-3.html', totalNodes: 22 },
  { id: 'day-2-anc4', day: 2, title: 'Ancient History — Part 4', htmlPath: '/study/anc-history-4.html', totalNodes: 20 },
  { id: 'day-2-geo2', day: 2, title: 'Geography — Part 2',       htmlPath: '/study/geo-part2.html',     totalNodes: 8  },

  // ── Day 3 ──────────────────────────────────────────────────────────────────
  { id: 'day-3-geo1', day: 3, title: 'Geography — Part 1 (Revision)', htmlPath: '/study/geo-part1.html', totalNodes: 8 },
  { id: 'day-3-med1', day: 3, title: 'Medieval History — Part 1',     htmlPath: '/study/med-part1.html', totalNodes: 13 },

  // ── Day 4 ──────────────────────────────────────────────────────────────────
  { id: 'day-4-anc1', day: 4, title: 'Ancient History — Part 1 (Revision)', htmlPath: '/study/anc-rev1.html', totalNodes: 16 },
  { id: 'day-4-anc2', day: 4, title: 'Ancient History — Part 2 (Revision)', htmlPath: '/study/anc-rev2.html', totalNodes: 15 },
  { id: 'day-4-med2', day: 4, title: 'Medieval History — Part 2',            htmlPath: '/study/med-part2.html', totalNodes: 13 },

  // ── Day 5 ──────────────────────────────────────────────────────────────────
  { id: 'day-5-mod1', day: 5, title: 'Modern History — Part 1', htmlPath: '/study/mod-hist1.html', totalNodes: 14 },
  { id: 'day-5-mod2', day: 5, title: 'Modern History — Part 2', htmlPath: '/study/mod-hist2.html', totalNodes: 14 },

  // ── Day 6 ──────────────────────────────────────────────────────────────────
  { id: 'day-6-wh1', day: 6, title: 'World History', htmlPath: '/study/world-hist1.html', totalNodes: 21 },

  // ── Day 7 ──────────────────────────────────────────────────────────────────
  { id: 'day-7-geo3',  day: 7, title: 'Geography — Part 3',        htmlPath: '/study/geo-part3.html',  totalNodes: 13 },
  { id: 'day-7-mod3',  day: 7, title: 'Modern History — Part 3',   htmlPath: '/study/mod-hist3.html',  totalNodes: 14 },
  { id: 'day-7-mod4',  day: 7, title: 'Modern History — Part 4',   htmlPath: '/study/mod-hist4.html',  totalNodes: 14 },

  // ── Day 8 ──────────────────────────────────────────────────────────────────
  { id: 'day-8-anc3', day: 8, title: 'Ancient History — Part 3 (Revision)', htmlPath: '/study/anc-history-3.html', totalNodes: 22 },
  { id: 'day-8-anc4', day: 8, title: 'Ancient History — Part 4 (Revision)', htmlPath: '/study/anc-history-4.html', totalNodes: 20 },
  { id: 'day-8-eco1', day: 8, title: 'Economics — Part 1',                  htmlPath: '/study/economics-part1.html', totalNodes: 11 },

  // ── Day 9 ──────────────────────────────────────────────────────────────────
  { id: 'day-9-eco1', day: 9, title: 'Economics — Part 1 (Revision)', htmlPath: '/study/economics-part1.html', totalNodes: 11 },

  // ── Day 10 ────────────────────────────────────────────────────────────────
  { id: 'day-10-pol1', day: 10, title: 'Polity — Part 1', htmlPath: '/study/polity-part1.html', totalNodes: 27 },

  // ── Days 11–30: Coming Soon ───────────────────────────────────────────────
  { id: 'day-11-pol1', day: 11, title: 'Polity — Remaining', htmlPath: '/study/polity-part1.html', totalNodes: 27 },
  { id: 'day-12-placeholder', day: 12, title: 'Day 12 — Coming Soon', htmlPath: '/content/day-12/index.html', isStaticLocked: true },
  { id: 'day-13-placeholder', day: 13, title: 'Day 13 — Coming Soon', htmlPath: '/content/day-13/index.html', isStaticLocked: true },
  { id: 'day-14-placeholder', day: 14, title: 'Day 14 — Coming Soon', htmlPath: '/content/day-14/index.html', isStaticLocked: true },
  { id: 'day-15-placeholder', day: 15, title: 'Day 15 — Coming Soon', htmlPath: '/content/day-15/index.html', isStaticLocked: true },
  { id: 'day-16-placeholder', day: 16, title: 'Day 16 — Coming Soon', htmlPath: '/content/day-16/index.html', isStaticLocked: true },
  { id: 'day-17-placeholder', day: 17, title: 'Day 17 — Coming Soon', htmlPath: '/content/day-17/index.html', isStaticLocked: true },
  { id: 'day-18-placeholder', day: 18, title: 'Day 18 — Coming Soon', htmlPath: '/content/day-18/index.html', isStaticLocked: true },
  { id: 'day-19-placeholder', day: 19, title: 'Day 19 — Coming Soon', htmlPath: '/content/day-19/index.html', isStaticLocked: true },
  { id: 'day-20-placeholder', day: 20, title: 'Day 20 — Coming Soon', htmlPath: '/content/day-20/index.html', isStaticLocked: true },
  { id: 'day-21-placeholder', day: 21, title: 'Day 21 — Coming Soon', htmlPath: '/content/day-21/index.html', isStaticLocked: true },
  { id: 'day-22-placeholder', day: 22, title: 'Day 22 — Coming Soon', htmlPath: '/content/day-22/index.html', isStaticLocked: true },
  { id: 'day-23-placeholder', day: 23, title: 'Day 23 — Coming Soon', htmlPath: '/content/day-23/index.html', isStaticLocked: true },
  { id: 'day-24-placeholder', day: 24, title: 'Day 24 — Coming Soon', htmlPath: '/content/day-24/index.html', isStaticLocked: true },
  { id: 'day-25-placeholder', day: 25, title: 'Day 25 — Coming Soon', htmlPath: '/content/day-25/index.html', isStaticLocked: true },
  { id: 'day-26-placeholder', day: 26, title: 'Day 26 — Coming Soon', htmlPath: '/content/day-26/index.html', isStaticLocked: true },
  { id: 'day-27-placeholder', day: 27, title: 'Day 27 — Coming Soon', htmlPath: '/content/day-27/index.html', isStaticLocked: true },
  { id: 'day-28-placeholder', day: 28, title: 'Day 28 — Coming Soon', htmlPath: '/content/day-28/index.html', isStaticLocked: true },
  { id: 'day-29-placeholder', day: 29, title: 'Day 29 — Coming Soon', htmlPath: '/content/day-29/index.html', isStaticLocked: true },
  { id: 'day-30-placeholder', day: 30, title: 'Day 30 — Coming Soon', htmlPath: '/content/day-30/index.html', isStaticLocked: true },
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
