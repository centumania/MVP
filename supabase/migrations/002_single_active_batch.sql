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
