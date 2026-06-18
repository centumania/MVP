import { HTMLAttributes, forwardRef } from 'react'

type CardVariant = 'default' | 'glass' | 'ghost'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  noPadding?: boolean
  highlight?: boolean
  variant?: CardVariant
  glow?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable, noPadding, highlight, variant = 'default', glow, className = '', children, ...props }, ref) => {
    const base = 'rounded-2xl border transition-all duration-200'

    const variants: Record<CardVariant, string> = {
      default: 'bg-surface border-border shadow-[var(--shadow-sm)]',
      glass:   'glass rounded-2xl',
      ghost:   'bg-transparent border-border',
    }

    const hoverClass = hoverable
      ? 'cursor-pointer hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5'
      : ''

    const glowClass = glow ? 'glow-primary' : ''

    return (
      <div
        ref={ref}
        className={[
          base,
          highlight ? 'border-primary/30 bg-primary-tint shadow-[var(--shadow-sm)]' : variants[variant],
          !noPadding && 'p-5',
          hoverClass,
          glowClass,
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-sm font-semibold text-text tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardLabel({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-[10px] font-semibold text-text-muted uppercase tracking-widest ${className}`} {...props}>
      {children}
    </p>
  )
}
