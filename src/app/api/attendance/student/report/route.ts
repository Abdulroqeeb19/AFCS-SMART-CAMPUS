import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const classId = searchParams.get('class_id')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('page_size')) || 20))

    const adminSupabase = createAdminClient()

    let classQuery = adminSupabase.from('classes').select('id, name, arm').order('name').order('arm')
    if (classId) classQuery = classQuery.eq('id', classId)
    const { data: classes } = await classQuery

    let studentQuery = adminSupabase
      .from('students')
      .select('id, class_id, full_name', { count: 'exact' })
      .eq('is_active', true)
    if (classId) studentQuery = studentQuery.eq('class_id', classId)
    const { data: students, count: totalStudentsAll } = await studentQuery

    let attQuery = adminSupabase
      .from('student_attendance')
      .select('*, student:student_id(id, student_id, full_name, class:class_id(name, arm))', { count: 'exact' })
      .eq('date', date)
    if (classId && students?.length) {
      const studentIds = students.map((s) => s.id)
      attQuery = attQuery.in('student_id', studentIds)
    }
    const { data: attendance, count: totalRecords } = await attQuery
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('student_id')

    const totalStudents = students?.length || 0
    const present = attendance?.filter((a) => a.status === 'present').length || 0
    const late = attendance?.filter((a) => a.status === 'late').length || 0
    const absent = totalStudents - present - late
    const checkedOut = attendance?.filter((a) => a.check_out).length || 0

    const classBreakdown = (classes || []).map((cls) => {
      const studentsInClass = students?.filter((s) => s.class_id === cls.id) || []
      const total = studentsInClass.length
      const clsAttendance = attendance?.filter((a) =>
        studentsInClass.some((s) => s.id === a.student_id)
      ) || []
      const clsPresent = clsAttendance.filter((a) => a.status === 'present').length
      const clsLate = clsAttendance.filter((a) => a.status === 'late').length
      const clsCheckedOut = clsAttendance.filter((a) => a.check_out).length
      return {
        class: `${cls.name} ${cls.arm}`,
        class_id: cls.id,
        total,
        present: clsPresent,
        late: clsLate,
        absent: total - clsPresent - clsLate,
        checked_out: clsCheckedOut,
      }
    }) || []

    const response = NextResponse.json({
      date,
      total_students: totalStudents,
      present,
      late,
      absent,
      checked_out: checkedOut,
      class_breakdown: classBreakdown,
      records: attendance || [],
      pagination: {
        page,
        page_size: pageSize,
        total: totalRecords || totalStudentsAll || 0,
        total_pages: Math.ceil((totalRecords || totalStudentsAll || 0) / pageSize),
      },
    })

    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')

    return response
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('relation') || msg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Student tables not found' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Student attendance service unavailable' },
      { status: 503 }
    )
  }
}
