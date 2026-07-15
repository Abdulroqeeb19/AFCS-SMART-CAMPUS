'use client'

import { useEffect, useState } from 'react'
import { CardContent } from '@/components/ui/card'
import { CollapsibleCard } from '@/components/collapsible-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/skeleton'
import { FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface ActivityReport {
  id: string
  staff: { id: string; full_name: string } | null
  class: { id: string; name: string; arm: string } | null
  date: string
  activities_done: string
  challenges: string | null
  notes: string | null
  submitted_at: string
}

interface StudentActivityReportsViewProps {
  defaultOpen?: boolean
}

export function StudentActivityReportsView({ defaultOpen = true }: StudentActivityReportsViewProps) {
  const [reports, setReports] = useState<ActivityReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/reports/student-activity?date=${today}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <CollapsibleCard
        title="Student Activity Reports"
        icon={<FileText className="h-4 w-4 text-amber-500" />}
        defaultOpen={defaultOpen}
      >
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </CollapsibleCard>
    )
  }

  if (reports.length === 0) {
    return (
      <CollapsibleCard
        title="Student Activity Reports"
        icon={<FileText className="h-4 w-4 text-amber-500" />}
        defaultOpen={defaultOpen}
      >
        <p className="text-sm text-zinc-400 text-center py-4">
          No activity reports submitted today by class teachers
        </p>
      </CollapsibleCard>
    )
  }

  return (
    <CollapsibleCard
      title="Student Activity Reports"
      icon={<FileText className="h-4 w-4 text-amber-500" />}
      defaultOpen={defaultOpen}
      actions={<Badge variant="info">{reports.length} today</Badge>}
    >
      <div className="space-y-3">
        {reports.slice(0, 5).map((report) => (
          <div key={report.id} className="rounded-lg border border-zinc-200 p-3 hover:border-amber-200 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-800">
                  {report.class ? `${report.class.name} ${report.class.arm}` : 'Unknown Class'}
                </span>
                <span className="text-xs text-zinc-400">—</span>
                <span className="text-xs text-zinc-500">{report.staff?.full_name || 'Unknown'}</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {new Date(report.submitted_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-zinc-600 line-clamp-2">{report.activities_done}</p>
            {report.challenges && (
              <p className="text-xs text-amber-600 mt-1 line-clamp-1">
                Challenge: {report.challenges}
              </p>
            )}
          </div>
        ))}
        {reports.length > 5 && (
          <Link
            href="/reports"
            className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 pt-2"
          >
            View all {reports.length} reports <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </CollapsibleCard>
  )
}
