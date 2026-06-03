import { HTMLAttributes } from 'react'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'
type BadgeSize    = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary-muted text-primary-active border-primary-border',
  success: 'bg-success-subtle text-success-text border-success/20',
  warning: 'bg-warning-subtle text-warning-text border-warning/20',
  error:   'bg-error-subtle text-error-text border-error/20',
  neutral: 'bg-surface-overlay text-text-secondary border-border',
  info:    'bg-info-subtle text-info border-info/20',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2    py-0.5 text-xs rounded-md',
  md: 'px-2.5  py-1   text-xs rounded-md',
}

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error:   'bg-error',
  neutral: 'bg-text-muted',
  info:    'bg-info',
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-medium border',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}
