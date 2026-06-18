-- 020_profiles_registration_number.sql
-- Adds the registration_number column to profiles.
-- This was referenced in code (api/materials/status, api/auth/register)
-- but the column was never created in the database.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_number TEXT UNIQUE;

COMMENT ON COLUMN public.profiles.registration_number IS
  'Auto-assigned on registration: CM2026001, CM2026002, … Null for legacy accounts created before this column existed.';
