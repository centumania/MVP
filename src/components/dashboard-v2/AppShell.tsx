'use client'

/**
 * Dashboard v2 — application shell (light premium design system).
 * Desktop: fixed sidebar. Mobile: glass top bar + 5-item bottom nav
 * (Insights & Current Affairs remain reachable from dashboard cards and
 * the desktop sidebar — 7 items is too cramped for a 375px bottom bar).
 * Route structure and logout logic unchanged from v1 AppLayout.
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import Logo from '@/src/components/landing-v2/Logo'
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }
function Base({ size = 18, children, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}
const IcoHome = (p: IconProps) => <Base {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></Base>
const IcoBook = (p: IconProps) => <Base {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Base>
const IcoExam = (p: IconProps) => <Base {...p}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="12" y2="16" /></Base>
const IcoNews = (p: IconProps) => <Base {...p}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" /></Base>
const IcoBrain = (p: IconProps) => <Base {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></Base>
const IcoRanks = (p: IconProps) => <Base {...p}><path d="M18 20V10M12 20V4M6 20v-6" /></Base>
const IcoUser = (p: IconProps) => <Base {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Base>
const IcoOut = (p: IconProps) => <Base {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Base>

const NAV = [
  { href: '/dashboard', label: 'Dashboard', short: 'Home', Icon: IcoHome, mobile: true },
  { href: '/materials', label: 'Materials', short: 'Study', Icon: IcoBook, mobile: true },
  { href: '/exam/today', label: "Today's Exam", short: 'Exam', Icon: IcoExam, mobile: true },
  { href: '/current-affairs', label: 'Current Affairs', short: 'News', Icon: IcoNews, mobile: false },
  { href: '/insights', label: 'AI Insights', short: 'Insights', Icon: IcoBrain, mobile: false },
  { href: '/leaderboard', label: 'Leaderboard', short: 'Ranks', Icon: IcoRanks, mobile: true },
  { href: '/profile', label: 'Profile', short: 'Me', Icon: IcoUser, mobile: true },
] as const

export function AppShell({ children, userName, batchName }: {
  children: React.ReactNode
  userName?: string
  batchName?: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await getSupabaseBrowserClient().auth.signOut()
    router.replace('/auth/login')
  }

  const initials = userName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div
      className="flex min-h-screen bg-[#FAFAF8] text-gray-900 antialiased"
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
    >
      {/* ── Desktop sidebar ── */}
      <aside
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-gray-200/70 bg-white md:flex"
      >
        <div className="border-b border-gray-100 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span>
              <span className="block text-[15.5px] font-bold tracking-tight text-gray-900">
                Centu<span className="text-sky-600">Mania</span>
              </span>
              <span className="block text-[10.5px] font-medium text-gray-400">{batchName ?? 'Winning is a habit'}</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors ${
                  active
                    ? 'bg-sky-50 font-semibold text-sky-700 ring-1 ring-sky-200/60'
                    : 'font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-sky-600" />}
                <Icon size={17} className={active ? 'text-sky-600' : 'text-gray-400'} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 px-3 py-4">
          {userName && (
            <div className="mb-1 flex items-center gap-2.5 px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
                {initials}
              </span>
              <p className="truncate text-[13px] font-semibold text-gray-800">{userName}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <IcoOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200/70 bg-white/85 px-4 md:hidden"
          style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size={30} />
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              Centu<span className="text-sky-600">Mania</span>
            </span>
          </Link>
          {userName && (
            <Link href="/profile" aria-label="Profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
              {initials}
            </Link>
          )}
        </header>

        {/* Page content — bottom clearance for mobile nav + safe area */}
        <main id="main-content" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200/70 bg-white/90 md:hidden"
        style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.filter(n => n.mobile).map(({ href, short, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-sky-600' : 'text-gray-400'
              }`}
            >
              {active && <span className="absolute top-0 left-1/2 h-[2.5px] w-8 -translate-x-1/2 rounded-full bg-sky-600" />}
              <Icon size={19} strokeWidth={active ? 2.1 : 1.8} />
              <span className={`text-[10.5px] tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>{short}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
