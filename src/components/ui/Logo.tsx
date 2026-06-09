/**
 * CentuMania Logo Components
 *
 * Design concept: Archer's bullseye — precision, mastery, target achievement.
 * Three concentric rings (target) + arrow piercing the centre.
 * Green gradient to match brand palette.
 *
 * Exports:
 *   LogoMark  — icon-only (SVG)
 *   LogoFull  — icon + wordmark
 *
 * SSR note: useId() generates stable IDs that match between server and client,
 * eliminating the hydration mismatch caused by module-level counters.
 */

import { useId } from 'react'

// ─── LogoMark — icon only ─────────────────────────────────────────────────────
export function LogoMark({ size = 32, glow = false }: { size?: number; glow?: boolean }) {
  // useId() is React 18 SSR-safe: same value on server and client hydration.
  // Replace colons (React's separator char) — SVG IDs must not contain colons.
  const id = useId().replace(/:/g, 'x')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="CentuMania logo"
      role="img"
      style={glow ? { filter: 'drop-shadow(0 0 8px rgba(111,207,143,0.55))' } : undefined}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6fcf8f"/>
          <stop offset="100%" stopColor="#3fae6a"/>
        </linearGradient>
      </defs>

      {/* ── Target rings ─────────────────────────────────────────── */}
      <circle cx="17" cy="15" r="13.5" stroke={`url(#${id})`} strokeWidth="1.4" opacity="0.55"/>
      <circle cx="17" cy="15" r="8.5"  stroke={`url(#${id})`} strokeWidth="1.2" opacity="0.75"/>
      <circle cx="17" cy="15" r="4"    stroke={`url(#${id})`} strokeWidth="1.1" opacity="0.9"/>
      <circle cx="17" cy="15" r="1.8"  fill={`url(#${id})`}/>

      {/* ── Arrow ─────────────────────────────────────────────────── */}
      <line x1="3" y1="29" x2="13.8" y2="17.2"
        stroke={`url(#${id})`} strokeWidth="1.6" strokeLinecap="round"/>
      <polygon points="17,15  13.2,16.8  14.8,12.8" fill={`url(#${id})`}/>
      <path d="M3 29 L5.5 24.5 M3 29 L7.5 27"
        stroke={`url(#${id})`} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── LogoFull — icon + wordmark ───────────────────────────────────────────────
export function LogoFull({
  size = 26,
  glow = false,
  className = '',
}: {
  size?:      number
  glow?:      boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="shrink-0" style={glow ? { filter: 'drop-shadow(0 0 8px rgba(111,207,143,0.45))' } : undefined}>
        <LogoMark size={size} />
      </div>
      <span
        className="font-bold text-text tracking-tight"
        style={{ fontFamily: 'var(--font-fraunces, serif)', fontSize: size * 0.55 }}
      >
        CentuMania
      </span>
    </div>
  )
}
