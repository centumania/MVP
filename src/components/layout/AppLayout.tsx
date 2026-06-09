'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { LogoMark } from '@/src/components/ui/Logo'

// ── Icons ──────────────────────────────────────────────────────────
function IcoDashboard({ a }: { a: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IcoExam({ a }: { a: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="2"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="12" y2="16"/>
    </svg>
  )
}
function IcoBook({ a }: { a: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}
function IcoLeaderboard({ a }: { a: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  )
}
function IcoProfile({ a }: { a: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',    Icon: IcoDashboard   },
  { href: '/exam/today',  label: "Today's Exam",  Icon: IcoExam        },
  { href: '/materials',   label: 'Materials',     Icon: IcoBook        },
  { href: '/leaderboard', label: 'Leaderboard',   Icon: IcoLeaderboard },
  { href: '/profile',     label: 'Profile',       Icon: IcoProfile     },
] as const


// ── AppLayout ──────────────────────────────────────────────────────
export function AppLayout({ children, userName, batchName }: {
  children: React.ReactNode
  userName?: string
  batchName?: string
}) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  const initials = userName
    ?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-20"
        aria-label="Main navigation"
        style={{ width: 228, background: '#0e1410', borderRight: '1px solid #27342b' }}>

        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #27342b' }}>
          <div className="flex items-center gap-3">
            <div className="shrink-0" style={{ filter: 'drop-shadow(0 0 8px rgba(111,207,143,0.4))' }}>
              <LogoMark size={26} />
            </div>
            <div>
              <p className="text-sm font-bold text-text tracking-tight" style={{ fontFamily: 'var(--font-fraunces, serif)' }}>
                CentuMania
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 tracking-wide font-mono">
                {batchName ?? 'Winning is a Habit'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative',
                  active
                    ? 'text-primary font-medium'
                    : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
                style={active ? { background: 'rgba(111,207,143,0.08)' } : {}}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: '#6fcf8f', boxShadow: '0 0 8px rgba(111,207,143,0.8)' }} />
                )}
                <Icon a={active} />
                <span className="tracking-tight">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid #27342b' }}>
          {userName && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#6fcf8f,#3fae6a)', color: '#06140c', boxShadow: '0 0 10px rgba(111,207,143,0.30)' }}>
                {initials}
              </div>
              <p className="text-xs font-medium text-text-secondary truncate">{userName}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-xs text-text-muted hover:text-text-secondary transition-colors"
            style={{}}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <style>{`@media(min-width:768px){.main-shift{margin-left:228px}}`}</style>
        <div className="main-shift flex-1 flex flex-col min-h-screen">

          {/* Mobile Top Bar */}
          <header className="md:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-10"
            style={{ background: 'rgba(14,20,16,0.95)', backdropFilter: 'blur(6px)', borderBottom: '1px solid #27342b' }}>
            <div className="flex items-center gap-2.5">
              <div style={{ filter: 'drop-shadow(0 0 6px rgba(111,207,143,0.5))' }}>
                <LogoMark size={22} />
              </div>
              <div>
                <span className="text-sm font-bold text-text tracking-tight block" style={{ fontFamily: 'var(--font-fraunces, serif)' }}>
                  CentuMania
                </span>
                <span className="text-[9px] text-text-muted font-mono tracking-wide leading-none">
                  Winning is a Habit
                </span>
              </div>
            </div>
            {userName && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#6fcf8f,#3fae6a)', color: '#06140c', boxShadow: '0 0 10px rgba(111,207,143,0.30)' }}>
                {initials}
              </div>
            )}
          </header>

          {/* Page Content */}
          <main id="main-content" className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex"
        aria-label="Mobile navigation"
        style={{ background: 'rgba(14,20,16,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #27342b' }}>
        {NAV.slice(0, 4).map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
                active ? 'text-primary' : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              <Icon a={active} />
              <span className="text-[9px] font-semibold tracking-widest uppercase">
                {label.split("'")[0].split(' ')[0]}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
