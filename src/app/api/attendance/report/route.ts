import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'
import { toCsv, csvResponse } from '@/lib/csv'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const format = searchParams.get('format')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size')) || 20))
    const departmentId = searchParams.get('department_id')
    const status = searchParams.get('status')

    const adminSupabase = createAdminClient()

    const { data: departments } = await adminSupabase
      .from('departments')
      .select('id, name, code')
      .order('name')

    let staffQuery = adminSupabase
      .from('staff')
      .select('id, department_id, full_name')
      .eq('is_active', true)
    if (departmentId) staffQuery = staffQuery.eq('department_id', departmentId)
    const { data: staff } = await staffQuery

    let attQuery = adminSupabase
      .from('staff_attendance')
      .select('*, staff:staff_id(id, staff_id, full_name, department:department_id(name))', { count: 'exact' })
      .eq('date', date)
    if (status) attQuery = attQuery.eq('status', status)
    if (departmentId && staff?.length) {
      const staffIds = staff.map((s) => s.id)
      attQuery = attQuery.in('staff_id', staffIds)
    }
    const { data: attendance, count: totalRecords } = await attQuery
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('staff_id')

    const totalStaff = staff?.length || 0
    const present = attendance?.filter((a) => a.status === 'present').length || 0
    const late = attendance?.filter((a) => a.status === 'late').length || 0
    const totalCheckedIn = present + late
    const absent = totalStaff - totalCheckedIn

    const departmentBreakdown =
      departments?.map((dept) => {
        const staffInDept = staff?.filter((s) => s.department_id === dept.id) || []
        const total = staffInDept.length
        const deptAttendance =
          attendance?.filter((a) =>
            staffInDept.some((s) => s.id === a.staff_id)
          ) || []
        const deptPresent = deptAttendance.filter((a) => a.status === 'present').length
        const deptLate = deptAttendance.filter((a) => a.status === 'late').length
        return {
          department: dept.name,
          total,
          present: deptPresent,
          late: deptLate,
          absent: total - deptPresent - deptLate,
        }
      }) || []

    if (format === 'csv') {
      const headers = ['Staff ID', 'Name', 'Department', 'Check In', 'Check Out', 'Status']
      const rows = (attendance || []).map((a: any) => [
        a.staff?.staff_id || '',
        `"${(a.staff?.full_name || '').replace(/"/g, '""')}"`,
        a.staff?.department?.name || '',
        a.check_in ? new Date(a.check_in).toLocaleTimeString() : '',
        a.check_out ? new Date(a.check_out).toLocaleTimeString() : '',
        a.status,
      ])
      return csvResponse(toCsv(headers, rows), `staff-attendance-${date}.csv`)
    }

    const response = NextResponse.json({
      date,
      total_staff: totalStaff,
      present,
      late,
      absent,
      department_breakdown: departmentBreakdown,
      records: attendance || [],
      pagination: {
        page,
        page_size: pageSize,
        total: totalRecords || 0,
        total_pages: Math.ceil((totalRecords || 0) / pageSize),
      },
    })

    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')

    return response
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('relation') || msg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Staff tables not found' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Staff attendance service unavailable' },
      { status: 503 }
    )
  }
}
