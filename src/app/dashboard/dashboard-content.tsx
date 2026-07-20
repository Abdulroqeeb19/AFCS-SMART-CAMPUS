'use client'

import { useEffect, useState, useCallback } from 'react'
import { AttendanceStats } from '@/components/attendance-stats'
import { AttendanceTable } from '@/components/attendance-table'
import { DailySummary } from '@/components/daily-summary'
import { DashboardChart } from '@/components/dashboard-chart'
import { RecentActivity } from '@/components/recent-activity'
import { StudentRecentActivity } from '@/components/student-recent-activity'
import { StudentActivityReportsView } from '@/components/student-activity-reports-view'
import { StudentAttendanceStats } from '@/components/student-attendance-stats'
import { StudentAttendanceTable } from '@/components/student-attendance-table'
import { StudentChart } from '@/components/student-chart'
import { StatsSkeleton, TableSkeleton } from '@/components/skeleton'
import { CollapsibleSection } from '@/components/collapsible-section'
import { CollapsibleCard } from '@/components/collapsible-card'
import { useAuth } from '@/contexts/auth-context'
import {
  AlertCircle,
  RefreshCw,
  BrainCircuit,
  Users,
  GraduationCap,
  ChevronRight,
  Database,
  Shield,
  ListChecks,
  LayoutDashboard,
  Clock,
  Loader2,
  MessageSquare,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Hint } from '@/components/hint'
import Link from 'next/link'
import type { StaffAttendance, DailyReport, StudentAttendance } from '@/lib/database.types'

interface StudentReportData {
  total_students: number
  present: number
  late: number
  absent: number
  checked_out: number
  class_breakdown: { class: string; present: number; late: number; absent: number; total: number; checked_out: number }[]
  records: StudentAttendance[]
}

type Tab = 'overview' | 'staff' | 'students'

function safeJson(res: Response) {
  try { return res.json() } catch { return null }
}

