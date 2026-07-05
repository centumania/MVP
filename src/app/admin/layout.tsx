'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { setCachedToken } from '@/src/lib/analytics/track'
import Logo from '@/src/components/landing-v2/Logo'

const NAV = [
  { href: '/admin',           label: 'Overview',  icon: GridIcon    },
  { href: '/admin/students',  label: 'Students',  icon: UsersIcon   },
  { href: '/admin/exams',     label: 'Exams',     icon: PencilIcon  },
  { href: '/admin/centum',    label: 'Centum',    icon: TrendingIcon },
  { href: '/admin/materials', label: 'Materials', icon: BookIcon    },
  { href: '/admin/payments',  label: 'Payments',  icon: CheckIcon   },
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
function TrendingIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
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

function NavContent({
  pathname,
  adminName,
  onNavClick,
  onLogout,
}: {
  pathname: string
  adminName: string
  onNavClick: () => void
  onLogout: () => void
}) {
  const initials = adminName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <>
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-sm font-bold tracking-tight text-text">CentuMania</span>
        </div>
        <p className="text-[10px] text-text-muted leading-none mt-2 pl-0.5">Admin Console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              onClick={onNavClick}
              className={`flex items-center gap-2.5 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${
                active ? 'text-primary font-medium' : 'text-text-muted hover:text-text-secondary'
              }`}
              style={active ? { background: 'rgba(2,132,199,0.08)' } : {}}>
              <Icon active={active} />
              {label}
            </Link>
          )
        })}

        <div className="pt-2 mt-2" style={{ borderTop: '1px solid #E5E7EB' }}>
          <Link href="/dashboard"
            onClick={onNavClick}
            className="flex items-center gap-2.5 px-3 py-3 md:py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors">
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
      <div className="px-2 py-3" style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center shrink-0"
            style={{ background: 'rgba(2,132,199,0.15)', color: '#0284c7' }}>
            {initials}
          </div>
          <p className="text-sm text-text-secondary truncate font-medium">{adminName}</p>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-3 md:py-2 w-full rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checking,   setChecking]   = useState(true)
  const [adminName,  setAdminName]  = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) document.body.classList.add('overflow-hidden')
    else            document.body.classList.remove('overflow-hidden')
    return ()      => document.body.classList.remove('overflow-hidden')
  }, [drawerOpen])

  useEffect(() => {
    let cancelled = false
    async function checkAdmin() {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.status === 401) { router.replace('/auth/login'); return }
        if (res.status === 403) { router.replace('/dashboard');  return }
        if (!res.ok)            { router.replace('/dashboard');  return }

        setAdminName(
          session.user.user_metadata?.name ??
          session.user.email?.split('@')[0] ??
          'Admin'
        )
        setChecking(false)
      } catch {
        if (!cancelled) router.replace('/dashboard')
      }
    }
    checkAdmin()
    return () => { cancelled = true }
  }, [router])

  async function handleLogout() {
    setCachedToken(null)
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <div className="w-5 h-5 rounded-full animate-spin"
          style={{ border: '2px solid rgba(2,132,199,0.2)', borderTopColor: '#0284c7' }} />
      </div>
    )
  }

  const currentLabel = NAV.find(n =>
    n.href === '/admin' ? pathname === n.href : pathname.startsWith(n.href)
  )?.label ?? 'Admin'

  return (
    <div className="flex min-h-screen" style={{ background: '#FFFFFF' }}>

      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 z-20"
        aria-label="Admin panel"
        style={{ background: '#FFFFFF', borderRight: '1px solid #E5E7EB' }}>
        <NavContent
          pathname={pathname}
          adminName={adminName}
          onNavClick={() => {}}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Drawer overlay ─────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────────── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-72 z-50 flex flex-col drawer-slide ${drawerOpen ? 'open' : ''}`}
        aria-label="Admin panel"
        aria-hidden={!drawerOpen}
        style={{ background: '#FFFFFF', borderRight: '1px solid #E5E7EB', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <NavContent
          pathname={pathname}
          adminName={adminName}
          onNavClick={() => setDrawerOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-56" style={{ background: '#F8FAFC' }}>

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #E5E7EB',
            paddingTop: 'env(safe-area-inset-top)',
          }}>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'rgba(17,24,39,0.04)', border: '1px solid #E5E7EB' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text" style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
              {currentLabel}
            </p>
            <p className="text-[10px] text-text-muted font-mono">Admin Console</p>
          </div>
          <Logo size={26} />
        </header>

        <main id="main-content" className="flex-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
