'use client'

import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatTime } from '@/lib/utils'
import type { StudentAttendance } from '@/lib/database.types'
import { GraduationCap, LogOut, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  records: StudentAttendance[]
  title?: string
}

const statusVariant = {
  present: 'success' as const,
  late: 'warning' as const,
  absent: 'danger' as const,
}

const statusLabel = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
}

function calcDuration(checkIn: string, checkOut: string | null): string | null {
  if (!checkOut) return null
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours === 0) return `${mins} min`
  return `${hours}h ${mins}m`
}

export function StudentAttendanceTable({ records, title = "Today's Student Attendance" }: Props) {
  const [showAll, setShowAll] = useState(false)
  const DEFAULT_VISIBLE = 10

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <GraduationCap className="h-14 w-14 mb-3 stroke-1" />
            <p className="text-sm font-medium text-zinc-500">No attendance records yet today</p>
            <p className="text-xs mt-1">Student check-ins will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const checkedOutCount = records.filter((r) => r.check_out).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-zinc-500">
          {records.length} record{records.length !== 1 ? 's' : ''}
          {checkedOutCount > 0 && ` (${checkedOutCount} checked out)`}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Class</th>
                <th className="px-6 py-3 font-medium">Check In</th>
                <th className="px-6 py-3 font-medium">Check Out</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Period</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(showAll ? records : records.slice(0, DEFAULT_VISIBLE)).map((record) => {
                const duration = record.check_in
                  ? calcDuration(record.check_in, record.check_out)
                  : null
                return (
                  <tr key={record.id} className="text-sm hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {record.student?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-zinc-400">{record.student?.student_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">
                      {record.student?.class
                        ? `${record.student.class.name} ${record.student.class.arm}`
                        : '-'}
                    </td>
                    <td className="px-6 py-3 text-zinc-600">
                      {record.check_in ? formatTime(record.check_in) : '-'}
                    </td>
                    <td className="px-6 py-3 text-zinc-600">
                      {record.check_out ? (
                        <span className="flex items-center gap-1">
                          <LogOut className="h-3 w-3 text-zinc-400" />
                          {formatTime(record.check_out)}
                        </span>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {duration ? (
                        <span className="text-xs text-zinc-500">{duration}</span>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="info" className="capitalize text-[10px]">
                        {record.period}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={statusVariant[record.status as keyof typeof statusVariant]}>
                        {statusLabel[record.status as keyof typeof statusLabel]}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {records.length > DEFAULT_VISIBLE && (
                <tr>
                  <td colSpan={7} className="px-6 py-2">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {showAll ? (
                        <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                      ) : (
                        <><ChevronDown className="h-3.5 w-3.5" /> Show {records.length - DEFAULT_VISIBLE} more</>
                      )}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
