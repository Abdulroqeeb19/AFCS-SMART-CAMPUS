'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Activity, Clock } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { StaffAttendance } from '@/lib/database.types'

const statusColor = {
  present: 'text-emerald-600',
  late: 'text-amber-600',
  absent: 'text-red-600',
}

interface RecentActivityProps {
  records: StaffAttendance[]
}

export function RecentActivity({ records }: RecentActivityProps) {
  const recent = [...records]
    .filter((r) => r.check_in)
    .sort((a, b) => new Date(b.check_in!).getTime() - new Date(a.check_in!).getTime())
    .slice(0, 6)

  if (recent.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <Activity className="h-10 w-10 mb-2" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recent.map((record) => (
            <div key={record.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className={`h-3.5 w-3.5 shrink-0 ${statusColor[record.status as keyof typeof statusColor]}`} />
                <span className="text-zinc-700 truncate">
                  {record.staff?.full_name || 'Unknown'}
                </span>
                <Badge
                  variant={record.status === 'late' ? 'warning' : 'success'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {record.status}
                </Badge>
              </div>
              <span className="text-zinc-400 text-xs whitespace-nowrap ml-2">
                {record.check_in ? formatTime(record.check_in) : ''}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
