/**
 * Supabase Server Clients
 *
 * Two clients:
 *  1. getSupabaseServerClient() — anon key, respects RLS. Use in Server Components and GET routes.
 *  2. getSupabaseAdminClient() — service role key, bypasses RLS. Use ONLY in:
 *       - Razorpay webhook (marking payment_verified)
 *       - Admin API routes (is_admin guard required in route logic)
 *       - Score calculation route (server-side, after auth check)
 *
 * NEVER import getSupabaseAdminClient() in Client Components.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// --- Anon client (RLS enforced) ---
// Safe for Server Components and API routes that verify auth manually.
export function getSupabaseServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// --- Authenticated client (RLS enforced with user's JWT) ---
// Creates a client that sets the user's JWT as the Authorization header.
// auth.uid() evaluates to the verified user — RLS policies work correctly.
// Use this in API routes after verifying the token server-side.
export function getSupabaseAuthenticatedClient(accessToken: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  })
}

// --- Admin client (RLS bypassed) ---
// Use ONLY in trusted server-side contexts. Guard every usage with is_admin check or webhook secret.
export function getSupabaseAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — do not call admin client without it')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
