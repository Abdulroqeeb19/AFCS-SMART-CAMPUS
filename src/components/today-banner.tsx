'use client'

import { formatDate } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

export function TodayBanner() {
  const today = new Date()
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-info)] bg-[var(--color-info)]/10 rounded-lg border border-[var(--color-info)]/30 px-4 py-2.5">
      <CalendarDays className="h-4 w-4 text-[var(--color-accent)]" />
      <span>{formatDate(today)}</span>
    </div>
  )
}
