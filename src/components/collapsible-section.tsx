'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function CollapsibleSection<T>({
  items,
  renderItem,
  keyExtractor,
  defaultVisible = 5,
  showMoreText,
  showLessText,
  viewAllLink,
  className = '',
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  defaultVisible?: number
  showMoreText?: string
  showLessText?: string
  viewAllLink?: string
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)

  if (items.length <= defaultVisible) {
    return <div className={className}>{items.map((item, i) => <div key={keyExtractor(item, i)}>{renderItem(item, i)}</div>)}</div>
  }

  const visibleItems = items.slice(0, defaultVisible)
  const hiddenCount = items.length - defaultVisible

  return (
    <div className={className}>
      {visibleItems.map((item, i) => (
        <div key={keyExtractor(item, i)}>{renderItem(item, i)}</div>
      ))}
      {expanded && items.slice(defaultVisible).map((item, i) => (
        <div key={keyExtractor(item, i + defaultVisible)}>{renderItem(item, i + defaultVisible)}</div>
      ))}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-1 mt-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 py-1.5 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {showLessText || 'Show less'}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {showMoreText || `Show ${hiddenCount} more`}
            </>
          )}
        </button>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex items-center gap-1 py-1.5 px-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            View All
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
