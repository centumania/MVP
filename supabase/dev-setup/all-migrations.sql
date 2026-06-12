-- ============================================================
-- 001_schema.sql
-- ============================================================

-- =============================================================================
-- Centumania MVP — Database Schema
-- Migration: 001_schema.sql
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

create extension if not exists "uuid-ossp";


-- =============================================================================
-- ENUM TYPES
-- =============================================================================

create type pricing_tier as enum ('rookie', 'warrior', 'legend');

create type answer_option as enum ('A', 'B', 'C', 'D');


-- =============================================================================
-- TABLE: profiles
-- Extends auth.users — created automatically on signup via trigger.
-- =============================================================================

create table public.profiles (
  id                uuid        not null references auth.users (id) on delete cascade,
  name              text        not null,
  email             text        not null,
  phone             text,
  tier              pricing_tier,
  payment_verified  boolean     not null default false,
  is_admin          boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_phone_check check (phone ~ '^[6-9][0-9]{9}$')  -- Indian mobile numbers
);

comment on table public.profiles is
  'Extended user data. One row per auth.users entry. RLS: users see only their own row; admins see all.';

-- Index: admin lookups and payment checks
create index idx_profiles_is_admin          on public.profiles (is_admin)         where is_admin = true;
create index idx_profiles_payment_verified  on public.profiles (payment_verified)  where payment_verified = true;
create index idx_profiles_tier              on public.profiles (tier);


-- =============================================================================
-- TABLE: exams
-- One row = one daily exam session (Day 1 … Day 25).
-- =============================================================================

create table public.exams (
  id           uuid        not null default uuid_generate_v4(),
  day_number   integer     not null,
  title        text        not null,
  description  text,
  open_time    timestamptz not null,   -- 6:00 AM IST — always stored as UTC
  close_time   timestamptz not null,   -- 8:30 AM IST — always stored as UTC
  exam_date    date        not null,
  is_active    boolean     not null default false,
  created_at   timestamptz not null default now(),

  constraint exams_pkey primary key (id),
  constraint exams_day_number_key unique (day_number),
  constraint exams_day_number_range check (day_number between 1 and 25),
  constraint exams_window_check check (close_time > open_time)
);

comment on table public.exams is
  'Daily exam sessions. day_number is globally unique (single cohort). open_time/close_time enforced server-side only — never trust client clock.';

-- Index: daily lookups by date and active status
create index idx_exams_exam_date  on public.exams (exam_date);
create index idx_exams_is_active  on public.exams (is_active) where is_active = true;


-- =============================================================================
-- TABLE: questions
-- MCQ questions belonging to an exam.
-- CRITICAL: correct_answer is never sent to the client. Score is server-side only.
-- =============================================================================

create table public.questions (
  id             uuid          not null default uuid_generate_v4(),
  exam_id        uuid          not null references public.exams (id) on delete cascade,
  question_text  text          not null,
  option_a       text          not null,
  option_b       text          not null,
  option_c       text          not null,
  option_d       text          not null,
  correct_answer answer_option not null,  -- NEVER exposed via student-facing API
  explanation    text,                    -- Shown after submission
  marks          integer       not null default 1,
  sort_order     integer       not null default 0,
  created_at     timestamptz   not null default now(),

  constraint questions_pkey primary key (id),
  constraint questions_marks_positive check (marks > 0)
);

comment on table public.questions is
  'MCQ questions. correct_answer is stripped in the API before returning to students.';

-- Index: fetch all questions for an exam in display order
create index idx_questions_exam_id on public.questions (exam_id, sort_order);


-- =============================================================================
-- TABLE: submissions
-- One row per student per exam. UNIQUE constraint enforces no re-submissions.
-- Score is calculated server-side — never computed on client.
-- =============================================================================

