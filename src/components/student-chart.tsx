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
            <BarChart3 className="h-4 w-4 text-violet-500" />
            Class Attendance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
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
          <BarChart3 className="h-4 w-4 text-violet-500" />
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
                  <span className="font-medium text-zinc-700">{item.class}</span>
                  <span className="text-zinc-400 text-xs">{item.present + item.late}/{item.total}</span>
                </div>
                <div className="flex h-6 w-full rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${presentPct}%` }}
                  />
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{ width: `${latePct}%` }}
                  />
                </div>
                <div className="flex gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {item.present} present
                  </span>
                  {item.late > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      {item.late} late
                    </span>
                  )}
                  {item.absent > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
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
