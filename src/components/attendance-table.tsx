'use client'

import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatTime } from '@/lib/utils'
import type { StaffAttendance, AttendanceStatus } from '@/lib/database.types'
import { Users, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  records: StaffAttendance[]
  title?: string
  isAdmin?: boolean
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

function toDatetimeLocal(dateStr: string, timeStr: string | null): string {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

export function AttendanceTable({ records, title = "Today's Attendance", isAdmin }: Props) {
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('present')
  const [newCheckIn, setNewCheckIn] = useState('')
  const [newCheckOut, setNewCheckOut] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const DEFAULT_VISIBLE = 10

  const handleOverride = async (id: string) => {
    setSaving(true)
    try {
      const body: Record<string, string | undefined> = { id, status: newStatus }
      if (newCheckIn) body.check_in = new Date(newCheckIn).toISOString()
      if (newCheckOut) body.check_out = new Date(newCheckOut).toISOString()
      await fetch('/api/attendance/override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setOverrideId(null)
    } finally {
      setSaving(false)
    }
  }

  const startOverride = (record: StaffAttendance) => {
    setOverrideId(record.id)
    setNewStatus(record.status as AttendanceStatus)
    setNewCheckIn(toDatetimeLocal(record.date, record.check_in))
    setNewCheckOut(toDatetimeLocal(record.date, record.check_out))
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Users className="h-14 w-14 mb-3 stroke-1" />
            <p className="text-sm font-medium text-zinc-500">No attendance records yet today</p>
            <p className="text-xs mt-1">Staff check-ins will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-zinc-500">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Badge variant="info" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
                <th className="px-6 py-3 font-medium">Staff</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Check In</th>
                <th className="px-6 py-3 font-medium">Check Out</th>
                <th className="px-6 py-3 font-medium">Status</th>
                {isAdmin && <th className="px-6 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(showAll ? records : records.slice(0, DEFAULT_VISIBLE)).map((record) => (
                <tr key={record.id} className="text-sm hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {record.staff?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-zinc-400">{record.staff?.staff_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-zinc-600">
                    {record.staff?.department?.name || '-'}
                  </td>
                  <td className="px-6 py-3 text-zinc-600">
                    {overrideId === record.id ? (
                      <input
                        type="datetime-local"
                        value={newCheckIn}
                        onChange={(e) => setNewCheckIn(e.target.value)}
                        className="text-xs border border-blue-300 rounded px-1 py-0.5 w-40"
                        disabled={saving}
                      />
                    ) : (
                      record.check_in ? formatTime(record.check_in) : '-'
                    )}
                  </td>
                  <td className="px-6 py-3 text-zinc-600">
                    {overrideId === record.id ? (
                      <input
                        type="datetime-local"
                        value={newCheckOut}
                        onChange={(e) => setNewCheckOut(e.target.value)}
                        className="text-xs border border-blue-300 rounded px-1 py-0.5 w-40"
                        disabled={saving}
                      />
                    ) : (
                      record.check_out ? formatTime(record.check_out) : (
                        <span className="text-zinc-300">-</span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {overrideId === record.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                          className="text-xs border border-blue-300 rounded px-1 py-0.5"
                          disabled={saving}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                    ) : (
                      <Badge variant={statusVariant[record.status as keyof typeof statusVariant]}>
                        {statusLabel[record.status as keyof typeof statusLabel]}
                      </Badge>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-3">
                      {overrideId === record.id ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" onClick={() => handleOverride(record.id)} disabled={saving}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setOverrideId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-600"
                          onClick={() => startOverride(record)}
                        >
                          Override
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {records.length > DEFAULT_VISIBLE && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-2">
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
