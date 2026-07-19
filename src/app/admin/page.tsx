'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AttendanceStats } from '@/components/attendance-stats'
import { AttendanceTable } from '@/components/attendance-table'
import { DailySummary } from '@/components/daily-summary'
import { RecentActivity } from '@/components/recent-activity'
import { StudentAttendanceStats } from '@/components/student-attendance-stats'
import { StudentAttendanceTable } from '@/components/student-attendance-table'
import { StudentActivityReportsView } from '@/components/student-activity-reports-view'
import { StatsSkeleton, TableSkeleton } from '@/components/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'
import {
  AlertCircle, RefreshCw, Users, ChevronRight, Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { StaffAttendance, DailyReport, StudentAttendance } from '@/lib/database.types'

interface StudentReportData {
  total_students: number
  present: number
  late: number
  absent: number
  class_breakdown: { class: string; present: number; late: number; absent: number; total: number }[]
  records: StudentAttendance[]
}

type Tab = 'overview' | 'staff' | 'students'

function safeJson(res: Response) {
  try { return res.json() } catch { return null }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (!user) { router.replace('/login'); return }
    if (user.role === 'commandant') { router.replace('/dashboard'); return }
    if (user.role === 'teacher') { router.replace('/teacher-dashboard'); return }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#001A4D]" />
      </div>
    )
  }

  if (user.role !== 'admin') return null

  return <AdminDashboardContent />
}

function AdminDashboardContent() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ staffReport: DailyReport | null; staffRecords: StaffAttendance[]; studentData: StudentReportData | null }>({
    staffReport: null, staffRecords: [], studentData: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const [staffRes, studentRes] = await Promise.all([
        fetch('/api/attendance/report', { signal: controller.signal }).then(safeJson),
        fetch('/api/attendance/student/report', { signal: controller.signal }).then(safeJson),
      ])
      clearTimeout(timeout)

      setData({
        staffReport: (staffRes?.report as DailyReport) || null,
        staffRecords: (staffRes?.records || []) as StaffAttendance[],
        studentData: studentRes as StudentReportData | null,
      })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError('Failed to load data. Check your connection.')
    }
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  const { staffReport, staffRecords, studentData } = data

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'staff' as const, label: 'Staff Attendance' },
    { id: 'students' as const, label: 'Student Attendance' },
  ]

  if (loading && !staffReport && !studentData) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        </div>
        <StatsSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  return (
    <>
      <ErrorBoundary>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
                <Badge variant="info" className="text-xs">Admin</Badge>
              </div>
              <p className="text-zinc-500 text-sm mt-0.5">Staff & student attendance overview</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-zinc-400 hidden sm:block">Updated {lastUpdated.toLocaleTimeString()}</p>
              <button onClick={() => { setLoading(true); loadData() }} disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-blue-50 p-1 w-fit">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t.id ? 'bg-[#001A4D] text-white shadow-sm' : 'text-blue-700 hover:text-[#001A4D]'
                  }`}>
                  {t.id === 'overview' && <Users className="h-4 w-4" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              {staffReport && (
                <>
                  <AttendanceStats total={staffReport.total_staff} present={staffReport.present} late={staffReport.late} absent={staffReport.absent} />
                  <DailySummary report={staffReport} />
                  <RecentActivity records={staffRecords} />
                </>
              )}
              {studentData && (
                <StudentAttendanceStats total={studentData.total_students} present={studentData.present} late={studentData.late} absent={studentData.absent} />
              )}
              <StudentActivityReportsView />
            </div>
          )}

          {tab === 'staff' && (
            <div className="space-y-6">
              {staffReport && <AttendanceStats total={staffReport.total_staff} present={staffReport.present} late={staffReport.late} absent={staffReport.absent} />}
              <AttendanceTable records={staffRecords} />
              {staffReport && staffReport.department_breakdown?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" /> Department Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {staffReport.department_breakdown.map((dept) => (
                        <Link key={dept.department} href={`/staff?department=${encodeURIComponent(dept.department)}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition-colors group">
                          <span className="text-sm font-medium text-zinc-700">{dept.department}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400">{dept.present}/{dept.total} present</span>
                            <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {tab === 'students' && (
            <div className="space-y-6">
              {studentData && (
                <StudentAttendanceStats total={studentData.total_students} present={studentData.present} late={studentData.late} absent={studentData.absent} />
              )}
              <StudentAttendanceTable records={studentData?.records || []} />
            </div>
          )}
        </div>
      </ErrorBoundary>
    </>
  )
}
