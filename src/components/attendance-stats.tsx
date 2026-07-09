'use client'

import { Card, CardContent } from './ui/card'
import { Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface Props {
  total: number
  present: number
  late: number
  absent: number
}

export function AttendanceStats({ total, present, late, absent }: Props) {
  const stats = [
    {
      label: 'Total Staff',
      value: total,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-full p-3 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
