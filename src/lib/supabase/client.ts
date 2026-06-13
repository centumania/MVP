/**
 * Supabase Browser Client
 *
 * Use this in Client Components ('use client') only.
 * Singleton pattern — one instance per browser session.
 * Uses the public ANON key — RLS enforces access control.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

// ── Session persistence preference ───────────────────────────────────────────
// Written by the login page before sign-in. Controls where auth tokens are stored:
//   'true'  → localStorage  (survives browser close — "Keep me signed in")
//   'false' → sessionStorage (cleared when tab closes)
const KEEP_KEY = 'cm:keep'

export function setKeepSignedIn(keep: boolean) {
  try { localStorage.setItem(KEEP_KEY, keep ? 'true' : 'false') } catch { /* private browsing */ }
}

// Custom storage adapter — reads from both stores on get (handles migration),
// writes to whichever the user chose, clears the other.
function makeAuthStorage() {
  return {
    getItem(key: string): string | null {
      try {
        return sessionStorage.getItem(key) ?? localStorage.getItem(key)
      } catch { return null }
    },
    setItem(key: string, value: string): void {
      try {
        const keep = localStorage.getItem(KEEP_KEY) !== 'false'
        if (keep) {
          localStorage.setItem(key, value)
          sessionStorage.removeItem(key)
        } else {
          sessionStorage.setItem(key, value)
          localStorage.removeItem(key)
        }
      } catch { /* private browsing — silently ignore */ }
    },
    removeItem(key: string): void {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch { /* ignore */ }
    },
  }
}

// Singleton — prevents multiple GoTrue instances in the browser
let browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? makeAuthStorage() : undefined,
    },
  })

  return browserClient
}
