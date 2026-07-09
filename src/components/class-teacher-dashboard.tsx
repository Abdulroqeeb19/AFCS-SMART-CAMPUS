'use client'

import { useEffect, useState } from 'react'
import { TeacherAttendanceForm } from '@/components/teacher-attendance-form'
import { StudentActivityReportForm } from '@/components/student-activity-report-form'
import { TodayBanner } from '@/components/today-banner'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/skeleton'
import {
  GraduationCap, Users, BookOpen, ClipboardCheck, Clock, CheckCircle2,
} from 'lucide-react'

type Tab = 'attendance' | 'report'

interface StudentInfo {
  id: string
  student_id: string
  full_name: string
}

interface MyClassData {
  classes: { id: string; name: string; arm: string; students: StudentInfo[] }[]
  total_students: number
  checked_in: number
  date: string
}

export function ClassTeacherDashboard() {
  const [tab, setTab] = useState<Tab>('attendance')
  const [data, setData] = useState<MyClassData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/classes/my')
        if (res.ok) { setData(await res.json())}
      } catch {}
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const totalStudents = data?.total_students || 0
  const checkedIn = data?.checked_in || 0
  const checkedOutRate = checkedIn > 0 ? Math.round((checkedIn / Math.max(totalStudents, 1)) * 100) : 0
  const classesCount = data?.classes?.length || 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-3 bg-violet-100">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">My Classes</p>
              <p className="text-2xl font-bold text-zinc-900">{classesCount}</p>
              <p className="text-xs text-zinc-400">{data?.classes?.map((c) => `${c.name} ${c.arm}`).join(', ') || '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-3 bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Students</p>
              <p className="text-2xl font-bold text-zinc-900">{totalStudents}</p>
              <p className="text-xs text-zinc-400">Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-3 bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Checked In</p>
              <p className="text-2xl font-bold text-zinc-900">{checkedIn}</p>
              <p className="text-xs text-zinc-400">{checkedOutRate}% today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-3 bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Remaining</p>
              <p className="text-2xl font-bold text-zinc-900">{totalStudents - checkedIn}</p>
              <p className="text-xs text-zinc-400">Not checked in</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-blue-50 p-1 w-fit">
          <button
            onClick={() => setTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'attendance'
                ? 'bg-[#001A4D] text-white shadow-sm'
                : 'text-blue-700 hover:text-[#001A4D]'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            My Class
          </button>
          <button
            onClick={() => setTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'report'
                ? 'bg-[#001A4D] text-white shadow-sm'
                : 'text-blue-700 hover:text-[#001A4D]'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Activity Report
          </button>
        </div>
        <TodayBanner />
      </div>

      {tab === 'attendance' && <TeacherAttendanceForm />}
      {tab === 'report' && <StudentActivityReportForm />}
    </div>
  )
}
