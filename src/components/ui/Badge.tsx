import { HTMLAttributes } from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'gold'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success-text border-success/20',
  warning: 'bg-warning/10 text-warning-text border-warning/25',
  error:   'bg-error/10 text-error-text border-error/20',
  neutral: 'bg-surface-overlay text-text-secondary border-border',
  info:    'bg-info/10 text-info border-info/20',
  gold:    'bg-accent-subtle text-gold-text border-[rgba(255,183,3,0.30)]',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2    py-0.5 text-[10px] rounded-md',
  md: 'px-2.5  py-1   text-xs    rounded-lg',
}

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error:   'bg-error',
  neutral: 'bg-text-muted',
  info:    'bg-info',
  gold:    'bg-accent',
}

export function Badge({ variant = 'neutral', size = 'sm', dot = false, className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-semibold tracking-wide border',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
