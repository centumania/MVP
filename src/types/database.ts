/**
 * CentuMania — Supabase Database TypeScript Types
 *
 * IMPORTANT: These types MUST mirror the live Supabase schema exactly.
 * When you run a new migration, update this file in the same commit.
 *
 * Actual tables in Supabase:
 *   batches            — exam cohorts (SSC 2026, RRB 2026…)
 *   profiles           — extends auth.users
 *   exams              — daily exam sessions
 *   questions          — MCQ questions (separate table, NOT jsonb on exams)
 *   materials          — daily study content (24hr expiry)
 *   submissions        — student exam submissions
 *   submission_answers — per-question answers
 *   daily_test_scores  — study-quiz scores (migration 020)
 *
 * Views:
 *   leaderboard        — formal-exam cumulative rank (do NOT union with study_leaderboard)
 *   study_leaderboard  — study-quiz cumulative rank (migration 020)
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
  name:        string           // "SSC June 2026"
  exam_type:   string           // "SSC" | "RRB" | "Banking" | "TN" …
  starts_on:   string           // YYYY-MM-DD
  ends_on:     string           // YYYY-MM-DD
  total_days:  number
  is_active:   boolean
  created_at:  string
}

export type Profile = {
  id:                  string      // FK → auth.users.id
  name:                string
  email:               string
  phone:               string | null
  tier:                PricingTier | null
  payment_verified:    boolean
  is_admin:            boolean
  registration_number: string | null
  batch_id:            string | null  // FK → batches.id
  created_at:          string
  updated_at:          string
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
  link_url:    string | null   // Optional external test link shown to students on the exam page
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
  topic:          string        // Added in migration 023, DEFAULT 'General Studies'
  subtopic:       string | null // Added in migration 023, nullable
  created_at:     string
}

// What the client receives when the exam is in progress:
//   - correct_answer stripped (never sent before submission)
//   - explanation stripped (would give hints before submission)
// After submission, explanation is returned inside ExamSubmitResult.answerKey.
export type QuestionForClient = Omit<Question, 'correct_answer' | 'explanation' | 'created_at' | 'topic' | 'subtopic'> & { topic?: string }

export type Material = {
  id:           string
  batch_id:     string          // FK → batches.id
  day_number:   number
  title:        string
  pdf_key:      string | null   // S3 object key — NEVER expose as a URL
  ppt_key:      string | null   // S3 object key — NEVER expose as a URL
  video_url:    string | null   // YouTube URL or CloudFront path (admin-set)
  html_key:     string | null   // Legacy storage key — deprecated, use html_url
  html_url:     string | null   // Externally hosted HTML URL — redirect target after auth gate
  test_link:    string | null   // Optional external test URL (Google Form, quiz platform, etc.)
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

// Formal-exam leaderboard and study-quiz leaderboard are intentionally separate.
// Do not union public.leaderboard with public.study_leaderboard.
export type StudyLeaderboardEntry = {
  name:             string       // no user_id — stripped by API before sending to client
  tier:             PricingTier | null
  total_score:      number
  days_attended:    number
  accuracy_percent: number       // 0.0–100.0
  rank:             number
}

// ---------------------------------------------------------------------------
// Student metrics table (migration 022)
// ---------------------------------------------------------------------------

export type StudentMetrics = {
  user_id:          string
  materials_opened: number
  nodes_opened:     number
  nodes_completed:  number
  mcqs_completed:   number
  mcqs_correct:     number
  study_sessions:   number
  engagement_score: number    // weighted: material×10 + node×5 + completed×20 + mcq×15 + session×10
  last_event_at:    string | null
  updated_at:       string
}

// ---------------------------------------------------------------------------
// Study-quiz tables (migration 020)
// ---------------------------------------------------------------------------

export type DailyTestScore = {
  id:                string
  user_id:           string
  material_id:       string
  test_date:         string    // YYYY-MM-DD (IST), server-computed — client never supplies
  score:             number
  total:             number
  in_morning_window: boolean   // label only: true if 06:00–08:29 IST; never a gate
  time_taken_s:      number | null
  submitted_at:      string
}

// ---------------------------------------------------------------------------
// Centum Index tables
// ---------------------------------------------------------------------------

export type Node = {
  id:         string
  topic_id:   string | null
  node_type:  'recognition' | 'shortcut' | 'trap' | 'pyq' | 'mastery'
  title:      string
  content:    Record<string, unknown>
  is_active:  boolean
  created_at: string
}

export type NodeAssignment = {
  id:            string
  batch_id:      string
  node_id:       string
  assigned_date: string    // YYYY-MM-DD
}

export type NodeProgress = {
  id:           string
  user_id:      string
  node_id:      string
  visited_at:   string
  completed_at: string | null
  is_completed: boolean
}

export type McqAttempt = {
  id:              string
  user_id:         string
  node_id:         string
  question_id:     string
  attempt_number:  number
  selected_option: string | null
  is_correct:      boolean
  attempted_at:    string
}

export type CentumIndexLogRow = {
  id:                    string
  user_id:               string
  batch_id:              string
  calculated_date:       string
  tests_conducted:       number
  tests_submitted:       number
  attendance_index:      number
  nodes_assigned:        number
  nodes_completed:       number
  node_completion_pct:   number
  first_attempt_correct: number
  first_attempt_total:   number
  first_attempt_acc_pct: number
  node_index:            number
  centum_index:          number
}

// ---------------------------------------------------------------------------
// Daily test / Centum Index submissions (migrations 007, 024, 028)
// ---------------------------------------------------------------------------

export type DailyTest = {
  id:              string
  batch_id:        string
  test_date:       string    // YYYY-MM-DD
  is_published:    boolean
  total_questions: number | null
  created_at:      string
}

export type TestSubmission = {
  id:           string
  user_id:      string      // FK → profiles.id
  test_id:      string      // FK → daily_tests.id
  score:        number
  submitted_at: string
}

export type TestSubmissionAnswer = {
  id:              string
  submission_id:   string   // FK → test_submissions.id
  question_id:     string   // FK → questions.id
  selected_answer: AnswerOption
  is_correct:      boolean
}

export type DailyTestAssignment = {
  id:               string
  user_id:          string
  test_date:        string         // YYYY-MM-DD
  question_ids:     string[]
  html_question_ids: string[]      // Added in migration 029
  generated_at:     string
  topic_weights:    Record<string, string[]> | null
}

// ---------------------------------------------------------------------------
// HTML question bank (migration 029)
// ---------------------------------------------------------------------------

export type HtmlQuestion = {
  id:             string
  source_file:    string
  node_title:     string | null
  question_text:  string
  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string
  correct_option: number    // 0-based (0=A, 1=B, 2=C, 3=D)
  explanation:    string | null
  topic:          string
  is_trap:        boolean
  extracted_at:   string
}

export type HtmlQuestionAccuracy = {
  id:               string
  user_id:          string
  html_question_id: string
  total_attempted:  number
  total_correct:    number
  last_updated:     string
}

// ---------------------------------------------------------------------------
// Uploaded Tests (migration 031) — admin pre-uploaded daily tests
// ---------------------------------------------------------------------------

export type UploadedTest = {
  id:             string
  test_date:      string    // YYYY-MM-DD, unique
  title:          string
  questions:      {
    question:    string
    options:     [string, string, string, string]
    correct:     number
    explanation: string | null
    topic:       string
  }[]
  question_count: number
  is_published:   boolean
  created_by:     string | null
  created_at:     string
  updated_at:     string
}

// ---------------------------------------------------------------------------
// Current Affairs (migration 030)
// ---------------------------------------------------------------------------

export type CurrentAffair = {
  id:             string
  title:          string
  summary:        string
  category:       string
  exam_relevance: 'High' | 'Medium' | 'Low'
  tags:           string[]
  source_date:    string    // YYYY-MM-DD
  generated_at:   string
  is_active:      boolean
}

// ---------------------------------------------------------------------------
// Analytics Events
// ---------------------------------------------------------------------------

export type AnalyticsEvent = {
  id:              string
  user_id:         string
  session_id:      string | null
  event_name:      string
  event_timestamp: string
  metadata:        Record<string, unknown> | null
  created_at:      string
}

// ---------------------------------------------------------------------------
// AI Mentor Report
// ---------------------------------------------------------------------------

export type AiReport = {
  id:                   string
  student_id:           string      // FK → auth.users.id
  exam_id:              string      // FK → exams.id
  submission_id:        string      // FK → submissions.id
  report_text:          string      // Full raw Claude response
  readiness_score:      number      // 0–100
  predicted_low:        number
  predicted_high:       number
  learning_profile:     string      // e.g. "The Scholar"
  strengths_text:       string | null
  weaknesses_text:      string | null
  recommendations_text: string | null
  generated_at:         string
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
        Insert:        Omit<Question, 'id' | 'created_at' | 'topic' | 'subtopic'> & { topic?: string; subtopic?: string | null }
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
      ai_reports: {
        Row:           AiReport
        Insert:        Omit<AiReport, 'id' | 'generated_at'> & { generated_at?: string }
        Update:        Partial<Omit<AiReport, 'id'>>
        Relationships: []
      }
      daily_test_scores: {
        Row:           DailyTestScore
        Insert:        Omit<DailyTestScore, 'id' | 'submitted_at'> & { submitted_at?: string }
        Update:        Partial<Omit<DailyTestScore, 'id'>>
        Relationships: []
      }
      nodes: {
        Row:           Node
        Insert:        Omit<Node, 'id' | 'created_at' | 'topic_id'> & { id?: string; topic_id?: string | null }
        Update:        Partial<Omit<Node, 'id' | 'created_at'>>
        Relationships: []
      }
      node_assignments: {
        Row:           NodeAssignment
        Insert:        Omit<NodeAssignment, 'id'>
        Update:        Partial<Omit<NodeAssignment, 'id'>>
        Relationships: []
      }
      node_progress: {
        Row:           NodeProgress
        Insert:        Omit<NodeProgress, 'id'>
        Update:        Partial<Omit<NodeProgress, 'id'>>
        Relationships: []
      }
      mcq_attempts: {
        Row:           McqAttempt
        Insert:        Omit<McqAttempt, 'id'>
        Update:        Partial<Omit<McqAttempt, 'id'>>
        Relationships: []
      }
      centum_index_log: {
        Row:           CentumIndexLogRow
        Insert:        Omit<CentumIndexLogRow, 'id'>
        Update:        Partial<Omit<CentumIndexLogRow, 'id'>>
        Relationships: []
      }
      analytics_events: {
        Row:           AnalyticsEvent
        Insert:        Omit<AnalyticsEvent, 'id' | 'created_at'>
        Update:        Partial<Omit<AnalyticsEvent, 'id' | 'created_at'>>
        Relationships: []
      }
      student_metrics: {
        Row:           StudentMetrics
        Insert:        Omit<StudentMetrics, 'updated_at'>
        Update:        Partial<Omit<StudentMetrics, 'user_id'>>
        Relationships: []
      }
      student_topic_accuracy: {
        Row:           { user_id: string; topic: string; total_attempted: number; total_correct: number; last_updated: string }
        Insert:        { user_id: string; topic: string; total_attempted: number; total_correct: number; last_updated?: string }
        Update:        { total_attempted?: number; total_correct?: number; last_updated?: string }
        Relationships: []
      }
      daily_tests: {
        Row:           DailyTest
        Insert:        Omit<DailyTest, 'id' | 'created_at'>
        Update:        Partial<Omit<DailyTest, 'id' | 'created_at'>>
        Relationships: []
      }
      test_submissions: {
        Row:           TestSubmission
        Insert:        Omit<TestSubmission, 'id' | 'submitted_at'> & { submitted_at?: string }
        Update:        Partial<Omit<TestSubmission, 'id'>>
        Relationships: []
      }
      test_submission_answers: {
        Row:           TestSubmissionAnswer
        Insert:        Omit<TestSubmissionAnswer, 'id'>
        Update:        Partial<Omit<TestSubmissionAnswer, 'id'>>
        Relationships: []
      }
      daily_test_assignments: {
        Row:           DailyTestAssignment
        Insert:        Omit<DailyTestAssignment, 'id'>
        Update:        Partial<Omit<DailyTestAssignment, 'id'>>
        Relationships: []
      }
      html_question_bank: {
        Row:           HtmlQuestion
        Insert:        Omit<HtmlQuestion, 'id' | 'extracted_at'> & { extracted_at?: string }
        Update:        Partial<Omit<HtmlQuestion, 'id'>>
        Relationships: []
      }
      html_question_accuracy: {
        Row:           HtmlQuestionAccuracy
        Insert:        Omit<HtmlQuestionAccuracy, 'id'>
        Update:        Partial<Omit<HtmlQuestionAccuracy, 'id'>>
        Relationships: []
      }
      current_affairs: {
        Row:           CurrentAffair
        Insert:        Omit<CurrentAffair, 'id' | 'generated_at'> & { generated_at?: string }
        Update:        Partial<Omit<CurrentAffair, 'id'>>
        Relationships: []
      }
      uploaded_tests: {
        Row:           UploadedTest
        Insert:        Omit<UploadedTest, 'id' | 'created_at' | 'updated_at'> & { updated_at?: string }
        Update:        Partial<Omit<UploadedTest, 'id'>>
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row:           LeaderboardEntry & { batch_id: string }
        Insert:        Record<string, never>
        Update:        Record<string, never>
        Relationships: []
      }
      // study_leaderboard Row includes user_id for server-side rank lookup.
      // The API strips user_id before responding to clients (see StudyLeaderboardEntry).
      study_leaderboard: {
        Row:           StudyLeaderboardEntry & { user_id: string }
        Insert:        Record<string, never>
        Update:        Record<string, never>
        Relationships: []
      }
    }
    Functions: {
      calculate_centum_index: {
        Args:    { p_user_id: string }
        Returns: Record<string, unknown>
      }
      refresh_student_metrics: {
        Args:    Record<string, never>
        Returns: { students_updated: number }[]
      }
      update_topic_accuracy_after_submission: {
        Args:    { p_submission_id: string }
        Returns: void
      }
      update_realtime_attendance: {
        Args:    { p_user_id: string; p_batch_id: string }
        Returns: void
      }
      upsert_html_question_accuracy: {
        Args:    { p_user_id: string; p_html_question_id: string; p_correct: boolean }
        Returns: void
      }
    }
    Enums: {
      pricing_tier:  PricingTier
      answer_option: AnswerOption
    }
  }
}
