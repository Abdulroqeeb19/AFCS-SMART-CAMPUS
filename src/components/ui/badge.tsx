import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold' | 'default'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--color-success)]/20 text-[var(--color-success)] dark:bg-[var(--color-success)]/20 dark:text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] dark:bg-[var(--color-warning)]/20 dark:text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] dark:bg-[var(--color-danger)]/20 dark:text-[var(--color-danger)]',
  info: 'bg-[var(--color-info)]/20 text-[var(--color-info)] dark:bg-[var(--color-info)]/20 dark:text-[var(--color-info)]',
  neutral: 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] dark:bg-[var(--color-bg-muted)] dark:text-[var(--color-text-secondary)]',
  gold: 'bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]',
  default: 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] dark:bg-[var(--color-bg-muted)] dark:text-[var(--color-text-secondary)]',
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
