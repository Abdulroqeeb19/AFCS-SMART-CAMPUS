'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Command, ExternalLink } from 'lucide-react'
import { SIDEBAR_SECTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SearchItem {
  href: string
  label: string
  section: string
}

const allItems: SearchItem[] = []
for (const section of SIDEBAR_SECTIONS) {
  for (const item of section.items) {
    allItems.push({ href: item.href, label: item.label, section: section.label })
  }
}

interface SearchBarProps {
  variant?: 'full' | 'compact'
}

export function SearchBar({ variant = 'full' }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const results = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.href.toLowerCase().includes(query.toLowerCase()) ||
          item.section.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems

  const goTo = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) goTo(results[selectedIndex].href)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 transition-all text-sm',
          variant === 'full'
            ? 'w-full px-3 py-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            : 'px-2 py-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
        )}
        title="Search features (Ctrl+K)"
      >
        <Search className="h-4 w-4 shrink-0" />
        {variant === 'full' && (
          <>
            <span className="flex-1 text-left">Search features...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded px-1.5 py-0.5">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[var(--color-bg-card)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
              <Search className="h-5 w-5 text-[var(--color-text-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, features, or routes..."
                className="flex-1 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] bg-transparent outline-none"
              />
              <kbd className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">No results found</p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={item.href}
                    onClick={() => goTo(item.href)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {item.section} &middot; {item.href}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