create table public.submissions (
  id            uuid        not null default uuid_generate_v4(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  exam_id       uuid        not null references public.exams (id) on delete restrict,
  score         integer     not null default 0,
  total_marks   integer     not null default 0,
  submitted_at  timestamptz not null default now(),

  constraint submissions_pkey primary key (id),
  constraint submissions_one_per_user_per_exam unique (user_id, exam_id),
  constraint submissions_score_non_negative check (score >= 0),
  constraint submissions_score_lte_total check (score <= total_marks)
);

comment on table public.submissions is
  'One row per student per exam. UNIQUE(user_id, exam_id) prevents double-submission at DB level.';

-- Index: leaderboard queries and per-user history
create index idx_submissions_user_id   on public.submissions (user_id);
create index idx_submissions_exam_id   on public.submissions (exam_id);
create index idx_submissions_submitted on public.submissions (submitted_at desc);


-- =============================================================================
-- TABLE: submission_answers
-- Individual answer per question per submission.
-- Used to show the answer key after submission.
-- =============================================================================

create table public.submission_answers (
  id               uuid          not null default uuid_generate_v4(),
  submission_id    uuid          not null references public.submissions (id) on delete cascade,
  question_id      uuid          not null references public.questions (id)   on delete cascade,
  selected_answer  answer_option not null,
  is_correct       boolean       not null,  -- Denormalised — set at write time (server-calculated)

  constraint submission_answers_pkey primary key (id),
  constraint submission_answers_one_per_question unique (submission_id, question_id)
);

comment on table public.submission_answers is
  'Per-question answer record. is_correct stored at write time for fast answer-key rendering.';

-- Index: render answer key for a submission
create index idx_submission_answers_submission_id on public.submission_answers (submission_id);


-- =============================================================================
-- TABLE: materials
-- Daily study content (PDFs, PPTs, video URLs).
-- expires_at = 24 hours after published_at. Checked server-side only.
-- S3 keys are stored — never expose raw S3 URLs to the client.
-- =============================================================================

create table public.materials (
  id           uuid        not null default uuid_generate_v4(),
  day_number   integer     not null,
  title        text        not null,
  pdf_key      text,        -- S3 object key — NOT a URL
  ppt_key      text,        -- S3 object key — NOT a URL
  video_url    text,        -- YouTube URL or CloudFront key (admin-controlled)
  published_at timestamptz not null default now(),
  expires_at   timestamptz not null,   -- published_at + 24 hours, set by admin
  created_at   timestamptz not null default now(),

  constraint materials_pkey primary key (id),
  constraint materials_day_number_key unique (day_number),
  constraint materials_day_range check (day_number between 1 and 25),
  constraint materials_expiry_check check (expires_at > published_at),
  constraint materials_has_content check (
    pdf_key is not null or ppt_key is not null or video_url is not null
  )
);

comment on table public.materials is
  'Daily study material. expires_at enforced server-side. S3 keys resolved to presigned URLs in API — never exposed raw.';

-- Index: daily content lookup + expiry check
create index idx_materials_day_number on public.materials (day_number);
create index idx_materials_expires_at on public.materials (expires_at);


-- =============================================================================
-- VIEW: leaderboard
-- Cumulative rankings across all submissions.
-- Updates automatically — no manual refresh needed.
-- =============================================================================

create or replace view public.leaderboard as
  select
    p.id                                                          as user_id,
    p.name,
    p.tier,
    coalesce(sum(s.score), 0)                                     as total_score,
    count(s.id)                                                   as days_attended,
    case
      when sum(s.total_marks) = 0 then 0
      else round((sum(s.score)::numeric / sum(s.total_marks)::numeric) * 100, 1)
    end                                                           as accuracy_percent,
    rank() over (order by coalesce(sum(s.score), 0) desc,
                          count(s.id) desc)                       as rank
  from public.profiles p
  left join public.submissions s on s.user_id = p.id
  where p.payment_verified = true
    and p.is_admin = false
  group by p.id, p.name, p.tier;

comment on view public.leaderboard is
  'Cumulative rankings: total score, days attended, accuracy %. Payment-verified non-admin users only.';


-- =============================================================================
-- FUNCTION + TRIGGER: auto-create profile on signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

comment on function public.handle_new_user is
  'Creates a profiles row automatically when a new user signs up via Supabase Auth.';


-- =============================================================================
-- FUNCTION + TRIGGER: keep updated_at current on profiles
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();


-- =============================================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- =============================================================================

alter table public.profiles           enable row level security;
alter table public.exams              enable row level security;
alter table public.questions          enable row level security;
alter table public.submissions        enable row level security;
alter table public.submission_answers enable row level security;
alter table public.materials          enable row level security;


-- =============================================================================
-- RLS POLICIES: profiles
-- =============================================================================

create policy "profiles: user reads own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user updates own row"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admin reads all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "profiles: admin updates all"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- =============================================================================
-- RLS POLICIES: exams
-- =============================================================================

create policy "exams: student reads active"
  on public.exams for select
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and payment_verified = true
        and is_admin = false
    )
  );

create policy "exams: admin full access"
  on public.exams for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- =============================================================================
-- RLS POLICIES: questions
-- CRITICAL: correct_answer is stripped in the API before sending to client.
-- =============================================================================

create policy "questions: student reads for active exam"
  on public.questions for select
  using (
    exists (
      select 1
      from public.exams e
      join public.profiles p on p.id = auth.uid()
      where e.id = questions.exam_id
        and e.is_active = true
        and p.payment_verified = true
        and p.is_admin = false
    )
  );

create policy "questions: admin full access"
  on public.questions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- =============================================================================
