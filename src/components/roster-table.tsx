'use client'

import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CollapsibleSection } from './collapsible-section'
import type { DutyRoster } from '@/lib/database.types'
import { Calendar, ClipboardList } from 'lucide-react'

interface Props {
  rosters: DutyRoster[]
  title?: string
  onStatusChange?: (id: string, status: string) => void
}

const statusVariant = {
  pending: 'warning' as const,
  completed: 'success' as const,
  missed: 'danger' as const,
}

const statusLabel = {
  pending: 'Pending',
  completed: 'Completed',
  missed: 'Missed',
}

export function RosterTable({ rosters, title = 'Duty Rosters', onStatusChange }: Props) {
  if (rosters.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <ClipboardList className="h-14 w-14 mb-3 stroke-1" />
            <p className="text-sm font-medium text-zinc-500">No duty rosters found</p>
            <p className="text-xs mt-1">Generate a roster to get started</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>
        <p className="text-sm text-zinc-500">{rosters.length} assignment{rosters.length !== 1 ? 's' : ''}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-sm text-zinc-500">
                <th className="px-6 py-3 font-medium">Staff</th>
                <th className="px-6 py-3 font-medium">Duty</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                {onStatusChange && <th className="px-6 py-3 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <CollapsibleSection
                items={rosters}
                keyExtractor={(r: DutyRoster) => r.id}
                defaultVisible={8}
                renderItem={(r: DutyRoster) => (
                  <tr className="text-sm hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-medium text-zinc-900">{r.staff?.full_name || 'Unknown'}</span>
                      <p className="text-xs text-zinc-400">{r.staff?.staff_id}</p>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.duty_type?.color || '#3b82f6' }} />
                        <span>{r.duty_type?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{r.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={statusVariant[r.status as keyof typeof statusVariant]}>{statusLabel[r.status as keyof typeof statusLabel]}</Badge>
                    </td>
                    {onStatusChange && (
                      <td className="px-6 py-3">
                        <select
                          value={r.status}
                          onChange={(e) => onStatusChange(r.id, e.target.value)}
                          className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="missed">Missed</option>
                        </select>
                      </td>
                    )}
                  </tr>
                )}
              />
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
