'use client'

/**
 * Admin Layout
 *
 * Auth strategy (production-safe):
 *  1. Get the session JWT from the browser Supabase singleton.
 *  2. Call /api/admin/stats — this runs requireAdmin() server-side using the
 *     SERVICE ROLE key (bypasses RLS entirely). 200 = admin, 401/403 = not.
 *
 * We deliberately DO NOT query `profiles` from the browser client because the
 * basic @supabase/supabase-js client doesn't guarantee the auth JWT is attached
 * to table queries until GoTrue finishes async initialisation.
 */

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { LogoMark } from '@/src/components/ui/Logo'

const NAV = [
  { href: '/admin',           label: 'Overview',  icon: GridIcon   },
  { href: '/admin/students',  label: 'Students',  icon: UsersIcon  },
  { href: '/admin/exams',     label: 'Exams',     icon: PencilIcon },
  { href: '/admin/materials', label: 'Materials', icon: BookIcon   },
  { href: '/admin/payments',  label: 'Payments',  icon: CheckIcon  },
] as const

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1"/>
      <rect x="14" y="3"  width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3"  y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function PencilIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  )
}
function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}
function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checking,  setChecking]  = useState(true)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    let cancelled = false

    async function checkAdmin() {
      const supabase = getSupabaseBrowserClient()

      // 1. Get session from browser cache (instant — no network)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      // 2. Verify admin server-side via API (uses service role key → bypasses RLS)
      //    requireAdmin() validates the JWT and checks is_admin from the DB.
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          // Prevent stale cache from hiding a revoked session
          cache: 'no-store',
        })

        if (cancelled) return

        if (res.status === 401) { router.replace('/auth/login'); return }
        if (res.status === 403) { router.replace('/dashboard');  return }
        if (!res.ok)            { router.replace('/dashboard');  return }

        // Admin confirmed — derive display name from the JWT user metadata
        const displayName =
          session.user.user_metadata?.name ??
          session.user.email?.split('@')[0] ??
          'Admin'

        setAdminName(displayName)
        setChecking(false)
      } catch {
        if (!cancelled) router.replace('/dashboard')
      }
    }

    checkAdmin()
    return () => { cancelled = true }
  }, [router])

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1410' }}>
        <div className="w-5 h-5 rounded-full animate-spin"
          style={{ border: '2px solid rgba(111,207,143,0.2)', borderTopColor: '#6fcf8f' }} />
      </div>
    )
  }

  const initials = adminName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex min-h-screen" style={{ background: '#0e1410' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-20"
        aria-label="Admin panel"
        style={{ background: '#0e1410', borderRight: '1px solid #27342b' }}>

        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: '1px solid #27342b' }}>
          <div className="flex items-center gap-2.5">
            <div className="shrink-0" style={{ filter: 'drop-shadow(0 0 6px rgba(111,207,143,0.4))' }}>
              <LogoMark size={26} />
            </div>
            <div>
              <span className="text-sm font-semibold text-text"
                style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
                CentuMania
              </span>
              <p className="text-[10px] text-text-muted leading-none mt-0.5 font-mono">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? 'text-primary font-medium' : 'text-text-muted hover:text-text-secondary'
                }`}
                style={active ? { background: 'rgba(111,207,143,0.08)' } : {}}>
                <Icon active={active} />
                {label}
              </Link>
            )
          })}

          <div className="pt-2 mt-2" style={{ borderTop: '1px solid #27342b' }}>
            <Link href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Student view
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div className="px-2 py-3" style={{ borderTop: '1px solid #27342b' }}>
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(111,207,143,0.15)', color: '#6fcf8f' }}>
              {initials}
            </div>
            <p className="text-sm text-text-secondary truncate font-medium">{adminName}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 min-h-screen" style={{ marginLeft: 224, background: '#141d17' }}>
        {children}
      </main>
    </div>
  )
}