-- RLS POLICIES: submissions
-- =============================================================================

create policy "submissions: student reads own"
  on public.submissions for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and payment_verified = true
    )
  );

create policy "submissions: student inserts own"
  on public.submissions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and payment_verified = true
        and is_admin = false
    )
  );

create policy "submissions: admin reads all"
  on public.submissions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- =============================================================================
-- RLS POLICIES: submission_answers
-- =============================================================================

create policy "submission_answers: student reads own"
  on public.submission_answers for select
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_answers.submission_id
        and s.user_id = auth.uid()
    )
  );

create policy "submission_answers: student inserts own"
  on public.submission_answers for insert
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_answers.submission_id
        and s.user_id = auth.uid()
    )
  );

create policy "submission_answers: admin reads all"
  on public.submission_answers for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- =============================================================================
-- RLS POLICIES: materials
-- =============================================================================

create policy "materials: student reads active"
  on public.materials for select
  using (
    now() < expires_at
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and payment_verified = true
        and is_admin = false
    )
  );

create policy "materials: admin full access"
  on public.materials for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- =============================================================================
-- GRANT: allow authenticated users to read the leaderboard view
-- =============================================================================

grant select on public.leaderboard to authenticated;


-- =============================================================================
-- DONE
-- To verify: run "select * from public.leaderboard limit 5;" after inserting test data.
-- =============================================================================


-- ============================================================
-- 002_single_active_batch.sql
-- ============================================================

-- =============================================================================
-- Migration: 002_single_active_batch.sql
-- Run in: Supabase Dashboard → SQL Editor
--
-- Problem: The batches table has no constraint preventing multiple rows from
-- having is_active = true simultaneously. If two batches are active, the
-- /api/exam/window route's .maybeSingle() call errors and returns 503 to
-- all students — including on exam morning.
--
-- Fix: A partial unique index on (is_active) WHERE is_active = true.
-- PostgreSQL only indexes rows satisfying the WHERE clause. Since only one
-- value of `true` can be unique, at most one active batch can ever exist.
-- Attempting to set a second batch active fails at the DB level before commit.
-- =============================================================================

create unique index idx_batches_one_active
  on public.batches (is_active)
  where is_active = true;

-- Verify no violation already exists before the index is created.
-- If this DO block raises an exception, you have multiple active batches
-- and must deactivate extras before running the index creation above.
do $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from public.batches
  where is_active = true;

  if active_count > 1 then
    raise exception
      'Cannot create constraint: % active batches found. '
      'Set all but one to is_active = false before running this migration.',
      active_count;
  end if;
end;
$$;


-- ============================================================
-- 003_batches_and_batch_ids.sql
-- ============================================================

-- =============================================================================
-- Migration: 003_batches_and_batch_ids.sql
--
-- Adds the batches table (missing from 001_schema.sql) and the batch_id
-- foreign key columns on exams and materials.
--
-- Safe to run on a live DB — all statements use IF NOT EXISTS or add columns
-- only when absent. Idempotent.
-- =============================================================================

-- ── 1. batches table ──────────────────────────────────────────────────────────

create table if not exists public.batches (
  id          uuid        not null default uuid_generate_v4(),
  name        text        not null,
  exam_type   text        not null default 'LDC',
  starts_on   date        not null,
  ends_on     date        not null,
  total_days  integer     not null default 25,
  is_active   boolean     not null default false,
  created_at  timestamptz not null default now(),

  constraint batches_pkey            primary key (id),
  constraint batches_name_key        unique (name),
  constraint batches_total_days_pos  check (total_days > 0),
  constraint batches_dates_valid     check (ends_on >= starts_on)
);

comment on table public.batches is
  'Exam cohorts. Only one batch may be active at a time (enforced by partial unique index).';

create unique index if not exists idx_batches_one_active
  on public.batches (is_active)
  where is_active = true;

alter table public.batches enable row level security;

create policy "batches: student reads active"
  on public.batches for select
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and payment_verified = true
    )
  );

create policy "batches: admin full access"
  on public.batches for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ── 2. Add batch_id to exams (if missing) ────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'exams'
      and column_name  = 'batch_id'
  ) then
    alter table public.exams
      add column batch_id uuid references public.batches (id) on delete cascade;

    -- Back-fill: if a default batch exists, assign all exams to it.
    update public.exams e
    set    batch_id = b.id
    from   public.batches b
    where  b.is_active = true
      and  e.batch_id  is null;

    -- Non-null after back-fill (if a batch exists)
    -- Intentionally left nullable in case no batch exists yet.
    create index if not exists idx_exams_batch_id
      on public.exams (batch_id);
  end if;
end;
$$;

