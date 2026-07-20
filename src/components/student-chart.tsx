'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BarChart3 } from 'lucide-react'

interface ClassData {
  class: string
  present: number
  late: number
  absent: number
  total: number
}

interface StudentChartProps {
  data: ClassData[]
}

export function StudentChart({ data }: StudentChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-accent)]/70" />
            Class Attendance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
            <BarChart3 className="h-12 w-12 mb-3" />
            <p className="text-sm">No class data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--color-accent)]/70" />
          Class Attendance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const presentPct = item.total > 0 ? (item.present / item.total) * 100 : 0
            const latePct = item.total > 0 ? (item.late / item.total) * 100 : 0
            return (
              <div key={item.class} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--color-text-primary)]">{item.class}</span>
                  <span className="text-[var(--color-text-muted)] text-xs">{item.present + item.late}/{item.total}</span>
                </div>
                <div className="flex h-6 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                  <div
                    className="bg-[var(--color-success)] transition-all duration-500"
                    style={{ width: `${presentPct}%` }}
                  />
                  <div
                    className="bg-[var(--color-warning)] transition-all duration-500"
                    style={{ width: `${latePct}%` }}
                  />
                </div>
                <div className="flex gap-3 text-xs text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                    {item.present} present
                  </span>
                  {item.late > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
                      {item.late} late
                    </span>
                  )}
                  {item.absent > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
                      {item.absent} absent
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
