'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Pagination } from './pagination'
import { Skeleton } from './skeleton'
import { EmptyState } from './empty-state'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render: (item: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  loading?: boolean
  emptyMessage?: string
  emptyAction?: ReactNode
  onRowClick?: (item: T) => void
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDir,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  emptyMessage,
  emptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="hidden md:block">
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[var(--color-bg-muted)] px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex gap-4">
                {columns.map((col) => (
                  <Skeleton key={col.key} className="h-4 flex-1" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-[var(--color-border)] last:border-0">
                <div className="flex gap-4">
                  {columns.map((col) => (
                    <Skeleton key={col.key} className="h-4 flex-1" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--color-border)] p-4 space-y-2">
              {columns.map((col) => (
                <Skeleton key={col.key} className="h-4 w-3/4" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={className}>
        <EmptyState message={emptyMessage || 'No data found'} action={emptyAction} />
      </div>
    )
  }

  const SortIcon = ({ column }: { column: Column<T> }) => {
    if (!column.sortable) return null
    if (sortKey !== column.key) return <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-[var(--color-accent)]" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-[var(--color-accent)]" />
    )
  }

  return (
    <div className={className}>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--color-bg-muted)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]',
                      col.sortable && 'cursor-pointer select-none hover:text-[var(--color-text-primary)]',
                      col.className,
                    )}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      <SortIcon column={col} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'bg-[var(--color-bg-card)] transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-[var(--color-bg-hover)]',
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-sm text-[var(--color-text-primary)]', col.className)}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(
              'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 space-y-2',
              onRowClick && 'cursor-pointer hover:shadow-md transition-shadow',
            )}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-start gap-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)] min-w-20 shrink-0">
                  {col.header}
                </span>
                <span className="text-sm text-[var(--color-text-primary)]">
                  {col.render(item)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {currentPage !== undefined && totalPages !== undefined && onPageChange && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[var(--color-text-muted)]">
            Page {currentPage} of {totalPages}
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
