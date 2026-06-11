import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  icon?:    React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-[#06140c] font-semibold hover:bg-primary-hover active:bg-primary-active ' +
    'shadow-[0_2px_16px_rgba(74,222,128,0.30)] hover:shadow-[0_4px_24px_rgba(74,222,128,0.45)]',
  secondary:
    'bg-surface-overlay text-text border border-border ' +
    'hover:bg-surface-raised hover:border-border-strong',
  ghost:
    'text-text-secondary hover:bg-surface-overlay hover:text-text',
  danger:
    'bg-error/15 text-error border border-error/25 ' +
    'hover:bg-error/20 hover:border-error/40',
  outline:
    'border border-primary/40 text-primary ' +
    'hover:bg-primary-subtle hover:border-primary/60',
}

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3.5 text-xs  gap-1.5 rounded-lg',
  md: 'h-9  px-4   text-sm  gap-2   rounded-xl',
  lg: 'h-11 px-6   text-sm  gap-2   rounded-xl tracking-tight',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconPosition = 'left',
     fullWidth = false, className = '', children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size} />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left'  && <span className="shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

function Spinner({ size }: { size: Size }) {
  const s = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <svg className={`${s} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
