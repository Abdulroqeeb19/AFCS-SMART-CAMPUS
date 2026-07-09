'use client'

import { useEffect, useState, useCallback } from 'react'
import { StudentAttendanceStats } from '@/components/student-attendance-stats'
import { StudentAttendanceTable } from '@/components/student-attendance-table'
import { StudentChart } from '@/components/student-chart'
import { StatsSkeleton, TableSkeleton } from '@/components/skeleton'
import { AlertCircle, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { StudentAttendance } from '@/lib/database.types'

interface ClassBreakdown {
  class: string
  class_id: string
  total: number
  present: number
  late: number
  absent: number
}

interface ReportData {
  date: string
  total_students: number
  present: number
  late: number
  absent: number
  class_breakdown: ClassBreakdown[]
  records: StudentAttendance[]
}

export function StudentAttendanceContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReportData | null>(null)
  const [classes, setClasses] = useState<{ id: string; name: string; arm: string }[]>([])
  const [selectedClass, setSelectedClass] = useState('')

  useEffect(() => {
    fetch('/api/classes').then(r => r.ok && r.json()).then(setClasses).catch(() => {})
  }, [])

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (selectedClass) params.set('class_id', selectedClass)
      const res = await fetch(`/api/attendance/student/report?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      setData(await res.json())
    } catch (err) {
      setError('Unable to load student attendance data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedClass])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><TableSkeleton rows={6} /></div>
          <div><TableSkeleton rows={4} /></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {data && (
        <StudentAttendanceStats
          total={data.total_students}
          present={data.present}
          late={data.late}
          absent={data.absent}
        />
      )}

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-zinc-400" />
        <select
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setLoading(true) }}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <StudentAttendanceTable records={data?.records || []} />
        </div>
        <div className="space-y-6">
          <StudentChart data={data?.class_breakdown || []} />
        </div>
      </div>
    </div>
  )
}
