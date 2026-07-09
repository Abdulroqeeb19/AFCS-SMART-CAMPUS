'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BarChart3 } from 'lucide-react'

interface ChartData {
  label: string
  present: number
  late: number
  absent: number
}

interface DashboardChartProps {
  data: ChartData[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Attendance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <BarChart3 className="h-12 w-12 mb-3" />
            <p className="text-sm">No data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxVal = Math.max(
    ...data.map((d) => d.present + d.late + d.absent),
    1
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          Attendance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => {
            const total = item.present + item.late + item.absent
            const presentPct = (item.present / maxVal) * 100
            const latePct = (item.late / maxVal) * 100
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700">{item.label}</span>
                  <span className="text-zinc-400 text-xs">{total} staff</span>
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
