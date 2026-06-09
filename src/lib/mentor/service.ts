/**
 * CentuMania AI Mentor Service
 *
 * Calls the Claude API server-side to generate a personalised coaching report
 * after a student submits a mock exam.
 *
 * Security: ANTHROPIC_API_KEY is read from process.env — never exposed to client.
 *
 * Usage:
 *   import { generateMentorReport, triggerMentorReportAfterSubmit } from '@/src/lib/mentor/service'
 */

import { getSupabaseAdminClient } from '@/src/lib/supabase/server'

// ─── System prompt ───────────────────────────────────────────────────────────

const MENTOR_SYSTEM_PROMPT = `You are CentuMania Mentor, an expert coaching assistant for Puducherry LDC and UDC government examinations.

Analyse the student performance data and generate a concise personalised coaching report. Never hallucinate data not present in the input. Be encouraging but realistic. Mention specific topic names when provided. Keep total output under 280 words. Use plain text only — no markdown, no asterisks, no bullet symbols, no hyphens as bullets.

Respond in exactly four sections separated by the delimiter "---":

Section 1 — STRENGTHS: 2-3 sentences about what the student does well.

Section 2 — WEAKNESSES AND GAPS: 2-3 sentences naming the specific weak topics.

Section 3 — THREE RECOMMENDATIONS: Numbered 1. 2. 3. Each is one sentence.

Section 4 — PREDICTED RANGE: One line only, exactly in this format:
Predicted range: X–Y marks out of 100`

// ─── Types ───────────────────────────────────────────────────────────────────

export type TopicStat = {
  name:     string
  accuracy: number  // 0–100
}

export type MentorReportInput = {
  studentName:        string
  overallScore:       number   // percentage 0–100
  previousScores:     number[] // oldest first
  accuracy:           number   // correct / attempted × 100
  attemptRate:        number   // attempted / total × 100
  avgTimePerQuestion: number   // seconds
  topics:             TopicStat[]
}

export type MentorReportOutput = {
  reportText:           string
  strengthsText:        string
  weaknessesText:       string
  recommendationsText:  string
  readinessScore:       number
  predictedLow:         number
  predictedHigh:        number
  learningProfile:      string
}

// ─── Learning profile classifier ─────────────────────────────────────────────

function classifyProfile(allScores: number[]): string {
  if (allScores.length < 2) return 'The Scholar'
  const diffs = allScores.slice(1).map((v, i) => v - allScores[i])
  const avg   = diffs.reduce((a, b) => a + b, 0) / diffs.length
  const latest = allScores[allScores.length - 1]

  if (avg >= 8)     return 'The Late Bloomer'
  if (avg >= 4)     return 'The Consistent Performer'
  if (latest >= 75) return 'The Scholar'
  if (latest >= 65) return 'The Revision Master'
  return 'The Sprinter'
}

// ─── Readiness score (0–100) ─────────────────────────────────────────────────

function computeReadiness(score: number, accuracy: number, attemptRate: number): number {
  return Math.min(100, Math.round(score * 0.5 + accuracy * 0.3 + attemptRate * 0.2))
}

// ─── Parse Claude's four-section response ────────────────────────────────────

function parseReport(text: string) {
  const sections       = text.split('---').map(s => s.trim())
  const strengths      = sections[0] ?? ''
  const weaknesses     = sections[1] ?? ''
  const recommendations = sections[2] ?? ''
  const prediction     = sections[3] ?? ''

  // Extract "68–78" or "68-78" from the prediction line
  const match        = prediction.match(/(\d+)[–\-–](\d+)/)
  const predictedLow  = match ? parseInt(match[1], 10) : 0
  const predictedHigh = match ? parseInt(match[2], 10) : 0

  return { strengths, weaknesses, recommendations, prediction, predictedLow, predictedHigh }
}

// ─── Core — call Claude and return structured report ─────────────────────────

export async function generateMentorReport(input: MentorReportInput): Promise<MentorReportOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const userMessage = `Student analytics:\n${JSON.stringify(input, null, 2)}\n\nGenerate the mentor report now.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:     MENTOR_SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Claude API error ${response.status}: ${errText}`)
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>
  }

  const rawText = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')

  const parsed          = parseReport(rawText)
  const allScores       = [...(input.previousScores ?? []), input.overallScore]
  const readinessScore  = computeReadiness(input.overallScore, input.accuracy, input.attemptRate)
  const learningProfile = classifyProfile(allScores)

  return {
    reportText:          rawText,
    strengthsText:       parsed.strengths,
    weaknessesText:      parsed.weaknesses,
    recommendationsText: parsed.recommendations,
    readinessScore,
    predictedLow:        parsed.predictedLow,
    predictedHigh:       parsed.predictedHigh,
    learningProfile,
  }
}

// ─── Trigger helper — called fire-and-forget from exam submit route ───────────
//
// Fetches the student name and previous scores from Supabase, then calls
// generateMentorReport and upserts the result into ai_reports.

export type TriggerMentorReportParams = {
  userId:         string
  examId:         string
  submissionId:   string
  overallScore:   number   // percentage
  answeredCount:  number
  totalQuestions: number
  correctCount:   number
}

export async function triggerMentorReportAfterSubmit(params: TriggerMentorReportParams): Promise<void> {
  const {
    userId, examId, submissionId,
    overallScore, answeredCount, totalQuestions, correctCount,
  } = params

  const supabase = getSupabaseAdminClient()

  // Fetch student name
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single()

  // Fetch previous scores (up to 20, exclude current submission)
  const { data: prevSubs } = await supabase
    .from('submissions')
    .select('score, total_marks')
    .eq('user_id', userId)
    .neq('id', submissionId)
    .order('submitted_at', { ascending: true })
    .limit(20)

  const previousScores = (prevSubs ?? []).map(s =>
    s.total_marks > 0 ? Math.round((s.score / s.total_marks) * 100) : 0,
  )

  const accuracy    = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
  const attemptRate = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  const report = await generateMentorReport({
    studentName:        profile?.name ?? 'Student',
    overallScore,
    previousScores,
    accuracy,
    attemptRate,
    avgTimePerQuestion: 45,   // not tracked yet — use LDC exam average
    topics:             [],   // populated when question topic tags are added
  })

  // Upsert — one report per student per exam
  const { error } = await supabase
    .from('ai_reports')
    .upsert(
      {
        student_id:           userId,
        exam_id:              examId,
        submission_id:        submissionId,
        report_text:          report.reportText,
        readiness_score:      report.readinessScore,
        predicted_low:        report.predictedLow,
        predicted_high:       report.predictedHigh,
        learning_profile:     report.learningProfile,
        strengths_text:       report.strengthsText,
        weaknesses_text:      report.weaknessesText,
        recommendations_text: report.recommendationsText,
        generated_at:         new Date().toISOString(),
      },
      { onConflict: 'student_id,exam_id' },
    )

  if (error) {
    throw new Error(`Failed to save mentor report: ${error.message}`)
  }
}
