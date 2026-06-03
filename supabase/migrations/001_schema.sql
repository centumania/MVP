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
