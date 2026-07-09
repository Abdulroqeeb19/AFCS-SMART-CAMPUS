'use client'

import { formatDate } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

export function TodayBanner() {
  const today = new Date()
  return (
    <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-50 rounded-lg border border-blue-200 px-4 py-2.5">
      <CalendarDays className="h-4 w-4 text-naf-gold" />
      <span>{formatDate(today)}</span>
    </div>
  )
}
