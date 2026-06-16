-- =============================================================================
-- MIGRATION 020: daily_test_scores + study_leaderboard
--
-- Adds the study-quiz scoring system. Completely separate from the formal-exam
-- public.leaderboard — do not union these two.
-- =============================================================================


-- =============================================================================
-- TEST DATA — uncomment block, run in Supabase SQL editor, verify, re-comment.
-- Never leave this uncommented in a production deploy.
-- =============================================================================
/*
-- Replace the three UUIDs below with real auth.users IDs from your Supabase
-- dashboard (Authentication > Users). The inserts fail harmlessly if the IDs
-- don't exist because of the FK reference to auth.users.

insert into public.profiles (id, name, email, phone, payment_verified, is_admin)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Arjun Nair',     'arjun@test.invalid',   '9876543210', true, false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Priya Menon',    'priya@test.invalid',   '9876543211', true, false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Rahul Krishnan', 'rahul@test.invalid',   '9876543212', true, false)
on conflict (id) do nothing;

-- One fake material (html_url required to satisfy materials_has_content check)
insert into public.materials (id, batch_id, day_number, title, html_url, published_at, expires_at)
values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  (select id from public.batches where is_active = true limit 1),
  99,
  'Test Material (seed only)',
  'https://example.invalid/bio-map.html',
  now() - interval '10 days',
  now() + interval '1 year'
)
on conflict (id) do nothing;

-- Five days of scores (Rahul missed 2026-06-14 — tests absent-student logic)
insert into public.daily_test_scores
  (user_id, material_id, test_date, score, total, in_morning_window, time_taken_s)
values
  -- Arjun: 90 / 100 total, 5 days, 90.0% accuracy
  ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','2026-06-11',18,20,true, 310),
  ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','2026-06-12',16,20,true, 290),
  ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','2026-06-13',19,20,false,340),
  ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','2026-06-14',17,20,true, 305),
  ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','2026-06-15',20,20,true, 280),
  -- Priya: 77 / 100 total, 5 days, 77.0% accuracy
  ('aaaaaaaa-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','2026-06-11',15,20,true, 400),
  ('aaaaaaaa-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','2026-06-12',14,20,false,420),
  ('aaaaaaaa-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','2026-06-13',16,20,true, 390),
  ('aaaaaaaa-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','2026-06-14',15,20,true, 410),
  ('aaaaaaaa-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','2026-06-15',17,20,true, 380),
  -- Rahul: 77 / 80 total, 4 days, 96.3% accuracy (missed 2026-06-14)
  ('aaaaaaaa-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000001','2026-06-11',20,20,true, 250),
  ('aaaaaaaa-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000001','2026-06-12',19,20,true, 260),
  ('aaaaaaaa-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000001','2026-06-13',18,20,true, 270),
  ('aaaaaaaa-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000001','2026-06-15',20,20,true, 245);
*/


-- =============================================================================
-- VALIDATION QUERY — paste into SQL editor after seeding to confirm math.
-- Expected:  Arjun rank 1 (score 90, 5 days, 90.0%)
--            Priya rank 2 (score 77, 5 days, 77.0%)
--            Rahul rank 3 (score 77, 4 days, 96.3%)
-- Tiebreak: Priya beats Rahul on days_attended (5 > 4) despite equal total_score.
-- =============================================================================
/*
select name, total_score, days_attended, accuracy_percent, rank
from   public.study_leaderboard
order  by rank;
*/


-- =============================================================================
-- TABLE: daily_test_scores
-- =============================================================================

create table public.daily_test_scores (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  material_id       uuid        not null references public.materials(id),
  test_date         date        not null,
  score             smallint    not null check (score >= 0),
  total             smallint    not null check (total > 0 and total <= 200),
  in_morning_window boolean     not null,
  time_taken_s      integer,
  submitted_at      timestamptz not null default now(),

  -- Deliberately (user_id, test_date) only — not (user_id, material_id, test_date).
  -- One daily-test slot per student per IST calendar day, regardless of which material.
  constraint daily_test_scores_one_per_day unique (user_id, test_date)
);

comment on table  public.daily_test_scores is
  'One study-quiz submission per student per IST calendar day. '
  'Separate from formal exam submissions — do not union with public.submissions.';

comment on column public.daily_test_scores.test_date is
  'IST calendar date. Computed server-side (UTC + IST offset). Client never supplies this.';

comment on column public.daily_test_scores.in_morning_window is
  'True if IST wall-clock time at submission is 06:00:00 ≤ t < 08:30:00. '
  'Computed server-side. Label only — never a submission gate.';

create index idx_dts_user_id    on public.daily_test_scores (user_id);
create index idx_dts_test_date  on public.daily_test_scores (test_date desc);
create index idx_dts_leaderboard on public.daily_test_scores (user_id, score);


-- =============================================================================
-- RLS
-- =============================================================================

alter table public.daily_test_scores enable row level security;

-- Authenticated student: insert their own row only
create policy "dts: student insert own"
  on public.daily_test_scores
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Authenticated student: read their own row only
create policy "dts: student read own"
  on public.daily_test_scores
  for select
  to authenticated
  using (user_id = auth.uid());

-- Admin access via service-role key bypasses RLS entirely — no extra policy needed.
-- Anon key: zero access — no anon policy defined on this table.


-- =============================================================================
-- VIEW: study_leaderboard
--
-- user_id is included so the API can look up the requesting user's own rank
-- without a second table scan. The API strips user_id before responding to
-- clients — students never receive other users' IDs.
-- =============================================================================

create or replace view public.study_leaderboard as
  select
    p.id                                                                as user_id,
    p.name,
    p.tier,
    coalesce(sum(d.score), 0)                                           as total_score,
    count(d.id)                                                         as days_attended,
    case
      when sum(d.total) = 0 then 0
      else round((sum(d.score)::numeric / sum(d.total)::numeric) * 100, 1)
    end                                                                 as accuracy_percent,
    rank() over (
      order by coalesce(sum(d.score), 0) desc,
               count(d.id) desc
    )                                                                   as rank
  from public.profiles p
  left join public.daily_test_scores d on d.user_id = p.id
  where p.payment_verified = true
    and p.is_admin         = false
  group by p.id, p.name, p.tier;

comment on view public.study_leaderboard is
  'Cumulative study-quiz rankings. All submissions count regardless of in_morning_window. '
  'Separate from formal-exam public.leaderboard — never union these two.';

-- Authenticated users may SELECT; the API controls what fields reach the client.
grant select on public.study_leaderboard to authenticated;


-- =============================================================================
-- CASHBACK ELIGIBILITY SAMPLE — out of scope, do not wire
-- When cashback rules are finalized, run this query to check eligibility.
-- =============================================================================
/*
select
  p.id                                                   as user_id,
  p.name,
  count(*) filter (where d.in_morning_window = true)     as morning_days,
  count(*)                                               as total_days
from  public.profiles p
join  public.daily_test_scores d on d.user_id = p.id
where p.payment_verified = true
group by p.id, p.name
order by morning_days desc;
*/
