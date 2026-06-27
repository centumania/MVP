/**
 * scripts/extract-html-questions.mjs
 *
 * Parses MCQs from /public/study/*.html files and inserts them into the
 * html_question_bank Supabase table (migration 029).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/extract-html-questions.mjs
 *
 * Safe to re-run: uses UPSERT on (source_file, question_text) to avoid duplicates.
 * Prints a summary of inserted/updated rows per file.
 *
 * MCQ format found in HTML files:
 *   { q: "Question text", o: ["A","B","C","D"], a: <0-3>, e: "Explanation" }
 * Node format:
 *   { id: "...", type: "trap"|"recognition"|..., title: "...", mcqs: [...], traps: [...] }
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STUDY_DIR = join(__dirname, '../public/study')

const SUPABASE_URL            = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Topic inference from filename ─────────────────────────────────────────────

const FILENAME_TOPIC_MAP = {
  'anc-history': 'History',
  'anc-rev':     'History',
  'geo-':        'Geography',
  'bio-':        'Science & Technology',
  'biology-':    'Science & Technology',
  'chem-':       'Science & Technology',
  'physics':     'Science & Technology',
  'num-system':  'Arithmetic',
  'med-':        'Science & Technology',
  'polity':      'Polity & Constitution',
  'economy':     'Economy',
  'env-':        'Environment & Ecology',
  'current-':    'Current Affairs',
  'reasoning':   'Reasoning & Aptitude',
}

function inferTopic(filename) {
  const lower = filename.toLowerCase()
  for (const [prefix, topic] of Object.entries(FILENAME_TOPIC_MAP)) {
    if (lower.includes(prefix)) return topic
  }
  return 'General Studies'
}

// ── MCQ extraction via regex ──────────────────────────────────────────────────

/**
 * Extract mcqs arrays from raw HTML/JS source.
 * Handles the format: mcqs:[{q:"...",o:[...],a:N,e:"..."}]
 */
function extractMcqs(source, sourceFile) {
  const results = []

  // Match individual mcq objects: {q:"...",o:[...],a:N,e:"..."}
  // Using a simple approach: find all {q: patterns and parse forward
  const mcqPattern = /\{q:\s*"((?:[^"\\]|\\.)*)"\s*,\s*o:\s*\[((?:[^\]]*?))\]\s*,\s*a:\s*(\d)\s*(?:,\s*e:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g

  let match
  while ((match = mcqPattern.exec(source)) !== null) {
    const questionText = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim()
    const optionsRaw   = match[2]
    const correctIndex = parseInt(match[3], 10)
    const explanation  = match[4]?.replace(/\\n/g, ' ').replace(/\\"/g, '"').trim() ?? null

    // Parse options array: ["A","B","C","D"]
    const optMatches = [...optionsRaw.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    if (optMatches.length !== 4) continue

    const [optA, optB, optC, optD] = optMatches.map(m => m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim())

    if (!questionText || !optA || !optB || !optC || !optD) continue
    if (correctIndex < 0 || correctIndex > 3) continue

    results.push({
      source_file:    sourceFile,
      question_text:  questionText,
      option_a:       optA,
      option_b:       optB,
      option_c:       optC,
      option_d:       optD,
      correct_option: correctIndex,
      explanation,
      topic:          inferTopic(sourceFile),
      is_trap:        false,
    })
  }

  return results
}

/**
 * Determine if a question's node context marks it as a trap node.
 * We do a rough pass: if the question appears after a node with type:"trap",
 * tag it is_trap=true.
 */
function markTraps(source, questions) {
  // Find trap node blocks. If a mcq follows a type:"trap" declaration, mark it.
  // Simple heuristic: look for 'type:"trap"' before each mcq position.
  const trapNodeRanges = []
  const trapPattern = /\btype\s*:\s*"trap"/g
  const nodeEndPattern = /\}\s*[,;]?\s*\{?\s*(?:id|title|type)\s*:/g

  let tMatch
  while ((tMatch = trapPattern.exec(source)) !== null) {
    trapNodeRanges.push({ start: tMatch.index, end: Infinity })
  }

  // Close ranges at next node boundary (approximate)
  for (let i = 0; i < trapNodeRanges.length - 1; i++) {
    trapNodeRanges[i].end = trapNodeRanges[i + 1].start
  }

  const mcqPattern = /\{q:\s*"/g
  let mMatch
  const mcqPositions = []
  while ((mMatch = mcqPattern.exec(source)) !== null) {
    mcqPositions.push(mMatch.index)
  }

  return questions.map((q, idx) => {
    const pos = mcqPositions[idx] ?? -1
    const inTrap = trapNodeRanges.some(r => pos >= r.start && pos < r.end)
    return { ...q, is_trap: inTrap }
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const files = readdirSync(STUDY_DIR).filter(f => f.endsWith('.html'))
  console.log(`Found ${files.length} HTML files in ${STUDY_DIR}\n`)

  let totalInserted = 0
  let totalErrors   = 0

  for (const file of files) {
    const source = readFileSync(join(STUDY_DIR, file), 'utf-8')
    let mcqs     = extractMcqs(source, file)
    mcqs         = markTraps(source, mcqs)

    if (mcqs.length === 0) {
      console.log(`  ${file}: no MCQs found — skipping`)
      continue
    }

    // Upsert in batches of 50
    let inserted = 0
    for (let i = 0; i < mcqs.length; i += 50) {
      const batch = mcqs.slice(i, i + 50)
      const { error } = await supabase
        .from('html_question_bank')
        .upsert(batch, { onConflict: 'source_file,question_text', ignoreDuplicates: false })

      if (error) {
        console.error(`  ${file} batch ${i}-${i+50}: ERROR — ${error.message}`)
        totalErrors++
      } else {
        inserted += batch.length
      }
    }

    console.log(`  ${file}: ${mcqs.length} MCQs (${mcqs.filter(m => m.is_trap).length} traps) → ${inserted} upserted`)
    totalInserted += inserted
  }

  console.log(`\nDone. Total upserted: ${totalInserted}. Errors: ${totalErrors}.`)
}

main().catch(err => { console.error(err); process.exit(1) })
