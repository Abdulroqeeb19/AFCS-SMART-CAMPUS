import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { toCsv, csvResponse } from '@/lib/csv'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const format = searchParams.get('format')

    const supabase = await createServerSupabaseClient()

    const { data: departments } = await supabase
      .from('departments')
      .select('id, name, code')
      .order('name')

    const { data: staff } = await supabase
      .from('staff')
      .select('id, department_id, full_name')
      .eq('is_active', true)

    const { data: attendance } = await supabase
      .from('staff_attendance')
      .select('*, staff:staff_id(id, staff_id, full_name, department:department_id(name))')
      .eq('date', date)

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

    // CSV export
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

    return NextResponse.json({
      date,
      total_staff: totalStaff,
      present,
      late,
      absent,
      department_breakdown: departmentBreakdown,
      records: attendance || [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('relation') || msg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Staff tables not found. Run 001_staff_schema.sql.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Staff attendance service unavailable' },
      { status: 503 }
    )
  }
}
