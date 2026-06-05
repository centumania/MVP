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
