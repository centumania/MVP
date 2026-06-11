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

  const glowStyle = glow
    ? { filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.55))' }
    : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="CentuMania logo"
      role="img"
      style={glowStyle}
    >
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#6AE598" stopOpacity="1" />
          <stop offset="100%" stopColor="#4ADE80" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* ── Outer ring ──────────────────────────────────────────── */}
      <circle
        cx="16" cy="16" r="13.5"
        stroke="#4ADE80"
        strokeWidth="1.4"
        opacity="0.28"
      />

      {/* ── Mid ring ────────────────────────────────────────────── */}
      <circle
        cx="16" cy="16" r="8.5"
        stroke="#4ADE80"
        strokeWidth="1.3"
        opacity="0.58"
      />

      {/* ── Inner ring ──────────────────────────────────────────── */}
      <circle
        cx="16" cy="16" r="4"
        stroke="#4ADE80"
        strokeWidth="1.2"
        opacity="0.82"
      />

      {/* ── Bullseye dot ────────────────────────────────────────── */}
      <circle
        cx="16" cy="16" r="2"
        fill={`url(#${id}g)`}
        style={{ filter: `drop-shadow(0 0 ${Math.max(2, size * 0.1)}px rgba(74,222,128,0.9))` }}
      />
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
  const fontSize   = Math.round(size * 0.58)
  const glowFilter = glow
    ? { filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.45))' }
    : undefined

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="shrink-0" style={glowFilter}>
        <LogoMark size={size} />
      </div>
      <span
        className="font-black tracking-tight leading-none select-none"
        style={{
          fontFamily: 'var(--font-fraunces, serif)',
          fontSize,
          letterSpacing: '-0.025em',
        }}
      >
        <span style={{ color: 'var(--color-text, #e8ead8)' }}>Centu</span>
        <span style={{ color: '#4ADE80' }}>Mania</span>
      </span>
    </div>
  )
}
