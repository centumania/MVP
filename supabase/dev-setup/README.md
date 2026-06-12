# Dev Environment Setup

## Purpose

This folder contains everything needed to set up a **development Supabase project**
so local testing never affects the live production site (centumania.co.in).

## One-time setup (15 minutes)

### Step 1 — Create a new Supabase project

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Name it `centumania-dev`
4. Choose the same region as your production project (ap-south-1 / Singapore)
5. Set a database password and save it somewhere safe
6. Wait ~2 minutes for it to provision

### Step 2 — Run the migrations

1. In the new project, go to **SQL Editor**
2. Open `supabase/dev-setup/all-migrations.sql` from this repo
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run**
5. Expected: "Success. No rows returned." (or similar — no red errors)

### Step 3 — Get the dev project credentials

In the new project, go to **Project Settings → API**:
- Copy **Project URL**
- Copy **anon / public** key
- Copy **service_role** key (under "Secret")

### Step 4 — Update .env.local

Replace the three Supabase values in `.env.local` with the dev project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<dev-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-role-key>
```

Leave everything else (UPSTASH, ANTHROPIC_API_KEY) the same.

### Step 5 — Create a dev admin user

In the dev project's **Authentication → Users** tab:
- Create a new user with your email
- In the **SQL Editor**, promote them to admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Done

From now on:
- `localhost:3000` → dev project (safe to test, upload, break things)
- `centumania.co.in` → production project (real students, untouched)

## When you deploy a real change

After testing locally, update the **production** Supabase project manually:
- New migrations: run in the production project's SQL Editor
- The code deploy (Vercel/Netlify): uses the production env vars already set there

## Production credentials backup

Stored in `.env.production.backup` — keep this file safe and NEVER commit it.
