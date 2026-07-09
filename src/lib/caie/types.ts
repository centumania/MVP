// CAIE — Current Affairs Intelligence Engine types
// Mirrors shared/typescript/types/ in the current-affairs repo.

export type ExamType = 'UPSC' | 'TNPSC' | 'SSC' | 'Banking' | 'Railways' | 'State_PSC'
export type ImportanceLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface CAIEEvent {
  id: string
  headline: string
  ultra_short_summary: string
  detailed_summary?: string
  key_facts?: string[]
  background?: string | null
  keywords: string[]
  tags: string[]
  category: string
  source_date: string
  importance: ImportanceLevel
  exam_scores: Partial<Record<ExamType, number>>
  truth_score: number
  source_count: number
  published_at: string | null
}

export interface CAIEMCQ {
  id: string
  event_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  difficulty: DifficultyLevel
  exam_type: ExamType
  tags: string[]
  language: string
}

export interface CAIEEventListResponse {
  data: CAIEEvent[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface CAIEMCQListResponse {
  data: CAIEMCQ[]
  total: number
  page: number
  per_page: number
}

export interface CAIEEventDetail {
  event: CAIEEvent
  mcqs: CAIEMCQ[]
}

export interface CAIESearchResult {
  id: string
  headline: string
  ultra_short_summary: string
  category: string
  source_date: string
  rank: number
}

export interface CAIESearchResponse {
  data: CAIESearchResult[]
  total: number
  query: string
}

export type EntityType =
  | 'person' | 'organization' | 'country' | 'state' | 'city'
  | 'act' | 'bill' | 'scheme' | 'report' | 'committee'
  | 'book' | 'award' | 'sport' | 'company' | 'rank'
  | 'index' | 'court' | 'mission' | 'space_program' | 'treaty' | 'summit'

export interface CAIEEntity {
  id: string
  name: string
  entity_type: EntityType
  aliases: string[]
  description?: string | null
  created_at: string
}

export interface CAIEEntityListResponse {
  data: CAIEEntity[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface CAIEEntityDetail {
  entity: CAIEEntity
  events: Pick<CAIEEvent, 'id' | 'headline' | 'ultra_short_summary' | 'category' | 'source_date' | 'importance' | 'published_at'>[]
}

export interface CAIEAttempt {
  mcq_id: string
  chosen_option: 'A' | 'B' | 'C' | 'D'
  is_correct: boolean
  attempted_at: string
}

export interface CAIEAttemptResult {
  is_correct: boolean
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export interface CAIEAttemptListResponse {
  data: CAIEAttempt[]
}

export interface CAIERevisionResponse {
  data: CAIEMCQ[]
  total: number
}

export interface CAIEUserStats {
  total_attempted: number
  total_correct: number
  accuracy: number
  by_difficulty: Record<string, { attempted: number; correct: number }>
  by_exam_type: Record<string, { attempted: number; correct: number }>
}
