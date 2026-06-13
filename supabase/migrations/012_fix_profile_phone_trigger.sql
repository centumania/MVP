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