-- Remove old global unique constraint on day_number if it prevents multi-batch use
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.exams'::regclass
      and conname  = 'exams_day_number_key'
  ) then
    alter table public.exams drop constraint exams_day_number_key;
    -- Replace with per-batch uniqueness
    create unique index if not exists idx_exams_batch_day
      on public.exams (batch_id, day_number);
  end if;
end;
$$;

-- ── 3. Add batch_id to materials (if missing) ────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'materials'
      and column_name  = 'batch_id'
  ) then
    alter table public.materials
      add column batch_id uuid references public.batches (id) on delete cascade;

    update public.materials m
    set    batch_id = b.id
    from   public.batches b
    where  b.is_active = true
      and  m.batch_id  is null;

    create index if not exists idx_materials_batch_id
      on public.materials (batch_id);
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname  = 'materials_day_number_key'
  ) then
    alter table public.materials drop constraint materials_day_number_key;
    create unique index if not exists idx_materials_batch_day
      on public.materials (batch_id, day_number);
  end if;
end;
$$;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- To verify:
--   select * from public.batches;
--   select batch_id, count(*) from public.exams group by 1;
--   select batch_id, count(*) from public.materials group by 1;


-- ============================================================
-- 004_fix_rls_recursion.sql
-- ============================================================

-- =============================================================================
-- Migration 004 — Fix recursive RLS policy on profiles
-- =============================================================================
-- The "admin reads all" policy contained a subquery that read from `profiles`
-- while checking if the user is admin — causing infinite recursion that
-- silently returned NULL, breaking the admin layout's is_admin check.
--
-- Fix: use a SECURITY DEFINER function to break the recursion.
-- =============================================================================

