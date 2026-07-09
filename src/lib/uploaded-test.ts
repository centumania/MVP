/**
 * Shared types + validation for admin pre-uploaded daily tests.
 * Used by /api/admin/upload-test (write) and /api/study/daily-test/* (read).
 */

export interface UploadedQuestion {
  question:    string
  options:     [string, string, string, string]
  correct:     number          // 0-3 index of the right option
  explanation: string | null
  topic:       string
}

export function validateQuestions(raw: unknown): { questions: UploadedQuestion[] } | { error: string } {
  if (!Array.isArray(raw))    return { error: 'questions must be a JSON array' }
  if (raw.length === 0)       return { error: 'questions array is empty' }
  if (raw.length > 200)       return { error: 'Maximum 200 questions per test' }

  const questions: UploadedQuestion[] = []
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as Record<string, unknown>
    const n = i + 1
    if (typeof q !== 'object' || q === null)           return { error: `Q${n}: not an object` }
    if (typeof q.question !== 'string' || !q.question.trim())
      return { error: `Q${n}: "question" must be a non-empty string` }
    if (!Array.isArray(q.options) || q.options.length !== 4 ||
        q.options.some(o => typeof o !== 'string' || !o.trim()))
      return { error: `Q${n}: "options" must be an array of exactly 4 non-empty strings` }
    if (typeof q.correct !== 'number' || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3)
      return { error: `Q${n}: "correct" must be 0, 1, 2, or 3 (index of the right option)` }
    if (q.explanation != null && typeof q.explanation !== 'string')
      return { error: `Q${n}: "explanation" must be a string` }
    if (q.topic != null && typeof q.topic !== 'string')
      return { error: `Q${n}: "topic" must be a string` }

    questions.push({
      question:    (q.question as string).trim(),
      options:     (q.options as string[]).map(o => o.trim()) as [string, string, string, string],
      correct:     q.correct,
      explanation: typeof q.explanation === 'string' && q.explanation.trim() ? q.explanation.trim() : null,
      topic:       typeof q.topic === 'string' && q.topic.trim() ? q.topic.trim() : 'General Studies',
    })
  }
  return { questions }
}
