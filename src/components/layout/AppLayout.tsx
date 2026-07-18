'use client'

import Link from 'next/link'
import { useState } from 'react'
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
const IcoNews      = (p: IconProps) => <Ico {...p}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/></Ico>
const IcoOut       = (p: IconProps) => <Ico {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ico>

const IcoBot = (p: IconProps) => <Ico {...p}><rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 8V5M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><circle cx="9.5" cy="13" r=".5"/><circle cx="14.5" cy="13" r=".5"/><path d="M9.5 16.5h5"/></Ico>
const IcoMore = (p: IconProps) => <Ico {...p}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></Ico>
const IcoCap  = (p: IconProps) => <Ico {...p}><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></Ico>

// Primary nav = the daily loop only. Everything else lives under "More".
// Today's Test opens the Daily Test Engine module (25Q formal daily test);
// the AI Daily Test (personalised practice) is a SEPARATE feature under More.
const TEST_HREF = '/materials/viewer/daily-test-engine'
const NAV = [
  { href: '/dashboard',   label: 'Dashboard',    short: 'Home',  Icon: IcoDashboard, highlight: false, mobile: true  },
  { href: '/materials',   label: 'Modules',      short: 'Study', Icon: IcoBook,      highlight: true,  mobile: true  },
  { href: '/classroom',   label: 'Classroom',    short: 'Learn', Icon: IcoCap,       highlight: false, mobile: true  },
  { href: TEST_HREF,      label: "Today's Test", short: 'Test',  Icon: IcoExam,      highlight: false, mobile: true  },
] as const
const IcoCard = (p: IconProps) => <Ico {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></Ico>
const MORE_NAV = [
  { href: '/study/daily-test', label: 'AI Daily Test',   Icon: IcoBot      },
  { href: '/current-affairs',  label: 'Current Affairs', Icon: IcoNews     },
  { href: '/insights',         label: 'AI Insights',     Icon: IcoInsights },
  { href: '/leaderboard',      label: 'Leaderboard',     Icon: IcoRanks    },
  { href: '/payment',          label: 'Payment',         Icon: IcoCard     },
  { href: '/profile',          label: 'Profile',         Icon: IcoProfile  },
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
  // '/materials' must not light up while the Today's Test viewer (a /materials/viewer
  // route) is open — the test is its own nav destination.
  const isActive = (href: string) =>
    href === '/materials'
      ? (pathname === href || pathname.startsWith(href + '/')) && !pathname.startsWith(TEST_HREF)
      : pathname === href || pathname.startsWith(href + '/')
  const moreActive = MORE_NAV.some(m => isActive(m.href))
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

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

          {/* More — collapsible group for everything outside the daily loop */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            aria-expanded={moreOpen || moreActive}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
            style={{ color: moreActive ? TEXT : MUTED, border: '1px solid transparent', fontWeight: moreActive ? 600 : 400 }}
          >
            <IcoMore active={moreActive} />
            <span className="tracking-tight flex-1 text-left">More</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ transform: (moreOpen || moreActive) ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {(moreOpen || moreActive) && MORE_NAV.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2 ml-3 rounded-xl text-[13px] transition-all duration-150 relative"
                style={
                  active
                    ? { color: SKY, background: 'rgba(2,132,199,0.08)', border: `1px solid rgba(2,132,199,0.18)`, fontWeight: 600 }
                    : { color: MUTED, border: '1px solid transparent' }
                }
              >
                <Icon active={active} />
                <span className="tracking-tight">{label}</span>
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

      {/* ── Mobile "More" sheet ──────────────────────────────────── */}
      {mobileMoreOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-30" style={{ background: 'rgba(17,24,39,0.30)' }}
            onClick={() => setMobileMoreOpen(false)} aria-hidden="true" />
          <div className="md:hidden fixed inset-x-3 z-40 rounded-2xl p-2"
            style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))', background: '#FFFFFF', border: `1px solid ${BORDER}`, boxShadow: '0 12px 40px rgba(17,24,39,0.18)' }}
            role="menu" aria-label="More navigation">
            {MORE_NAV.map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} onClick={() => setMobileMoreOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
                  style={active
                    ? { color: SKY, background: 'rgba(2,132,199,0.08)', fontWeight: 600 }
                    : { color: TEXT, fontWeight: 500 }}>
                  <Icon active={active} />
                  {label}
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav (3 items + More) ───────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex mobile-nav-safe"
        aria-label="Mobile navigation"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${BORDER}` }}>
        {NAV.filter(n => n.mobile).map(({ href, short, Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href}
              onClick={() => setMobileMoreOpen(false)}
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
        <button
          onClick={() => setMobileMoreOpen(o => !o)}
          aria-expanded={mobileMoreOpen}
          aria-label="More navigation"
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors touch-target relative"
          style={{ color: (mobileMoreOpen || moreActive) ? SKY : MUTED }}
        >
          {moreActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
              style={{ background: SKY }} />
          )}
          <IcoMore active={mobileMoreOpen || moreActive} />
          <span className="text-[10px] font-medium tracking-wide">More</span>
        </button>
      </nav>
    </div>
  )
}
