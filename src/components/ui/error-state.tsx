'use client'

import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ErrorStateProps {
  icon?: ReactNode
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  icon,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="mb-4 text-[var(--color-danger)]">
        {icon || <AlertCircle className="h-12 w-12" />}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          Try Again
        </Button>
      )}
    </div>
  )
}
