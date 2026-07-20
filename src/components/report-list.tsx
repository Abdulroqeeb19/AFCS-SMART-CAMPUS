'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CollapsibleSection } from './collapsible-section'
import type { DailyReportEntry } from '@/lib/database.types'
import { FileText } from 'lucide-react'

interface Props {
  reports: DailyReportEntry[]
  title?: string
}

export function ReportList({ reports, title = 'Daily Reports' }: Props) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <FileText className="h-14 w-14 mb-3 stroke-1" />
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">No reports submitted yet</p>
            <p className="text-xs mt-1">Staff end-of-day reports will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>
        <p className="text-sm text-[var(--color-text-secondary)]">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <CollapsibleSection
          items={reports}
          keyExtractor={(r: DailyReportEntry) => r.id}
          defaultVisible={5}
          renderItem={(r: DailyReportEntry) => (
            <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{r.staff?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{r.date}</p>
                </div>
                <Badge variant="info" className="text-[10px]">
                  {new Date(r.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="font-medium text-[var(--color-text-primary)] text-xs uppercase tracking-wide mb-0.5">Activities</p>
                <p>{r.activities_done}</p>
              </div>
              {r.challenges && (
                <div className="text-sm">
                  <p className="font-medium text-[var(--color-warning)] text-xs uppercase tracking-wide mb-0.5">Challenges</p>
                  <p className="text-[var(--color-warning)]">{r.challenges}</p>
                </div>
              )}
              {r.notes && (
                <p className="text-xs text-[var(--color-text-muted)] italic">{r.notes}</p>
              )}
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
