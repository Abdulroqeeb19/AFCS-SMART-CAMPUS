import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'table' | 'chart' | 'circle'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--color-bg-muted)]',
        variant === 'text' && 'h-4 w-full',
        variant === 'circle' && 'h-10 w-10 rounded-full',
        variant === 'card' && 'h-32 w-full',
        variant === 'chart' && 'h-48 w-full',
        variant === 'table' && 'h-8 w-full',
        className,
      )}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="bg-[var(--color-bg-muted)] px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-[var(--color-border)] last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
