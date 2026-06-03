import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle shadow and hover lift */
  hoverable?: boolean
  /** Removes padding */
  noPadding?: boolean
  /** Border highlight — used for active/selected state */
  highlight?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable, noPadding, highlight, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'bg-surface rounded-xl border',
        highlight ? 'border-primary shadow-sm shadow-primary/10' : 'border-border',
        !noPadding && 'p-5',
        hoverable && 'transition-shadow duration-150 hover:shadow-md cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  ),
)

Card.displayName = 'Card'

export function CardHeader({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-sm font-semibold text-text ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardLabel({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs font-medium text-text-muted uppercase tracking-wide ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}
