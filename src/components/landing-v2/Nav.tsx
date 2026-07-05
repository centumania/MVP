'use client'

/**
 * Landing v2 — navigation.
 * Glass sticky header, anchor links, mobile sheet menu.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from './icons'
import Logo from './Logo'

const LINKS = [
  { href: '#why', label: 'Why CentuMania' },
  { href: '#features', label: 'Features' },
  { href: '#centum-index', label: 'Centum Index' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

function scrollToId(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return
  e.preventDefault()
  const el = document.getElementById(href.slice(1))
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: 'smooth' })
}

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-gray-200/70 bg-white/85 shadow-[0_1px_12px_rgba(16,24,40,0.04)]' : 'bg-transparent'
      }`}
      style={{ backdropFilter: scrolled ? 'blur(14px)' : undefined, WebkitBackdropFilter: scrolled ? 'blur(14px)' : undefined }}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={38} />
          <span className="text-[17px] font-bold tracking-tight text-gray-900">
            Centu<span className="text-sky-600">Mania</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollToId(e, l.href)}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.1)] transition-all hover:bg-gray-800 hover:shadow-[0_4px_12px_rgba(16,24,40,0.15)]"
          >
            Get started
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gray-200/70 bg-white/95 px-5 pb-6 pt-3 md:hidden" style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
          <div className="flex flex-col">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => { scrollToId(e, l.href); setOpen(false) }}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link href="/auth/register" className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-3 text-[15px] font-semibold text-white">
              Get started <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] font-semibold text-gray-800">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
