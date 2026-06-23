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
  { id: 'day-3-bio',  day: 3, title: 'Biology — Part 3',       htmlPath: '/content/day-3/biology.html' },
  { id: 'day-3-chem', day: 3, title: 'Chemistry — Part C',     htmlPath: '/content/day-3/chemistry.html' },
  { id: 'day-3-math', day: 3, title: 'Maths — Simplification', htmlPath: '/content/day-3/math.html' },
  { id: 'day-3-eng',  day: 3, title: 'English — Grammar 2',    htmlPath: '/content/day-3/english.html' },
  { id: 'day-3-ca',   day: 3, title: 'Current Affairs',        htmlPath: '/content/day-3/current-affairs.html' },

  // ── Day 4 ──────────────────────────────────────────────────────────────────
  { id: 'day-4-bio',  day: 4, title: 'Biology — Part 4',       htmlPath: '/content/day-4/biology.html' },
  { id: 'day-4-chem', day: 4, title: 'Chemistry — Part D',     htmlPath: '/content/day-4/chemistry.html' },
  { id: 'day-4-math', day: 4, title: 'Maths — Percentages',    htmlPath: '/content/day-4/math.html' },
  { id: 'day-4-eng',  day: 4, title: 'English — Reading',      htmlPath: '/content/day-4/english.html' },
  { id: 'day-4-ca',   day: 4, title: 'Current Affairs',        htmlPath: '/content/day-4/current-affairs.html' },

  // ── Day 5 ──────────────────────────────────────────────────────────────────
  { id: 'day-5-bio',  day: 5, title: 'Biology — Part 5',       htmlPath: '/content/day-5/biology.html' },
  { id: 'day-5-chem', day: 5, title: 'Chemistry — Part E',     htmlPath: '/content/day-5/chemistry.html' },
  { id: 'day-5-math', day: 5, title: 'Maths — Ratio',          htmlPath: '/content/day-5/math.html' },
  { id: 'day-5-eng',  day: 5, title: 'English — Synonyms',     htmlPath: '/content/day-5/english.html' },
  { id: 'day-5-ca',   day: 5, title: 'Current Affairs',        htmlPath: '/content/day-5/current-affairs.html' },

  // ── Day 6 ──────────────────────────────────────────────────────────────────
  { id: 'day-6-bio',  day: 6, title: 'Biology — Part 6',       htmlPath: '/content/day-6/biology.html' },
  { id: 'day-6-chem', day: 6, title: 'Chemistry — Part F',     htmlPath: '/content/day-6/chemistry.html' },
  { id: 'day-6-math', day: 6, title: 'Maths — Profit & Loss',  htmlPath: '/content/day-6/math.html' },
  { id: 'day-6-eng',  day: 6, title: 'English — Antonyms',     htmlPath: '/content/day-6/english.html' },
  { id: 'day-6-ca',   day: 6, title: 'Current Affairs',        htmlPath: '/content/day-6/current-affairs.html' },

  // ── Day 7 ──────────────────────────────────────────────────────────────────
  { id: 'day-7-bio',  day: 7, title: 'Biology — Part 7',       htmlPath: '/content/day-7/biology.html' },
  { id: 'day-7-chem', day: 7, title: 'Chemistry — Part G',     htmlPath: '/content/day-7/chemistry.html' },
  { id: 'day-7-math', day: 7, title: 'Maths — Averages',       htmlPath: '/content/day-7/math.html' },
  { id: 'day-7-eng',  day: 7, title: 'English — Fill Blanks',  htmlPath: '/content/day-7/english.html' },
  { id: 'day-7-ca',   day: 7, title: 'Current Affairs',        htmlPath: '/content/day-7/current-affairs.html' },

  // ── Day 8 ──────────────────────────────────────────────────────────────────
  { id: 'day-8-bio',  day: 8, title: 'Biology — Part 8',       htmlPath: '/content/day-8/biology.html' },
  { id: 'day-8-chem', day: 8, title: 'Chemistry — Part H',     htmlPath: '/content/day-8/chemistry.html' },
  { id: 'day-8-math', day: 8, title: 'Maths — Time & Work',    htmlPath: '/content/day-8/math.html' },
  { id: 'day-8-eng',  day: 8, title: 'English — One Word Sub', htmlPath: '/content/day-8/english.html' },
  { id: 'day-8-ca',   day: 8, title: 'Current Affairs',        htmlPath: '/content/day-8/current-affairs.html' },

  // ── Day 9 ──────────────────────────────────────────────────────────────────
  { id: 'day-9-bio',  day: 9, title: 'Biology — Part 9',         htmlPath: '/content/day-9/biology.html' },
  { id: 'day-9-chem', day: 9, title: 'Chemistry — Part I',       htmlPath: '/content/day-9/chemistry.html' },
  { id: 'day-9-math', day: 9, title: 'Maths — Speed & Time',     htmlPath: '/content/day-9/math.html' },
  { id: 'day-9-eng',  day: 9, title: 'English — Comprehension',  htmlPath: '/content/day-9/english.html' },
  { id: 'day-9-ca',   day: 9, title: 'Current Affairs',          htmlPath: '/content/day-9/current-affairs.html' },

  // ── Day 10 ────────────────────────────────────────────────────────────────
  { id: 'day-10-bio',  day: 10, title: 'Biology — Part 10',    htmlPath: '/content/day-10/biology.html' },
  { id: 'day-10-chem', day: 10, title: 'Chemistry — Part J',   htmlPath: '/content/day-10/chemistry.html' },
  { id: 'day-10-math', day: 10, title: 'Maths — Revision',     htmlPath: '/content/day-10/math.html' },
  { id: 'day-10-eng',  day: 10, title: 'English — Revision',   htmlPath: '/content/day-10/english.html' },
  { id: 'day-10-ca',   day: 10, title: 'Current Affairs',      htmlPath: '/content/day-10/current-affairs.html' },

  // ── Days 11–30: Coming Soon ───────────────────────────────────────────────
  { id: 'day-11-placeholder', day: 11, title: 'Day 11 — Coming Soon', htmlPath: '/content/day-11/index.html', isStaticLocked: true },
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
