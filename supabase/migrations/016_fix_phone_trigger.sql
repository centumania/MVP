-- =============================================================================
-- Migration: 016_fix_phone_trigger.sql
--
-- FIX M-2: handle_new_user() trigger inserted phone metadata directly into
-- profiles.phone without validating the format. If an admin creates a user in
-- the Supabase Dashboard with a non-Indian phone (or no phone), the trigger
-- would fail the CHECK constraint and roll back the entire user creation —
-- leaving the user in auth.users with no profiles row and a broken app session.
--
-- Fix: validate the phone against the regex before inserting; use NULL if invalid.
-- =============================================================================

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
    CASE
      WHEN NEW.raw_user_meta_data->>'phone' ~ '^[6-9][0-9]{9}$'
      THEN NEW.raw_user_meta_data->>'phone'
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;
