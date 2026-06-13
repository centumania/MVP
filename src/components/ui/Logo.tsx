/**
 * CentuMania Logo Components
 *
 * Design: Three concentric rings (target/precision) — clean, minimal.
 * Wordmark: "Centu" in text colour · "Mania" in primary green.
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
  const id = useId().replace(/:/g, 'x')

  // `glow` retained for API compatibility — now a no-op (clean, no neon).
  void glow

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="CentuMania logo"
      role="img"
    >
      {/* Concentric precision rings — institutional navy, teal bullseye */}
      <circle cx="16" cy="16" r="13.5" stroke="#0B3D91" strokeWidth="1.6" opacity="0.30" />
      <circle cx="16" cy="16" r="8.5"  stroke="#0B3D91" strokeWidth="1.5" opacity="0.62" />
      <circle cx="16" cy="16" r="4"    stroke="#0B3D91" strokeWidth="1.4" opacity="0.90" />
      <circle cx="16" cy="16" r="2.1"  fill={`url(#${id}g)`} />
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00C897" />
          <stop offset="100%" stopColor="#00B488" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ─── LogoFull — icon + bi-color wordmark ─────────────────────────────────────
export function LogoFull({
  size = 26,
  glow = false,
  className = '',
}: {
  size?:      number
  glow?:      boolean
  className?: string
}) {
  const fontSize = Math.round(size * 0.6)
  void glow // retained for API compatibility — clean, no neon glow

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="shrink-0">
        <LogoMark size={size} />
      </div>
      <span
        className="font-extrabold tracking-tight leading-none select-none"
        style={{
          fontFamily: "var(--font-inter, 'Inter'), sans-serif",
          fontSize,
          letterSpacing: '-0.03em',
        }}
      >
        <span style={{ color: 'var(--color-text, #111827)' }}>Centu</span>
        <span style={{ color: '#0B3D91' }}>Mania</span>
      </span>
    </div>
  )
}
