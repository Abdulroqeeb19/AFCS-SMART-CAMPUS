'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CollapsibleSection } from '@/components/collapsible-section'
import type { DailyReport } from '@/lib/database.types'

interface Props {
  report: DailyReport | null
}

export function DailySummary({ report }: Props) {
  if (!report) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Summary</CardTitle>
        <p className="text-sm text-[var(--color-text-secondary)]">{report.date}</p>
      </CardHeader>
      <CardContent>
        <CollapsibleSection
          items={report.department_breakdown}
          keyExtractor={(dept: any) => dept.department}
          renderItem={(dept: any) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{dept.department}</span>
                <span className="text-[var(--color-text-secondary)]">{dept.present}/{dept.total}</span>
              </div>
              <div className="flex gap-1 text-xs">
                <Badge variant="success">{dept.present} present</Badge>
                {dept.late > 0 && <Badge variant="warning">{dept.late} late</Badge>}
                {dept.absent > 0 && <Badge variant="danger">{dept.absent} absent</Badge>}
              </div>
            </div>
          )}
          defaultVisible={5}
        />
      </CardContent>
    </Card>
  )
}
