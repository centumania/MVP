'use client'

/**
 * Landing v2 — shared primitives.
 * Reveal: IntersectionObserver-driven scroll entrance (CSS transition, no deps).
 * Section scaffolding keeps every section on the same 8pt rhythm.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Animation lives in CSS (.lv2-reveal in LandingV2) so prefers-reduced-motion
  // is handled by a media query instead of JS.
  return (
    <div
      ref={ref}
      className={`lv2-reveal${shown ? ' lv2-shown' : ''} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  )
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>
}

export function SectionLabel({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'indigo' | 'emerald' | 'amber' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-200/70',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function SectionHeading({
  label,
  labelTone,
  title,
  sub,
}: {
  label: ReactNode
  labelTone?: 'sky' | 'indigo' | 'emerald' | 'amber'
  title: ReactNode
  sub?: ReactNode
}) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <SectionLabel tone={labelTone}>{label}</SectionLabel>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl" style={{ letterSpacing: '-0.025em' }}>
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">{sub}</p>}
    </Reveal>
  )
}