-- 1. Create a security-definer helper (runs as table owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.requesting_user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 2. Drop the old recursive policy
DROP POLICY IF EXISTS "profiles: admin reads all" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile"   ON public.profiles;

-- 3. Recreate admin-reads-all using the non-recursive function
CREATE POLICY "profiles: admin reads all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.requesting_user_is_admin());

-- 4. Ensure the user-reads-own-row policy exists (idempotent)
DROP POLICY IF EXISTS "profiles: user reads own row" ON public.profiles;
CREATE POLICY "profiles: user reads own row"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Done. Both policies are now non-recursive.
-- The function is SECURITY DEFINER so it reads profiles as the table owner.


-- ============================================================
-- 005_add_html_key_to_materials.sql
-- ============================================================

-- =============================================================================
-- Migration: 005_add_html_key_to_materials.sql
-- Adds html_key column to materials table for interactive MindMap HTML files.
-- Safe to run on live DB — adds nullable column, no data loss.
-- =============================================================================

alter table public.materials
  add column if not exists html_key text;

-- Update the has_content check to include html_key
alter table public.materials
  drop constraint if exists materials_has_content;

alter table public.materials
  add constraint materials_has_content check (
    pdf_key is not null or ppt_key is not null or video_url is not null or html_key is not null
  );

comment on column public.materials.html_key is
  'Supabase Storage object key for the interactive HTML MindMap file. Served via presigned URL through /api/materials/mindmap/[id]. Never expose the raw key to clients.';


-- ============================================================
-- 006_ai_reports.sql
-- ============================================================

-- =============================================================================
-- Migration: 006_ai_reports.sql
-- Adds the ai_reports table for storing AI Mentor Report results.
--
-- One report per student per exam. Re-submitting overwrites via upsert on
-- the (student_id, exam_id) unique constraint.
--
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_reports (
  id                   UUID        NOT NULL DEFAULT uuid_generate_v4(),
  student_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id              UUID        NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  submission_id        UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  report_text          TEXT        NOT NULL DEFAULT '',
  readiness_score      INTEGER     NOT NULL DEFAULT 0,
  predicted_low        INTEGER     NOT NULL DEFAULT 0,
  predicted_high       INTEGER     NOT NULL DEFAULT 0,
  learning_profile     VARCHAR(64) NOT NULL DEFAULT '',
  strengths_text       TEXT,
  weaknesses_text      TEXT,
  recommendations_text TEXT,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ai_reports_pkey               PRIMARY KEY (id),
  CONSTRAINT ai_reports_student_exam_unique UNIQUE (student_id, exam_id),
  CONSTRAINT ai_reports_readiness_range     CHECK (readiness_score BETWEEN 0 AND 100),
  CONSTRAINT ai_reports_predicted_range     CHECK (predicted_high >= predicted_low)
);

COMMENT ON TABLE public.ai_reports IS
  'AI Mentor Reports generated by Claude after each exam submission. '
  'One report per student per exam — upserted on re-submission.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_reports_student_id
  ON public.ai_reports (student_id);

CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at
  ON public.ai_reports (generated_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- Students read only their own reports
CREATE POLICY "ai_reports: student reads own"
  ON public.ai_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Admins have full access (uses the non-recursive helper from migration 004)
CREATE POLICY "ai_reports: admin full access"
  ON public.ai_reports
  FOR ALL
  TO authenticated
  USING (public.requesting_user_is_admin());

-- =============================================================================
-- Done.
-- Verify: SELECT * FROM public.ai_reports LIMIT 5;
-- =============================================================================


-- ============================================================
-- 007_centum_index.sql
-- ============================================================

-- =============================================================================
-- Migration: 007_centum_index.sql
-- Adds Centum Index system: daily tests, learning nodes, and computed scores.
--
-- FK pattern: auth.users(id) — matches all existing migrations in this project.
-- Profiles table has no batch_id; calculate_centum_index uses active batch.
--
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Daily tests created by admin
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.daily_tests (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  batch_id        UUID        NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  test_date       DATE        NOT NULL,
  is_published    BOOLEAN     NOT NULL DEFAULT false,
  total_questions INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_tests_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.daily_tests IS
  'Admin-created daily test sessions linked to a batch. '
  'Separate from the exam/questions system — used for Centum Index attendance tracking.';

CREATE INDEX IF NOT EXISTS idx_daily_tests_batch_date
  ON public.daily_tests (batch_id, test_date);

-- ---------------------------------------------------------------------------
-- 2. Student test submissions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.test_submissions (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id         UUID        NOT NULL REFERENCES public.daily_tests(id) ON DELETE CASCADE,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score           INT         NOT NULL DEFAULT 0,
  total_questions INT         NOT NULL DEFAULT 0,
  CONSTRAINT test_submissions_pkey             PRIMARY KEY (id),
  CONSTRAINT test_submissions_user_test_unique UNIQUE (user_id, test_id)
);

COMMENT ON TABLE public.test_submissions IS
  'Student submissions for daily_tests. One submission per student per test.';

CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id
  ON public.test_submissions (user_id);

CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id
  ON public.test_submissions (test_id);

-- ---------------------------------------------------------------------------
-- 3. Learning nodes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nodes (
  id         UUID    NOT NULL DEFAULT uuid_generate_v4(),
  topic_id   UUID,
  node_type  TEXT    NOT NULL CHECK (node_type IN ('recognition','shortcut','trap','pyq','mastery')),
  title      TEXT    NOT NULL,
  content    JSONB   NOT NULL DEFAULT '{}',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT nodes_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.nodes IS
  'Learning nodes — individual study units assigned to students by batch date.';

CREATE INDEX IF NOT EXISTS idx_nodes_topic_id
  ON public.nodes (topic_id);

-- ---------------------------------------------------------------------------
-- 4. Node assignments to batches by date
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.node_assignments (
  id            UUID NOT NULL DEFAULT uuid_generate_v4(),
  batch_id      UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  node_id       UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  CONSTRAINT node_assignments_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.node_assignments IS
  'Assigns learning nodes to a batch on a specific date.';

CREATE INDEX IF NOT EXISTS idx_node_assignments_batch_date
  ON public.node_assignments (batch_id, assigned_date);

-- ---------------------------------------------------------------------------
-- 5. Student node progress
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.node_progress (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id      UUID        NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  visited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  CONSTRAINT node_progress_pkey            PRIMARY KEY (id),
  CONSTRAINT node_progress_user_node_unique UNIQUE (user_id, node_id)
);

COMMENT ON TABLE public.node_progress IS
  'Tracks individual student progress on each learning node.';

CREATE INDEX IF NOT EXISTS idx_node_progress_user_id
  ON public.node_progress (user_id);

-- ---------------------------------------------------------------------------
-- 6. MCQ attempts — first attempt accuracy tracking
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mcq_attempts (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id         UUID        NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL,
  attempt_number  INT         NOT NULL DEFAULT 1,
  selected_option TEXT,
  is_correct      BOOLEAN     NOT NULL DEFAULT false,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mcq_attempts_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.mcq_attempts IS
  'Records MCQ attempt history for first-attempt accuracy tracking in Centum Index.';

CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user_id
  ON public.mcq_attempts (user_id);

CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user_node
  ON public.mcq_attempts (user_id, node_id);

-- ---------------------------------------------------------------------------
-- 7. Computed Centum Index — upserted daily
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.centum_index_log (
  id                    UUID         NOT NULL DEFAULT uuid_generate_v4(),
  user_id               UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id              UUID         NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  calculated_date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  tests_conducted       INT          NOT NULL DEFAULT 0,
  tests_submitted       INT          NOT NULL DEFAULT 0,
  attendance_index      NUMERIC(5,2) NOT NULL DEFAULT 0,
  nodes_assigned        INT          NOT NULL DEFAULT 0,
  nodes_completed       INT          NOT NULL DEFAULT 0,
  node_completion_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  first_attempt_correct INT          NOT NULL DEFAULT 0,
  first_attempt_total   INT          NOT NULL DEFAULT 0,
  first_attempt_acc_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  node_index            NUMERIC(5,2) NOT NULL DEFAULT 0,
  centum_index          NUMERIC(5,2) NOT NULL DEFAULT 0,
  CONSTRAINT centum_index_log_pkey            PRIMARY KEY (id),
  CONSTRAINT centum_index_log_user_date_unique UNIQUE (user_id, calculated_date)
);

COMMENT ON TABLE public.centum_index_log IS
  'Daily snapshot of each student''s Centum Index. '
  'Upserted by calculate_centum_index(). One row per student per day.';

CREATE INDEX IF NOT EXISTS idx_centum_index_log_user_id
  ON public.centum_index_log (user_id);

CREATE INDEX IF NOT EXISTS idx_centum_index_log_date
  ON public.centum_index_log (calculated_date DESC);

CREATE INDEX IF NOT EXISTS idx_centum_index_log_batch_score
  ON public.centum_index_log (batch_id, centum_index DESC);

-- ---------------------------------------------------------------------------
-- 8. Postgres function — calculate and store Centum Index for one student
--
-- Uses the currently active batch (is_active = true) as the calculation scope.
-- Profiles table has no batch_id column; active batch is the canonical pivot.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_centum_index(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_batch_id    UUID;
  v_conducted   INT     := 0;
  v_submitted   INT     := 0;
  v_attendance  NUMERIC := 0;
  v_assigned    INT     := 0;
  v_completed   INT     := 0;
  v_completion  NUMERIC := 0;
  v_fa_total    INT     := 0;
  v_fa_correct  INT     := 0;
  v_accuracy    NUMERIC := 0;
  v_node_index  NUMERIC := 0;
  v_centum      NUMERIC := 0;
BEGIN
  -- Resolve active batch (one active batch at a time in CentuMania)
  SELECT id INTO v_batch_id
  FROM public.batches
  WHERE is_active = true
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active batch found');
  END IF;

  -- Attendance: tests published up to today vs student submissions
  SELECT COUNT(dt.id), COUNT(ts.id)
  INTO v_conducted, v_submitted
  FROM public.daily_tests dt
  LEFT JOIN public.test_submissions ts
    ON ts.test_id = dt.id AND ts.user_id = p_user_id
  WHERE dt.batch_id = v_batch_id
    AND dt.test_date <= CURRENT_DATE
    AND dt.is_published = true;

  IF v_conducted > 0 THEN
    v_attendance := ROUND((v_submitted::NUMERIC / v_conducted) * 100, 2);
  END IF;

  -- Node completion: assigned nodes up to today vs completed
  SELECT COUNT(na.id), COUNT(np.id) FILTER (WHERE np.is_completed = true)
  INTO v_assigned, v_completed
  FROM public.node_assignments na
  LEFT JOIN public.node_progress np
    ON np.node_id = na.node_id AND np.user_id = p_user_id
  WHERE na.batch_id = v_batch_id
    AND na.assigned_date <= CURRENT_DATE;

  IF v_assigned > 0 THEN
    v_completion := ROUND((v_completed::NUMERIC / v_assigned) * 100, 2);
  END IF;

  -- First attempt accuracy
  SELECT
    COUNT(*) FILTER (WHERE attempt_number = 1),
    COUNT(*) FILTER (WHERE attempt_number = 1 AND is_correct = true)
  INTO v_fa_total, v_fa_correct
  FROM public.mcq_attempts
  WHERE user_id = p_user_id;

  IF v_fa_total > 0 THEN
    v_accuracy := ROUND((v_fa_correct::NUMERIC / v_fa_total) * 100, 2);
  END IF;

  -- Composite scores
  v_node_index := ROUND((v_completion * v_accuracy) / 100, 2);
  v_centum     := ROUND((v_attendance * 0.60) + (v_node_index * 0.40), 2);

  -- Upsert
  INSERT INTO public.centum_index_log (
    user_id, batch_id, calculated_date,
    tests_conducted, tests_submitted, attendance_index,
    nodes_assigned, nodes_completed, node_completion_pct,
    first_attempt_correct, first_attempt_total, first_attempt_acc_pct,
    node_index, centum_index
  ) VALUES (
    p_user_id, v_batch_id, CURRENT_DATE,
    v_conducted, v_submitted, v_attendance,
    v_assigned, v_completed, v_completion,
    v_fa_correct, v_fa_total, v_accuracy,
    v_node_index, v_centum
  )
  ON CONFLICT (user_id, calculated_date) DO UPDATE SET
    batch_id              = EXCLUDED.batch_id,
    tests_conducted       = EXCLUDED.tests_conducted,
    tests_submitted       = EXCLUDED.tests_submitted,
    attendance_index      = EXCLUDED.attendance_index,
    nodes_assigned        = EXCLUDED.nodes_assigned,
    nodes_completed       = EXCLUDED.nodes_completed,
    node_completion_pct   = EXCLUDED.node_completion_pct,
    first_attempt_correct = EXCLUDED.first_attempt_correct,
    first_attempt_total   = EXCLUDED.first_attempt_total,
    first_attempt_acc_pct = EXCLUDED.first_attempt_acc_pct,
    node_index            = EXCLUDED.node_index,
    centum_index          = EXCLUDED.centum_index;

  RETURN jsonb_build_object(
    'centum_index',          v_centum,
    'attendance_index',      v_attendance,
    'node_index',            v_node_index,
    'tests_conducted',       v_conducted,
    'tests_submitted',       v_submitted,
    'nodes_assigned',        v_assigned,
    'nodes_completed',       v_completed,
    'first_attempt_acc_pct', v_accuracy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_centum_index(UUID) IS
  'Calculates and upserts the Centum Index for one student based on the active batch. '
  'Formula: Centum = Attendance×60% + NodeIndex×40%. '
  'NodeIndex = (NodeCompletion% × FirstAttemptAccuracy%) / 100.';

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.daily_tests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centum_index_log  ENABLE ROW LEVEL SECURITY;

-- daily_tests: students read published tests
CREATE POLICY "daily_tests: student reads published"
  ON public.daily_tests FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "daily_tests: admin full access"
  ON public.daily_tests FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- test_submissions: students read/write own
CREATE POLICY "test_submissions: student reads own"
  ON public.test_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "test_submissions: student inserts own"
  ON public.test_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "test_submissions: admin full access"
  ON public.test_submissions FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- nodes: students read active nodes
CREATE POLICY "nodes: student reads active"
  ON public.nodes FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "nodes: admin full access"
  ON public.nodes FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- node_assignments: students read
CREATE POLICY "node_assignments: student reads"
  ON public.node_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "node_assignments: admin full access"
  ON public.node_assignments FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- node_progress: students read/write own
CREATE POLICY "node_progress: student reads own"
  ON public.node_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "node_progress: student writes own"
  ON public.node_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "node_progress: student updates own"
  ON public.node_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "node_progress: admin full access"
  ON public.node_progress FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- mcq_attempts: students read/write own
CREATE POLICY "mcq_attempts: student reads own"
  ON public.mcq_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "mcq_attempts: student inserts own"
  ON public.mcq_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mcq_attempts: admin full access"
  ON public.mcq_attempts FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- centum_index_log: students read own
CREATE POLICY "centum_index_log: student reads own"
  ON public.centum_index_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "centum_index_log: admin full access"
  ON public.centum_index_log FOR ALL TO authenticated
  USING (public.requesting_user_is_admin());

-- =============================================================================
-- Done.
-- Verify: SELECT calculate_centum_index('<a-real-user-uuid>');
-- =============================================================================


-- ============================================================
-- 008_materials_html_url.sql
-- ============================================================

-- 008_materials_html_url.sql
-- Replace internal Supabase Storage HTML hosting with external URL links.
-- Admins now paste a hosted HTML URL instead of uploading files.

ALTER TABLE materials ADD COLUMN IF NOT EXISTS html_url TEXT;

COMMENT ON COLUMN materials.html_url IS 'Externally hosted HTML page URL. Students are redirected here after auth + subscription validation.';

-- Drop the old content check constraint (required html_key/video_url/pdf_key/ppt_key).
-- Replace with one that also accepts html_url as a valid content source.
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_has_content;

ALTER TABLE materials ADD CONSTRAINT materials_has_content CHECK (
  html_url IS NOT NULL
  OR html_key IS NOT NULL
  OR video_url IS NOT NULL
  OR pdf_key IS NOT NULL
  OR ppt_key IS NOT NULL
);


-- ============================================================
-- 009_admin_audit_log.sql
-- ============================================================

-- =============================================================================
-- Migration 009 — Admin Audit Log
--
-- Records every state-changing admin action. Provides forensic trail if an
-- admin account is compromised or actions are disputed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  admin_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  action      text        NOT NULL,   -- e.g. 'payment_verified', 'exam_created', 'student_deleted'
  target_id   uuid,                   -- ID of the affected resource (student, exam, material…)
  target_type text,                   -- 'profile' | 'exam' | 'material' | 'question' | etc.
  detail      jsonb,                  -- Optional extra context (before/after values, etc.)
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.admin_audit_log IS
  'Append-only log of admin actions. Never UPDATE or DELETE rows here.';

-- Index for admin-specific lookups and time-range queries
CREATE INDEX idx_audit_admin_id    ON public.admin_audit_log (admin_id);
CREATE INDEX idx_audit_created_at  ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_audit_target_id   ON public.admin_audit_log (target_id) WHERE target_id IS NOT NULL;

-- RLS: admins can read all rows; no-one can insert from client (server-side only via service role)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit: admins read all"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.requesting_user_is_admin());

-- No INSERT/UPDATE/DELETE policies — all writes via service role key from API routes only.


-- ============================================================
-- 010_materials_multi_per_day.sql
-- ============================================================

-- 010_materials_multi_per_day.sql
-- Allow multiple study materials per day number.
-- The old unique(day_number) constraint prevented more than one material per day.
-- Dropping it lets admins publish multiple resources (e.g. two PDFs, a PDF + URL) for the same day.

ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_day_number_key;


-- ============================================================
-- 011_drop_materials_batch_day_unique.sql
-- ============================================================

-- 011_drop_materials_batch_day_unique.sql
-- Allow multiple study materials per day per batch.
-- Migration 010 dropped materials_day_number_key (global uniqueness) but the live DB
-- has a per-batch unique index idx_materials_batch_day (created in 003) and possibly
-- a named constraint materials_day_per_batch_key. Drop both so admins can publish
-- multiple resources for the same day (e.g. notes URL + practice URL + PDF).

DROP INDEX IF EXISTS idx_materials_batch_day;
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_day_per_batch_key;


-- ============================================================
-- 012_fix_profile_phone_trigger.sql
-- ============================================================

-- =============================================================================
-- Migration: 012_fix_profile_phone_trigger.sql
--
-- FIX: handle_new_user() trigger was not saving phone from user_metadata.
-- All students registered after this migration will have phone saved.
-- Back-fills existing profiles from auth.users.raw_user_meta_data.
-- =============================================================================

-- Update the trigger function to also capture phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Back-fill phone for all existing students who registered via the register form
-- (their phone is in auth.users.raw_user_meta_data but was never copied to profiles)
UPDATE public.profiles p
SET phone = u.raw_user_meta_data->>'phone'
FROM auth.users u
WHERE p.id = u.id
  AND p.phone IS NULL
  AND u.raw_user_meta_data->>'phone' IS NOT NULL
  AND u.raw_user_meta_data->>'phone' ~ '^[6-9][0-9]{9}$';


-- ============================================================
-- 013_analytics_events.sql
-- ============================================================

-- =============================================================================
-- Migration: 013_analytics_events.sql
--
-- Adds the analytics_events table for Phase 1 event collection.
-- ADDITIVE ONLY — zero changes to any existing table.
-- Reversible: DROP TABLE IF EXISTS public.analytics_events CASCADE;
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  event_id        UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,
  event_name      TEXT        NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT analytics_events_pkey PRIMARY KEY (event_id),
  CONSTRAINT analytics_events_name_check CHECK (
    event_name IN (
      'login',
      'material_opened',
      'daily_material_completed',
      'node_opened',
      'node_completed',
      'mcq_started',
      'mcq_completed'
    )
  )
);

COMMENT ON TABLE public.analytics_events IS
  'Append-only event log. Phase 1 of analytics system. '
  'Never read by students — admin SELECT only. '
  'Feeds Phase 4 aggregation jobs.';

-- Per-student time-ordered queries (most common)
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time
  ON public.analytics_events (user_id, event_timestamp DESC);

-- Funnel / event-type queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON public.analytics_events (event_name, event_timestamp DESC);

-- Session grouping
CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON public.analytics_events (session_id)
  WHERE session_id IS NOT NULL;

-- JSONB field queries (future phases)
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata_gin
  ON public.analytics_events USING GIN (metadata)
  WHERE metadata IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Note: server-side inserts use getSupabaseAdminClient() (service role),
-- which bypasses RLS. The INSERT policy below guards direct client inserts only.
-- Auth is enforced at the API layer (/api/events route) before any insert.

-- Students INSERT their own events only
CREATE POLICY "analytics_events: student inserts own"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Students cannot read any events (privacy by default)
-- Admins see all
CREATE POLICY "analytics_events: admin reads all"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.requesting_user_is_admin());

CREATE POLICY "analytics_events: admin deletes"
  ON public.analytics_events FOR DELETE TO authenticated
  USING (public.requesting_user_is_admin());

-- Append-only: nobody may update events after insertion
CREATE POLICY "analytics_events: no updates"
  ON public.analytics_events FOR UPDATE TO authenticated
  USING (false);