export function DashboardContent() {
  const { isAdminOrCommandant } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [staffError, setStaffError] = useState<string | null>(null)
  const [studentError, setStudentError] = useState<string | null>(null)

  const [staffReport, setStaffReport] = useState<DailyReport | null>(null)
  const [staffRecords, setStaffRecords] = useState<StaffAttendance[]>([])
  const [studentData, setStudentData] = useState<StudentReportData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [nextPeriod, setNextPeriod] = useState<{ number: number; time: string; is_break?: boolean; is_assembly?: boolean } | null>(null)
  const [nextPeriodMessage, setNextPeriodMessage] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nextPeriodEntries, setNextPeriodEntries] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [taskResponses, setTaskResponses] = useState<any[]>([])
  const [weeklyDuty, setWeeklyDuty] = useState<{ date: string; staff: { id: string; staff_id: string; full_name: string } | null; status: string }[]>([])
  const [todayDuty, setTodayDuty] = useState<{ staff: { id: string; staff_id: string; full_name: string } | null } | null>(null)

  const loadData = useCallback(async () => {
    setIsRefreshing(true)
    setStaffError(null)
    setStudentError(null)
    setNextPeriodMessage(null)
    setWeeklyDuty([])
    setTodayDuty(null)

    const todayStr = new Date().toISOString().split('T')[0]

    const [staffRes, studentRes, timetableRes, taskRes, dutyRes] = await Promise.all([
      fetch('/api/attendance/report').catch(() => null),
      fetch('/api/attendance/student/report').catch(() => null),
      fetch('/api/timetable/next-period').catch(() => null),
      isAdminOrCommandant ? fetch('/api/dashboard/task-responses?limit=20').catch(() => null) : Promise.resolve(null),
      fetch('/api/duty/week').catch(() => null),
    ])

    if (dutyRes?.ok) {
      const dutyData = await safeJson(dutyRes)
      if (dutyData) {
        setWeeklyDuty(dutyData.schedule || [])
        setTodayDuty(dutyData.today || null)
      }
    }

    if (staffRes?.ok) {
      const data = await safeJson(staffRes)
      if (data) {
        setStaffReport({
          date: data.date,
          total_staff: data.total_staff,
          present: data.present,
          late: data.late,
          absent: data.absent,
          department_breakdown: data.department_breakdown,
        })
        setStaffRecords(data.records || [])
      } else {
        setStaffError('Failed to parse staff data')
      }
    } else if (staffRes) {
      setStaffError(`Staff API error (${staffRes.status})`)
    } else {
      setStaffError('Staff API unreachable')
    }

    if (studentRes?.ok) {
      const data = await safeJson(studentRes)
      if (data) {
        setStudentData({
          total_students: data.total_students,
          present: data.present,
          late: data.late,
          absent: data.absent,
          checked_out: data.checked_out || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class_breakdown: (data.class_breakdown || []).map((d: any) => ({
            ...d,
            total: d.total ?? d.present + d.late + d.absent,
            checked_out: d.checked_out || 0,
          })),
          records: data.records || [],
        })
      }
    } else if (studentRes) {
      setStudentError(`Student tables may not exist yet. Run student schema migration.`)
    }

    if (timetableRes?.ok) {
      const t = await safeJson(timetableRes)
      if (t?.next_period) {
        setNextPeriod(t.next_period)
        setNextPeriodEntries(t.entries || [])
      } else {
        setNextPeriod(null)
        setNextPeriodEntries([])
      }
      if (t?.message && !t?.next_period) {
        setNextPeriodMessage(t.message)
      } else {
        setNextPeriodMessage(null)
      }
    }

    if (taskRes?.ok) {
      const r = await safeJson(taskRes)
      setTaskResponses(r || [])
    } else {
      setTaskResponses([])
    }

    setLastUpdated(new Date())
    setLoading(false)
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const tabs: { id: Tab; label: string; description: string }[] = [
    { id: 'overview', label: 'Overview', description: 'Combined staff & student summary' },
    { id: 'staff', label: 'Staff Attendance', description: 'Staff check-in details & analytics' },
    { id: 'students', label: 'Student Attendance', description: 'Student check-in by class' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <TableSkeleton rows={5} />
          <TableSkeleton rows={5} />
        </div>
      </div>
    )
  }

  const staffChartData = staffReport?.department_breakdown.map((d) => ({
    label: d.department,
    present: d.present,
    late: d.late,
    absent: d.absent,
  })) || []

  const studentChartData = studentData?.class_breakdown.map((d) => ({
    class: d.class,
    present: d.present,
    late: d.late,
    absent: d.absent,
    total: d.total,
  })) || []

  const combinedTotalStaff = staffReport?.total_staff || 0
  const combinedTotalStudents = studentData?.total_students || 0
  const combinedStaffPresent = (staffReport?.present || 0) + (staffReport?.late || 0)
  const combinedStudentPresent = (studentData?.present || 0) + (studentData?.late || 0)
  const totalCheckedOut = studentData?.checked_out || 0
  const classesWithAttendance = (studentData?.class_breakdown || []).filter((c) => c.present + c.late > 0).length

  return (
    <div className="space-y-6">
      {/* Connection status bar */}
      {(staffError || studentError) && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 px-4 py-2.5 text-sm text-[var(--color-warning)]">
          <Database className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {staffError && `Staff: ${staffError}`}
            {staffError && studentError && ' | '}
            {studentError && `Students: ${studentError}`}
          </span>
          <Button onClick={loadData} variant="ghost" size="sm" className="text-[var(--color-warning)] gap-1 shrink-0">
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </div>
      )}

      {/* Fixed bottom-left notification toast */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm">
        {staffError && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-danger)]/30 shadow-lg px-4 py-3 text-sm text-[var(--color-danger)] animate-in slide-in-from-left">
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-danger)]" />
            <span className="flex-1">{staffError}</span>
            <button onClick={loadData} className="text-[var(--color-danger)] hover:text-[var(--color-danger)] font-medium ml-2 shrink-0">
              Retry
            </button>
          </div>
        )}
        {studentError && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-warning)]/30 shadow-lg px-4 py-3 text-sm text-[var(--color-warning)] animate-in slide-in-from-left">
            <Database className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
            <span className="flex-1">{studentError}</span>
            <button onClick={loadData} className="text-[var(--color-warning)] hover:text-[var(--color-warning)] font-medium ml-2 shrink-0">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-[var(--color-info)]/10 p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] shadow-sm'
                  : 'text-[var(--color-info)] hover:text-[var(--color-bg-sidebar)]'
              }`}
            >
              {t.id === 'overview' && <LayoutDashboard className="h-4 w-4" />}
              {t.id === 'staff' && <Users className="h-4 w-4" />}
              {t.id === 'students' && <GraduationCap className="h-4 w-4" />}
              {t.label}
            </button>
          ))}
        </div>
        <Hint text="Switch between combined Overview, Staff attendance details, and Student attendance by class. Data refreshes every 30 seconds." />
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full p-3 bg-[var(--color-info)]/20">
                  <Users className="h-5 w-5 text-[var(--color-info)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Staff Total</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{combinedTotalStaff}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{combinedStaffPresent} checked in</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full p-3 bg-[var(--color-accent)]/10">
                  <GraduationCap className="h-5 w-5 text-[var(--color-accent)]/70" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Students Total</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{combinedTotalStudents || 0}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{combinedStudentPresent} checked in</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full p-3 bg-[var(--color-success)]/20">
                  <Users className="h-5 w-5 text-[var(--color-success)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Staff Present</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{staffReport?.present ?? 0}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{staffReport?.late ?? 0} late</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-full p-3 bg-[var(--color-warning)]/20">
                  <GraduationCap className="h-5 w-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Students Present</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{studentData?.present ?? 0}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{studentData?.late ?? 0} late · {totalCheckedOut} checked out</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CollapsibleCard
              title="Staff Summary"
              icon={<Users className="h-4 w-4 text-[var(--color-info)]" />}
              actions={
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setTab('staff')}>
                  Details <ChevronRight className="h-3 w-3" />
                </Button>
              }
            >
              {staffReport ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Present</span>
                    <span className="font-medium text-[var(--color-success)]">{staffReport.present}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Late</span>
                    <span className="font-medium text-[var(--color-warning)]">{staffReport.late}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Absent</span>
                    <span className="font-medium text-[var(--color-danger)]">{staffReport.absent}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <div className="flex h-3 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                      <div className="bg-[var(--color-success)] transition-all" style={{ width: `${(staffReport.present / Math.max(staffReport.total_staff, 1)) * 100}%` }} />
                      <div className="bg-[var(--color-warning)] transition-all" style={{ width: `${(staffReport.late / Math.max(staffReport.total_staff, 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Staff data unavailable</p>
              )}
            </CollapsibleCard>

            <CollapsibleCard
              title="Student Summary"
              icon={<GraduationCap className="h-4 w-4 text-[var(--color-accent)]/70" />}
              actions={
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setTab('students')}>
                  Details <ChevronRight className="h-3 w-3" />
                </Button>
              }
            >
              {studentData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Present</span>
                    <span className="font-medium text-[var(--color-success)]">{studentData.present}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Late</span>
                    <span className="font-medium text-[var(--color-warning)]">{studentData.late}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Absent</span>
                    <span className="font-medium text-[var(--color-danger)]">{studentData.absent}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--color-border)]">
                    <div className="flex h-3 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                      <div className="bg-[var(--color-success)] transition-all" style={{ width: `${(studentData.present / Math.max(studentData.total_students, 1)) * 100}%` }} />
                      <div className="bg-[var(--color-warning)] transition-all" style={{ width: `${(studentData.late / Math.max(studentData.total_students, 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">Student data unavailable. Run student schema migration.</p>
              )}
            </CollapsibleCard>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Link href="/check-in">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-[var(--color-info)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Staff Check-In</p>
                    <p className="text-xs text-[var(--color-text-muted)]">By personnel</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/check-out">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-[var(--color-warning)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Staff Check-Out</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Record departure</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/student-checkin">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[var(--color-accent)]/70" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Student Check-In</p>
                    <p className="text-xs text-[var(--color-text-muted)]">By personnel</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/student-checkout">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[var(--color-warning)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Student Check-Out</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Record departure</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/staff">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-[var(--color-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Manage Staff</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Admin only</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/my-tasks">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-[var(--color-accent)]/70" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Daily To-Do</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Your personal checklist</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/students">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-[var(--color-warning)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Manage Students</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Admin only</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/muster-parade">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[var(--color-info)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Tasks Assignment</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Assign & track tasks</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CollapsibleCard
              title="Next Period"
              icon={<Clock className="h-4 w-4 text-[var(--color-info)]" />}
            >
              {nextPeriod ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Period {nextPeriod.number}</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{nextPeriod.time}</span>
                  </div>
                  {nextPeriod.is_break && (
                    <p className="text-[var(--color-warning)] font-medium">Break Period</p>
                  )}
                  {nextPeriod.is_assembly && (
                    <p className="text-[var(--color-accent)]/70 font-medium">Assembly</p>
                  )}
                  {nextPeriodEntries.length > 0 ? (
                    <div className="mt-2 space-y-1.5 border-t border-[var(--color-border)] pt-2">
                      {nextPeriodEntries.slice(0, 4).map((e, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-secondary)]">{e.class?.name} {e.class?.arm}</span>
                          <span className="text-[var(--color-text-secondary)]">{e.subject?.name} — {e.teacher?.full_name?.split(' ')[0]}</span>
                        </div>
                      ))}
                      {nextPeriodEntries.length > 4 && (
                        <p className="text-xs text-[var(--color-text-muted)]">+{nextPeriodEntries.length - 4} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">No classes scheduled</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-[var(--color-text-muted)]">
                  {loading ? 'Loading...' : nextPeriodMessage || 'No upcoming periods today'}
                </div>
              )}
            </CollapsibleCard>

            {isAdminOrCommandant && (
              <CollapsibleCard
                title="Live Task Responses"
                icon={<MessageSquare className="h-4 w-4 text-[var(--color-success)]" />}
                actions={
                  taskResponses.length > 0 ? (
                    <span className="text-xs font-normal text-[var(--color-text-muted)]">
                      {taskResponses.filter((r: any) => r.response_type === 'acknowledged').length} ack · {taskResponses.filter((r: any) => r.response_type === 'completed').length} done
                    </span>
                  ) : undefined
                }
              >
                {taskResponses.length > 0 ? (
                  <div className="space-y-2">
                    <CollapsibleSection
                      items={taskResponses}
                      keyExtractor={(r: any) => r.id}
                      renderItem={(r: any) => (
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm">
                          <div className="shrink-0 mt-0.5">
                            {r.response_type === 'acknowledged' && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-info)]/20 text-[var(--color-info)] text-xs font-bold">✓</span>
                            )}
                            {r.response_type === 'completed' && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-success)]/20 text-[var(--color-success)] text-xs font-bold">✓</span>
                            )}
                            {r.response_type === 'issue_reported' && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-danger)]/20 text-[var(--color-danger)] text-xs font-bold">!</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[var(--color-text-primary)] truncate">
                                {r.staff?.full_name || 'Unknown'}
                              </span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                                r.response_type === 'acknowledged' ? 'bg-[var(--color-info)]/20 text-[var(--color-info)]' :
                                r.response_type === 'completed' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                                'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
                              }`}>
                                {r.response_type === 'acknowledged' ? 'Acknowledged' :
                                 r.response_type === 'completed' ? 'Completed' : 'Issue'}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                              {r.task?.description || 'Task'}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                              {new Date(r.responded_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      defaultVisible={5}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                    No task responses yet. Assign tasks via Telegram to receive live updates.
                  </p>
                )}
              </CollapsibleCard>
            )}

            <CollapsibleCard
              title="Class Attendance Activity"
              icon={<GraduationCap className="h-4 w-4 text-[var(--color-accent)]/70" />}
            >
              {studentChartData.length > 0 ? (
                <div className="space-y-2">
                  <CollapsibleSection
                    items={studentChartData.filter((c) => c.present + c.late > 0).sort((a, b) => (b.present + b.late) - (a.present + a.late))}
                    keyExtractor={(c: any) => c.class}
                    renderItem={(c: any) => {
                      const t = c.total || c.present + c.late + c.absent
                      const checkedOut = c.checked_out || 0
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[var(--color-text-primary)]">{c.class}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {checkedOut > 0
                                ? `${checkedOut} checked out`
                                : `${c.present + c.late}/${t} present`}
                            </span>
                          </div>
                          <div className="flex h-2 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                            <div className="bg-[var(--color-success)]" style={{ width: `${(c.present / Math.max(t, 1)) * 100}%` }} />
                            <div className="bg-[var(--color-warning)]" style={{ width: `${(c.late / Math.max(t, 1)) * 100}%` }} />
                          </div>
                        </div>
                      )
                    }}
                    defaultVisible={5}
                  />
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {loading ? 'Loading...' : 'No class attendance recorded yet by class teachers'}
                </p>
              )}
            </CollapsibleCard>

            <StudentRecentActivity records={studentData?.records || []} />
            <StudentActivityReportsView />
          </div>

          <CollapsibleCard
            title="This Week's Duty Roster"
            icon={<CalendarDays className="h-4 w-4 text-[var(--color-info)]" />}
            actions={
              <Link href="/duty-roster" className="text-xs text-[var(--color-info)] hover:text-[var(--color-info)] font-medium">
                Manage &rarr;
              </Link>
            }
          >
            {weeklyDuty.length > 0 ? (
              <div className="space-y-2">
                {weeklyDuty.map((d) => {
                  const dateObj = new Date(d.date + 'T00:00:00')
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                  const isToday = d.date === new Date().toISOString().split('T')[0]
                  return (
                    <div key={d.date} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${isToday ? 'border-blue-300 bg-[var(--color-info)]/10' : 'border-[var(--color-border)]'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold w-8 ${isToday ? 'text-[var(--color-info)]' : 'text-[var(--color-text-secondary)]'}`}>{dayName}</span>
                        <span className={`font-medium ${isToday ? 'text-[var(--color-info)]' : 'text-[var(--color-text-primary)]'}`}>
                          {d.staff ? d.staff.full_name : <span className="text-[var(--color-text-muted)] italic">Unassigned</span>}
                        </span>
                        {isToday && <Badge variant="info" className="text-[10px]">Today</Badge>}
                      </div>
                      {d.staff && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">{d.staff.staff_id}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-sm text-[var(--color-text-muted)]">
                <CalendarDays className="h-5 w-5 mr-2" />
                No duty roster for this week
              </div>
            )}
          </CollapsibleCard>

          <CollapsibleCard
            title="Commandant AI Insights"
            icon={<BrainCircuit className="h-4 w-4 text-[var(--color-accent)]" />}
            actions={
              <Hint text="Automated insights generated from today's attendance data. Highlights late arrivals, absentee rates above 20%, and perfect attendance." />
            }
            className="border-[var(--color-accent)]/30 bg-[var(--color-accent-light)]/20"
          >
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              {!staffReport && !studentData && (
                <p className="text-[var(--color-text-muted)]">Connect Supabase and run migrations to see insights.</p>
              )}
              {staffReport && staffReport.present === 0 && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-text-muted)] mt-0.5">•</span>
                  <span>No staff attendance recorded yet today.</span>
                </p>
              )}
              {staffReport && staffReport.late > 3 && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-0.5">•</span>
                  <span>{staffReport.late} staff arrived late today.</span>
                </p>
              )}
              {staffReport && staffReport.absent > staffReport.total_staff * 0.2 && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-danger)] mt-0.5">•</span>
                  <span>Staff absentee: {(staffReport.absent / staffReport.total_staff * 100).toFixed(0)}%.</span>
                </p>
              )}
              {studentData && studentData.absent > studentData.total_students * 0.15 && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-danger)] mt-0.5">•</span>
                  <span>Student absentee: {(studentData.absent / studentData.total_students * 100).toFixed(0)}%.</span>
                </p>
              )}
              {studentData && totalCheckedOut > 0 && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-info)] mt-0.5">•</span>
                  <span>{totalCheckedOut} student{totalCheckedOut !== 1 ? 's' : ''} checked out. Session{totalCheckedOut !== 1 ? 's' : ''} completed.</span>
                </p>
              )}
              {studentData && classesWithAttendance > 0 && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)]/70 mt-0.5">•</span>
                  <span>{classesWithAttendance} class{classesWithAttendance !== 1 ? 'es' : ''} with attendance recorded by class teachers.</span>
                </p>
              )}
              {staffReport && staffReport.present === staffReport.total_staff && (
                <p className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5">•</span>
                  <span>100% staff attendance today!</span>
                </p>
              )}
            </div>
          </CollapsibleCard>

          <div className="flex items-center justify-end gap-2">
            {isRefreshing && <Loader2 className="h-3 w-3 animate-spin text-[var(--color-text-muted)]" />}
            <p className="text-[10px] text-[var(--color-text-muted)]">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* STAFF TAB */}
      {tab === 'staff' && (
        <div className="space-y-6">
          {staffReport ? (
            <>
              <AttendanceStats
                total={staffReport.total_staff}
                present={staffReport.present}
                late={staffReport.late}
                absent={staffReport.absent}
              />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <DashboardChart data={staffChartData} />
                  <AttendanceTable
                    records={staffRecords}
                    title="Today's Staff Attendance"
                    isAdmin={isAdminOrCommandant}
                  />
                </div>
                <div className="space-y-6">
                  <DailySummary report={staffReport} />
                  <RecentActivity records={staffRecords} />
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-10 w-10 text-[var(--color-warning)] mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)] text-sm">{staffError || 'Staff data unavailable'}</p>
                <Button onClick={loadData} variant="outline" size="sm" className="mt-4 gap-2">
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* STUDENTS TAB */}
      {tab === 'students' && (
        <div className="space-y-6">
          {studentData ? (
            <>
              <StudentAttendanceStats
                total={studentData.total_students}
                present={studentData.present}
                late={studentData.late}
                absent={studentData.absent}
              />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <StudentChart data={studentChartData} />
                  <StudentAttendanceTable
                    records={studentData.records}
                    title="Today's Student Attendance"
                  />
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-[var(--color-accent)]/70" />
                        Class Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentChartData.length > 0 ? (
                        <CollapsibleSection
                          items={studentChartData}
                          keyExtractor={(c: any) => c.class}
                          renderItem={(c: any) => {
                            const t = c.total || c.present + c.late + c.absent
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-[var(--color-text-primary)]">{c.class}</span>
                                  <span className="text-xs text-[var(--color-text-muted)]">{c.present + c.late}/{t}</span>
                                </div>
                                <div className="flex h-2 w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                                  <div className="bg-[var(--color-success)]" style={{ width: `${(c.present / Math.max(t, 1)) * 100}%` }} />
                                  <div className="bg-[var(--color-warning)]" style={{ width: `${(c.late / Math.max(t, 1)) * 100}%` }} />
                                </div>
                              </div>
                            )
                          }}
                          defaultVisible={5}
                        />
                      ) : (
                        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No class data</p>
                      )}
                    </CardContent>
                  </Card>
                  <Link href="/student-checkin">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <GraduationCap className="h-4 w-4" /> Check In Students
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-10 w-10 text-[var(--color-accent)]/50 mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)] text-sm font-medium">Student attendance not available</p>
                <p className="text-[var(--color-text-muted)] text-xs mt-1">
                  {studentError || 'Run the student schema migration (003_student_schema.sql) in Supabase'}
                </p>
                <Button onClick={loadData} variant="outline" size="sm" className="mt-4 gap-2">
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
