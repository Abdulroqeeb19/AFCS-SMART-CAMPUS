'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HintProps {
  text: string
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Hint({ text, className, side = 'top' }: HintProps) {
  const [open, setOpen] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-warning)]/10 transition-all w-5 h-5"
        aria-label="Show hint"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div
            className={cn(
              'absolute z-50 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-xs text-[var(--color-text-secondary)] shadow-lg pointer-events-none',
              positionClasses[side]
            )}
          >
            {text}
          </div>
          {/* Arrow */}
          <div
            className={cn(
              'absolute z-50 h-2 w-2 rotate-45 border border-[var(--color-border)] bg-[var(--color-bg-card)]',
              side === 'top' ? 'bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 mb-0 border-t-0 border-l-0' :
              side === 'bottom' ? 'top-[calc(100%-1px)] left-1/2 -translate-x-1/2 mt-0 border-b-0 border-r-0' : ''
            )}
          />
        </>
      )}
    </span>
  )
}
