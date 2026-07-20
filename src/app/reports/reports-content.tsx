'use client'

import { useEffect, useState, useCallback } from 'react'
import { ReportList } from '@/components/report-list'
import { CollapsibleSection } from '@/components/collapsible-section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle, RefreshCw, BrainCircuit, FileText, Filter,
  Download, ListChecks, Users, ChevronDown, ChevronUp,
} from 'lucide-react'

type Tab = 'daily' | 'tasks' | 'attendance'

export function ReportsContent() {
  const [tab, setTab] = useState<Tab>('tasks')

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-[var(--color-info)]/10 p-1 w-fit">
          <button
            onClick={() => setTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'tasks' ? 'bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] shadow-sm' : 'text-[var(--color-info)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Task Reports
          </button>
          <button
            onClick={() => setTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'attendance' ? 'bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] shadow-sm' : 'text-[var(--color-info)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Users className="h-4 w-4" />
            Attendance Reports
          </button>
          <button
            onClick={() => setTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'daily' ? 'bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] shadow-sm' : 'text-[var(--color-info)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <FileText className="h-4 w-4" />
            Daily Reports
          </button>
        </div>
      </div>

      {tab === 'tasks' && <TaskReportsTab />}
      {tab === 'attendance' && <AttendanceReportsTab />}
      {tab === 'daily' && <DailyReportsTab />}
    </div>
  )
}

/* ─── Task Reports Tab ─── */
function TaskReportsTab() {
  const [tasks, setTasks] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFrom) params.set('from', filterFrom)
      if (filterTo) params.set('to', filterTo)
      const res = await fetch(`/api/reports/tasks?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setSummary(data.summary)
      }
    } finally {
      setLoading(false)
    }
  }, [filterFrom, filterTo])

  useEffect(() => { loadData() }, [loadData])

  const downloadCsv = () => {
    const params = new URLSearchParams({ format: 'csv' })
    if (filterFrom) params.set('from', filterFrom)
    if (filterTo) params.set('to', filterTo)
    window.open(`/api/reports/tasks?${params}`, '_blank')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-[var(--color-text-muted)] text-sm">Loading task reports...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]" />
          <span className="text-xs text-[var(--color-text-muted)]">to</span>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]" />
        </div>
        <Button size="sm" variant="outline" onClick={loadData} className="gap-1.5">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
        <Button size="sm" onClick={downloadCsv} className="gap-1.5 ml-auto">
          <Download className="h-3 w-3" /> Download CSV
        </Button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{summary.total}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-warning)]">{summary.pending}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Pending</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-success)]">{summary.completed}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Completed</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-info)]">{summary.acknowledged}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Acknowledged</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-success)]">{summary.done_with_response}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Done via Telegram</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-danger)]">{summary.issues}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Issues</p>
          </CardContent></Card>
        </div>
      )}

      {/* Task table */}
      {tasks.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Parade</th>
                    <th className="px-4 py-3 font-medium">Responses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  <CollapsibleSection
                    items={tasks}
                    keyExtractor={(t: any) => t.id}
                    defaultVisible={10}
                    renderItem={(t: any) => (
                      <tr className="text-sm hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <p className="truncate font-medium text-[var(--color-text-primary)]">{t.description}</p>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{t.assignee_name}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : 'info'}>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={t.priority === 'high' || t.priority === 'urgent' ? 'danger' : 'info'}>
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                          {t.parade_date ? `${t.parade_type} (${t.parade_date})` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {t.responses.some((r: any) => r.type === 'acknowledged') && (
                              <span className="text-[10px] bg-[var(--color-info)]/20 text-[var(--color-info)] px-1.5 py-0.5 rounded-full">Ack</span>
                            )}
                            {t.responses.some((r: any) => r.type === 'completed') && (
                              <span className="text-[10px] bg-[var(--color-success)]/20 text-[var(--color-success)] px-1.5 py-0.5 rounded-full">Done</span>
                            )}
                            {t.responses.some((r: any) => r.type === 'issue_reported') && (
                              <span className="text-[10px] bg-[var(--color-danger)]/20 text-[var(--color-danger)] px-1.5 py-0.5 rounded-full">Issue</span>
                            )}
                            {t.responses.length === 0 && (
                              <span className="text-[10px] text-[var(--color-text-muted)]">None</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-12 text-center text-[var(--color-text-muted)] text-sm">No tasks found for the selected period.</CardContent></Card>
      )}
    </div>
  )
}

/* ─── Attendance Reports Tab ─── */
function AttendanceReportsTab() {
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance/report?date=${filterDate}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
        setSummary(data)
      }
    } finally {
      setLoading(false)
    }
  }, [filterDate])

  useEffect(() => { loadData() }, [loadData])

  const downloadCsv = () => {
    window.open(`/api/attendance/report?date=${filterDate}&format=csv`, '_blank')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-[var(--color-text-muted)] text-sm">Loading attendance reports...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]" />
        </div>
        <Button size="sm" variant="outline" onClick={loadData} className="gap-1.5">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
        <Button size="sm" onClick={downloadCsv} className="gap-1.5 ml-auto">
          <Download className="h-3 w-3" /> Download CSV
        </Button>
      </div>

      {summary && (
        <div className="grid gap-3 grid-cols-4">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{summary.total_staff}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Total Staff</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-success)]">{summary.present}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Present</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-warning)]">{summary.late}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Late</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-[var(--color-danger)]">{summary.absent}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] uppercase">Absent</p>
          </CardContent></Card>
        </div>
      )}

      {records.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-secondary)]">
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Check In</th>
                    <th className="px-4 py-3 font-medium">Check Out</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  <CollapsibleSection
                    items={records}
                    keyExtractor={(r: any) => r.id}
                    defaultVisible={10}
                    renderItem={(r: any) => (
                      <tr className="text-sm hover:bg-[var(--color-bg-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text-primary)]">{r.staff?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{r.staff?.staff_id}</p>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{r.staff?.department?.name || '-'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{r.check_in ? new Date(r.check_in).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'danger'}>{r.status}</Badge>
                        </td>
                      </tr>
                    )}
                  />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-12 text-center text-[var(--color-text-muted)] text-sm">No attendance records for {filterDate}.</CardContent></Card>
      )}
    </div>
  )
}

/* ─── Daily Reports Tab (existing) ─── */
function DailyReportsTab() {
  const [reports, setReports] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [reportRes, summaryRes] = await Promise.all([
        fetch(`/api/reports?date=${filterDate}`),
        fetch('/api/reports/summary'),
      ])
      if (reportRes.ok) setReports(await reportRes.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
    } finally {
      setLoading(false)
    }
  }, [filterDate])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-[var(--color-text-muted)] text-sm">Loading daily reports...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value) }}
            className="h-9 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]" />
        </div>
        <Button size="sm" variant="outline" onClick={loadData} className="gap-1.5">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card><CardContent className="p-4 text-center">
          <FileText className="h-5 w-5 text-[var(--color-info)] mx-auto mb-1" />
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Reports</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{reports.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <BrainCircuit className="h-5 w-5 text-[var(--color-accent)]/70 mx-auto mb-1" />
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Staff Present</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{String(summary?.ai_insights?.staff_present ?? '-')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <RefreshCw className="h-5 w-5 text-[var(--color-success)] mx-auto mb-1" />
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase">Last Summary</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] text-xs pt-1">
            {summary?.generated_at ? new Date(summary.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </CardContent></Card>
      </div>

      {summary && (
        <Card className="border-dashed border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BrainCircuit className="h-4 w-4 text-[var(--color-accent)]/70" />
              AI Summary — {summary.date}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-text-primary)]">{summary.summary || 'No summary generated yet.'}</p>
            {summary.ai_insights && Object.keys(summary.ai_insights).length > 0 && (
              <div className="mt-3 flex gap-4 text-xs text-[var(--color-text-secondary)]">
                {Object.entries(summary.ai_insights).map(([key, val]) => (
                  <span key={key} className="capitalize">{key.replace(/_/g, ' ')}: <strong>{String(val)}</strong></span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ReportList reports={reports} title={`Reports for ${filterDate}`} />
    </div>
  )
}
