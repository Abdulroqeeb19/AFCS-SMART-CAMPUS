import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'


export async function GET(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  const format = searchParams.get('format')

  // Fetch all tasks with related data
  let taskQuery = supabase
    .from('parade_tasks')
    .select('*, assignee:assigned_to(id, staff_id, full_name, role), parade:parade_id(id, date, type, status)')
    .order('created_at', { ascending: false })

  if (fromDate) taskQuery = taskQuery.gte('created_at', fromDate)
  if (toDate) taskQuery = taskQuery.lte('created_at', toDate)

  const { data: tasks, error: taskError } = await taskQuery
  if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 })

  // Fetch task responses for each task
  const taskIds = tasks.map((t: any) => t.id)
  const { data: responses } = await supabase
    .from('task_responses')
    .select('*, staff:staff_id(id, staff_id, full_name, role)')
    .in('task_id', taskIds)
    .order('responded_at', { ascending: false })

  // Group responses by task
  const responsesByTask: Record<string, any[]> = {}
  for (const r of (responses || [])) {
    if (!responsesByTask[r.task_id]) responsesByTask[r.task_id] = []
    responsesByTask[r.task_id].push(r)
  }

  // Build report data
  const reportData = tasks.map((task: any) => ({
    id: task.id,
    description: task.description,
    priority: task.priority,
    status: task.status,
    deadline: task.deadline,
    completed_at: task.completed_at,
    created_at: task.created_at,
    parade_date: task.parade?.date || null,
    parade_type: task.parade?.type || null,
    parade_status: task.parade?.status || null,
    assignee_staff_id: task.assignee?.staff_id || null,
    assignee_name: task.assignee?.full_name || 'Unassigned',
    assignee_role: task.assignee?.role || null,
    responses: (responsesByTask[task.id] || []).map((r: any) => ({
      type: r.response_type,
      responded_at: r.responded_at,
      staff_name: r.staff?.full_name || 'Unknown',
      staff_role: r.staff?.role || null,
    })),
  }))

  // CSV export
  if (format === 'csv') {
    const headers = ['Task ID', 'Description', 'Priority', 'Status', 'Deadline', 'Completed At', 'Parade Date', 'Parade Type', 'Assigned To', 'Role', 'Acknowledged', 'Completed', 'Issue Reported']
    const rows = reportData.map((t: any) => [
      t.id,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.deadline || '',
      t.completed_at || '',
      t.parade_date || '',
      t.parade_type || '',
      t.assignee_name,
      t.assignee_role || '',
      t.responses.some((r: any) => r.type === 'acknowledged') ? 'Yes' : 'No',
      t.responses.some((r: any) => r.type === 'completed') ? 'Yes' : 'No',
      t.responses.some((r: any) => r.type === 'issue_reported') ? 'Yes' : 'No',
    ])

    const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="task-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // Summary stats
  const summary = {
    total: reportData.length,
    pending: reportData.filter((t: any) => t.status === 'pending').length,
    completed: reportData.filter((t: any) => t.status === 'completed').length,
    acknowledged: reportData.filter((t: any) => t.responses.some((r: any) => r.type === 'acknowledged')).length,
    done_with_response: reportData.filter((t: any) => t.responses.some((r: any) => r.type === 'completed')).length,
    issues: reportData.filter((t: any) => t.responses.some((r: any) => r.type === 'issue_reported')).length,
  }

  return NextResponse.json({ summary, tasks: reportData })
}
