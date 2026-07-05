'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import Logo from '@/src/components/landing-v2/Logo'
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { active?: boolean }
function Ico({ active, children, ...p }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.1 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {children}
    </svg>
  )
}
const IcoDashboard = (p: IconProps) => <Ico {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></Ico>
const IcoExam      = (p: IconProps) => <Ico {...p}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></Ico>
const IcoBook      = (p: IconProps) => <Ico {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Ico>
const IcoRanks     = (p: IconProps) => <Ico {...p}><path d="M18 20V10M12 20V4M6 20v-6"/></Ico>
const IcoInsights  = (p: IconProps) => <Ico {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></Ico>
const IcoProfile   = (p: IconProps) => <Ico {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>
const IcoOut       = (p: IconProps) => <Ico {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',    short: 'Home',  Icon: IcoDashboard, highlight: false, mobile: true  },
  { href: '/materials',   label: 'Materials',    short: 'Study', Icon: IcoBook,      highlight: true,  mobile: true  },
  { href: '/exam/today',  label: "Today's Exam", short: 'Exam',  Icon: IcoExam,      highlight: false, mobile: true  },
  { href: '/insights',    label: 'AI Insights',  short: 'AI',    Icon: IcoInsights,  highlight: false, mobile: false },
  { href: '/leaderboard', label: 'Leaderboard',  short: 'Ranks', Icon: IcoRanks,     highlight: false, mobile: true  },
  { href: '/profile',     label: 'Profile',      short: 'Me',    Icon: IcoProfile,   highlight: false, mobile: true  },
] as const

// ── Design tokens ─────────────────────────────────────────────────
const SKY    = '#0284c7'
const AMBER  = '#d97706'
const BG     = '#FAFAF8'
const SIDE   = '#FFFFFF'
const BORDER = '#E5E7EB'
const TEXT   = '#111827'
const MUTED  = '#6B7280'

export function AppLayout({ children, userName, batchName }: {
  children:  React.ReactNode
  userName?: string
  batchName?: string
}) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  const initials = userName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="cm-theme-light flex min-h-screen" style={{ background: BG }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-20"
        aria-label="Main navigation"
        style={{ width: 240, background: SIDE, borderRight: `1px solid ${BORDER}` }}>

        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <Logo size={34} />
          <div>
            <p className="text-[13px] font-bold tracking-tight" style={{ color: TEXT }}>CentuMania</p>
            <p className="text-[10px] tracking-wide" style={{ color: MUTED }}>
              {batchName ?? 'Winning is a Habit'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {NAV.map(({ href, label, Icon, highlight }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative"
                style={
                  active
                    ? { color: SKY, background: 'rgba(2,132,199,0.08)', border: `1px solid rgba(2,132,199,0.18)`, fontWeight: 600 }
                    : highlight
                      ? { color: AMBER, background: 'rgba(217,119,6,0.07)', border: `1px solid rgba(217,119,6,0.18)` }
                      : { color: MUTED, border: '1px solid transparent' }
                }
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ background: SKY }} />
                )}
                {!active && highlight && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ background: AMBER }} />
                )}
                <Icon active={active} />
                <span className="tracking-tight flex-1">{label}</span>
                {highlight && !active && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: 1.2, padding: '2px 6px',
                    borderRadius: 4, background: 'rgba(217,119,6,0.10)', color: AMBER,
                    border: `1px solid rgba(217,119,6,0.25)`, flexShrink: 0,
                  }}>STUDY</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Sign out */}
        <div className="px-3 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          {userName && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#0284c7,#6366f1)' }}>
                {initials}
              </div>
              <p className="text-xs font-semibold truncate" style={{ color: TEXT }}>{userName}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-xs transition-colors"
            style={{ color: MUTED }}
            onMouseOver={e => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <IcoOut />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <style>{`@media(min-width:768px){.al-shift{margin-left:240px}}`}</style>
        <div className="al-shift flex-1 flex flex-col min-h-screen">

          {/* Mobile Top Bar */}
          <header className="md:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-10"
            style={{ background: 'rgba(250,250,248,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-sm font-semibold" style={{ color: TEXT }}>CentuMania</span>
            </div>
            {userName && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#0284c7,#6366f1)' }}>
                {initials}
              </div>
            )}
          </header>

          <main id="main-content" className="flex-1">
            <style>{`
              #main-content{padding-bottom:calc(4.5rem + env(safe-area-inset-bottom));}
              @media(min-width:768px){#main-content{padding-bottom:0;}}
            `}</style>
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Nav (5 visible items) ─────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex mobile-nav-safe"
        aria-label="Mobile navigation"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${BORDER}` }}>
        {NAV.filter(n => n.mobile).map(({ href, short, Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href}
              aria-current={active ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors touch-target relative"
              style={{ color: active ? SKY : MUTED }}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                  style={{ background: SKY }} />
              )}
              <Icon active={active} />
              <span className="text-[10px] font-medium tracking-wide">{short}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
