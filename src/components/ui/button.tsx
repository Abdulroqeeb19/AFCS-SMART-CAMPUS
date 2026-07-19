import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-bg-sidebar)] text-white hover:bg-blue-800 active:bg-blue-900 border border-transparent',
  secondary:
    'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:bg-zinc-200 border border-[var(--color-border)]',
  outline:
    'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] border border-transparent',
  danger:
    'bg-[var(--color-danger)] text-white hover:bg-red-600 active:bg-red-700 border border-transparent',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
