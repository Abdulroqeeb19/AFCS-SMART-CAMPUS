'use client'

import { Card, CardContent } from './ui/card'
import { GraduationCap, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface Props {
  total: number
  present: number
  late: number
  absent: number
}

export function StudentAttendanceStats({ total, present, late, absent }: Props) {
  const stats = [
    {
      label: 'Total Students',
      value: total,
      icon: GraduationCap,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Present',
      value: present,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Late',
      value: late,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Absent',
      value: absent,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-full p-2.5 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
