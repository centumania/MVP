/**
 * Centumania — Supabase Database TypeScript Types
 *
 * IMPORTANT: These types MUST mirror the live Supabase schema exactly.
 * When you run a new migration, update this file in the same commit.
 *
 * Actual tables in Supabase:
 *   batches           — exam cohorts (LDC 2026, UDC 2026…)
 *   profiles          — extends auth.users
 *   exams             — daily exam sessions
 *   questions         — MCQ questions (separate table, NOT jsonb on exams)
 *   materials         — daily study content (24hr expiry)
 *   submissions       — student exam submissions
 *   submission_answers — per-question answers
 *
 * Views:
 *   leaderboard       — cumulative rank, score, days, accuracy
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type PricingTier  = 'rookie' | 'warrior' | 'legend'
export type AnswerOption = 'A' | 'B' | 'C' | 'D'

// ---------------------------------------------------------------------------
// Row types — exactly match DB columns
// ---------------------------------------------------------------------------

export type Batch = {
  id:          string
  name:        string           // "LDC June 2026"
  exam_type:   string           // "LDC" | "UDC"
  starts_on:   string           // YYYY-MM-DD
  ends_on:     string           // YYYY-MM-DD
  total_days:  number
  is_active:   boolean
  created_at:  string
}

export type Profile = {
  id:               string      // FK → auth.users.id
  name:             string
  email:            string
  phone:            string | null
  tier:             PricingTier | null
  payment_verified: boolean
  is_admin:         boolean
  created_at:       string
  updated_at:       string
}

export type Exam = {
  id:          string
  batch_id:    string           // FK → batches.id
  day_number:  number           // 1–25 (unique per batch)
  title:       string
  description: string | null
  open_time:   string           // ISO 8601 UTC — 6:00 AM IST stored as UTC
  close_time:  string           // ISO 8601 UTC — 8:30 AM IST stored as UTC
  exam_date:   string           // YYYY-MM-DD (IST date)
  is_active:   boolean
  created_at:  string
}

export type Question = {
  id:             string
  exam_id:        string        // FK → exams.id
  question_text:  string
  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string
  correct_answer: AnswerOption  // NEVER send to client — server-side only
  explanation:    string | null // Shown after submission
  marks:          number
  sort_order:     number
  created_at:     string
}

// What the client receives when the exam is in progress:
//   - correct_answer stripped (never sent before submission)
//   - explanation stripped (would give hints before submission)
// After submission, explanation is returned inside ExamSubmitResult.answerKey.
export type QuestionForClient = Omit<Question, 'correct_answer' | 'explanation' | 'created_at'>

export type Material = {
  id:           string
  batch_id:     string          // FK → batches.id
  day_number:   number
  title:        string
  pdf_key:      string | null   // S3 object key — NEVER expose as a URL
  ppt_key:      string | null   // S3 object key — NEVER expose as a URL
  video_url:    string | null   // YouTube URL or CloudFront path (admin-set)
  html_key:     string | null   // Storage key for interactive HTML MindMap — NEVER expose directly
  published_at: string          // ISO 8601
  expires_at:   string          // published_at + 24h — enforced server-side
  created_at:   string
}

export type Submission = {
  id:           string
  user_id:      string          // FK → auth.users.id
  exam_id:      string          // FK → exams.id
  score:        number          // Calculated server-side — never trust client
  total_marks:  number
  submitted_at: string
}

export type SubmissionAnswer = {
  id:              string
  submission_id:   string       // FK → submissions.id
  question_id:     string       // FK → questions.id
  selected_answer: AnswerOption
  is_correct:      boolean      // Denormalised — set at write time server-side
}

// ---------------------------------------------------------------------------
// View types
// ---------------------------------------------------------------------------

export type LeaderboardEntry = {
  user_id:          string
  name:             string
  tier:             PricingTier | null
  total_score:      number
  days_attended:    number
  accuracy_percent: number      // 0.0–100.0
  rank:             number
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export type ExamWindowStatus = {
  isOpen:        boolean
  opensIn:       string | null  // Human-readable e.g. "2 hours 30 minutes"
  closesIn:      string | null  // Human-readable e.g. "45 minutes"
  message:       string         // UI display string
  serverTimeIST: string         // ISO 8601 with +05:30 offset — for debugging
}

export type ExamSubmitResult = {
  score:      number
  total:      number
  percentage: number
  answerKey:  {
    questionId:  string
    yourAnswer:  AnswerOption
    correct:     AnswerOption
    isCorrect:   boolean
    explanation: string | null
  }[]
}

// ---------------------------------------------------------------------------
// Supabase Database generic — passed to createClient<Database>
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      batches: {
        Row:           Batch
        Insert:        Omit<Batch, 'id' | 'created_at'>
        Update:        Partial<Omit<Batch, 'id' | 'created_at'>>
        Relationships: []
      }
      profiles: {
        Row:           Profile
        Insert:        Omit<Profile, 'created_at' | 'updated_at'>
        Update:        Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      exams: {
        Row:           Exam
        Insert:        Omit<Exam, 'id' | 'created_at'>
        Update:        Partial<Omit<Exam, 'id' | 'created_at'>>
        Relationships: []
      }
      questions: {
        Row:           Question
        Insert:        Omit<Question, 'id' | 'created_at'>
        Update:        Partial<Omit<Question, 'id' | 'created_at'>>
        Relationships: []
      }
      materials: {
        Row:           Material
        Insert:        Omit<Material, 'id' | 'created_at'>
        Update:        Partial<Omit<Material, 'id' | 'created_at'>>
        Relationships: []
      }
      submissions: {
        Row:           Submission
        Insert:        Omit<Submission, 'id' | 'submitted_at'> & { submitted_at?: string }
        Update:        Partial<Omit<Submission, 'id'>>
        Relationships: []
      }
      submission_answers: {
        Row:           SubmissionAnswer
        Insert:        Omit<SubmissionAnswer, 'id'>
        Update:        Partial<Omit<SubmissionAnswer, 'id'>>
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row:           LeaderboardEntry
        Insert:        Record<string, never>
        Update:        Record<string, never>
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      pricing_tier:  PricingTier
      answer_option: AnswerOption
    }
  }
}
