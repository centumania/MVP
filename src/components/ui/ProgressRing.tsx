'use client'

interface ProgressRingProps {
  value: number          // 0–100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
  animate?: boolean
}

export function ProgressRing({
  value,
  size = 88,
  strokeWidth = 6,
  color = '#0284c7',
  trackColor = '#E5E7EB',
  label,
  sublabel,
  animate = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={animate ? { transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' } : undefined}
        />
      </svg>
      {/* Center label */}
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && (
            <span className="font-bold font-mono text-text leading-none" style={{ fontSize: size > 80 ? '1.1rem' : '0.875rem' }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-text-muted leading-none mt-0.5" style={{ fontSize: size > 80 ? '0.625rem' : '0.5rem' }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
