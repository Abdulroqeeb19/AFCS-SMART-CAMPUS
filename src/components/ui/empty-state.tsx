import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  message?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title = 'Nothing here yet',
  message = 'No data to display',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="mb-4 text-[var(--color-text-muted)]">
        {icon || <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-sm mb-4">{message}</p>
      {action}
    </div>
  )
}
