'use client'

import { CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CollapsibleCard } from './collapsible-card'
import { Activity, Clock, LogOut } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { StudentAttendance } from '@/lib/database.types'

function calcDuration(checkIn: string, checkOut: string | null): string | null {
  if (!checkOut) return null
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours === 0) return `${mins} min`
  return `${hours}h ${mins}m`
}

interface StudentRecentActivityProps {
  records: StudentAttendance[]
  defaultOpen?: boolean
}

export function StudentRecentActivity({ records, defaultOpen = true }: StudentRecentActivityProps) {
  const recent = [...records]
    .filter((r) => r.check_in)
    .sort((a, b) => new Date(b.check_in!).getTime() - new Date(a.check_in!).getTime())
    .slice(0, 8)

  if (recent.length === 0) {
    return (
      <CollapsibleCard
        title="Student Check-In Activity"
        icon={<Activity className="h-4 w-4 text-violet-500" />}
        defaultOpen={defaultOpen}
      >
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
          <Activity className="h-10 w-10 mb-2" />
          <p className="text-sm">No student activity yet today</p>
        </div>
      </CollapsibleCard>
    )
  }

  return (
    <CollapsibleCard
      title="Recent Student Activity"
      icon={<Activity className="h-4 w-4 text-violet-500" />}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-3">
        {recent.map((record) => {
          const duration = record.check_in
            ? calcDuration(record.check_in, record.check_out)
            : null
          return (
            <div key={record.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className={`h-3.5 w-3.5 shrink-0 ${record.status === 'late' ? 'text-amber-600' : 'text-emerald-600'}`} />
                <span className="text-zinc-700 truncate">
                  {record.student?.full_name || 'Unknown'}
                </span>
                <Badge
                  variant={record.status === 'late' ? 'warning' : 'success'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {record.status}
                </Badge>
                <Badge variant="info" className="text-[10px] px-1.5 py-0 capitalize">
                  {record.period}
                </Badge>
                {record.check_out && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                    <LogOut className="h-2.5 w-2.5" />
                    {duration && <span>{duration}</span>}
                  </span>
                )}
              </div>
              <span className="text-zinc-400 text-xs whitespace-nowrap ml-2">
                {record.check_in ? formatTime(record.check_in) : ''}
              </span>
            </div>
          )
        })}
      </div>
    </CollapsibleCard>
  )
}
