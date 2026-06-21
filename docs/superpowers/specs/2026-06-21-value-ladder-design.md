# Value Ladder — Design Spec
**Date:** 2026-06-21  
**Status:** Approved by user  
**Reversibility:** Full — git tag + rollback migration + env flag

---

## Scope

Add the first three rungs of the Dan Martell value ladder to CentuMania **without touching** the existing batch, exam, leaderboard, Centum Index, materials, or admin logic.

Out of scope (deferred): CentuPods, separate challenge leaderboard, payment gateway automation.

---

## What Gets Built

### 1. Free 7-Day Discipline Challenge
- New users can register at `/auth/register?mode=challenge`
- On registration: `trial_ends_at = now() + 7 days`, `subscription_tier = 'trial'`, `referral_code` auto-generated
- Access rule: `payment_verified = true OR (trial_ends_at IS NOT NULL AND trial_ends_at > now())`
- Trial users see the first 7 exams of the active batch (exam API enforces this: `day_number <= 7` for trial)
- Dashboard shows a trial banner: "Day X of 7 — Upgrade to keep going →"
- After 7 days: trial expires, user sees upgrade prompt instead of dashboard

### 2. ₹299 Sprint / ₹999 Cohort / ₹10,000 Annual — Tier Labels
- `subscription_tier` tracks which product the student paid for: `'sprint' | 'cohort' | 'annual'`
- `access_until` tracks expiry: sprint = 15 days from payment_verified, annual = 365 days, cohort = null (unlimited for batch duration)
- Admin sets tier + access_until when verifying payment (new dropdown in admin student detail)
- Dashboard shows tier badge next to student name
- No functional change to existing `payment_verified` gate — tier is cosmetic + informational for now

### 3. Referral / Centu Credits
- Every registered user gets a unique `referral_code` (format: `CM-XXXX`, 4 alphanum chars)
- Registration URL: `centumania.co.in/auth/register?ref=CM-XXXX` stores `referred_by = 'CM-XXXX'`
- When admin verifies a referred user's payment: referrer's `centu_credits += 1` (= ₹50 value)
- Credits are NOT auto-applied — admin sees balance and manually discounts payment
- Dashboard: "Invite friends" card shows shareable link + credits balance ("2 credits = ₹100 off")
- Admin student detail: shows centu_credits balance

### 4. Landing Page Pricing Section
- Add a 4-tier pricing grid to the landing page: Free (7-day) / Sprint ₹299 / Cohort ₹999 / Annual ₹10,000
- Each tier has a CTA button linking to the appropriate registration URL
- The challenge tier is most prominent (top-of-funnel)

---

## Database Migration

### 022_value_ladder.sql (forward)
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at       timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_tier   text NOT NULL DEFAULT 'none'
    CONSTRAINT profiles_sub_tier_check CHECK (subscription_tier IN ('none','trial','sprint','cohort','annual')),
  ADD COLUMN IF NOT EXISTS access_until        date,
  ADD COLUMN IF NOT EXISTS referral_code       text,
  ADD COLUMN IF NOT EXISTS referred_by         text,
  ADD COLUMN IF NOT EXISTS centu_credits       integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;
```

### 022_rollback.sql (reverse — run in Supabase SQL editor to undo)
```sql
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS trial_ends_at,
  DROP COLUMN IF EXISTS subscription_tier,
  DROP COLUMN IF EXISTS access_until,
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by,
  DROP COLUMN IF EXISTS centu_credits;

DROP INDEX IF EXISTS profiles_referral_code_key;
```

---

## Access Control Change

**Env flag:** `ENABLE_FREE_TRIAL=true` in `.env.local` / Vercel env vars  
If the flag is absent or false, all existing behavior is unchanged.

**Helper function** (new file: `src/lib/access.ts`):
```typescript
export function hasAccess(profile: { payment_verified: boolean; trial_ends_at: string | null }): boolean {
  if (profile.payment_verified) return true
  if (process.env.ENABLE_FREE_TRIAL !== 'true') return false
  if (!profile.trial_ends_at) return false
  return new Date(profile.trial_ends_at) > new Date()
}
```

**Files that check `payment_verified` and need the helper:**
- `src/app/api/dashboard/route.ts` — replace `!profile.payment_verified` check
- `src/app/api/exam/[day]/route.ts` — replace `!profile.payment_verified` check  
- `src/app/api/materials/route.ts` — replace `!isPaid` check

Trial users in exam route also get an additional guard: `day_number <= 7`.

---

## Files Created / Modified

| File | Action | Risk |
|------|--------|------|
| `supabase/migrations/022_value_ladder.sql` | New | None (additive) |
| `supabase/migrations/022_rollback.sql` | New | None |
| `src/lib/access.ts` | New | None |
| `src/types/database.ts` | Modify | Low — add 6 fields to Profile type |
| `src/app/api/dashboard/route.ts` | Modify | Low — one condition change, flag-gated |
| `src/app/api/exam/[day]/route.ts` | Modify | Low — one condition change, flag-gated |
| `src/app/api/materials/route.ts` | Modify | Low — one condition change, flag-gated |
| `src/app/api/auth/register/route.ts` | Modify | Low — handle `mode=challenge` + `ref=` params |
| `src/components/landing/LandingPage.tsx` | Modify | Low — add pricing section |
| `src/app/dashboard/page.tsx` | Modify | Low — add trial banner + referral card (flag-gated) |
| `src/app/admin/students/[id]/page.tsx` | Modify | Low — add tier dropdown + credits display |

Total: 3 new files, 8 modified files.

---

## Referral Code Generation

Auto-generated at registration for all users (not just challenge users):
```typescript
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  return 'CM-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

Collision handled by retry on unique constraint violation (rare with 4-char alphanum = 32^4 = 1M combinations).

---

## Revert Instructions

```bash
# Full code revert:
git reset --hard revert-point-before-value-ladder

# DB revert (run in Supabase SQL editor):
# paste contents of supabase/migrations/022_rollback.sql

# Vercel: remove ENABLE_FREE_TRIAL env var
```

---

## What Is NOT Changed

- `batches` table — untouched
- `exams`, `questions`, `submissions` — untouched  
- `leaderboard` view — untouched
- `centum_index_log`, `calculate_centum_index` — untouched
- `materials`, `ai_reports` — untouched
- Auth session handling — untouched
- Admin panel layout, sidebar, stats page — untouched
