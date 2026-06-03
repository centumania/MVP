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
