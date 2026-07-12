import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const classId = searchParams.get('class_id')

    const supabase = createAdminClient()

    let classQuery = supabase.from('classes').select('id, name, arm').order('name').order('arm')
    if (classId) classQuery = classQuery.eq('id', classId)
    const { data: classes } = await classQuery

    let studentQuery = supabase
      .from('students')
      .select('id, class_id, full_name')
      .eq('is_active', true)
    if (classId) studentQuery = studentQuery.eq('class_id', classId)
    const { data: students } = await studentQuery

    let attQuery = supabase
      .from('student_attendance')
      .select('*, student:student_id(id, student_id, full_name, class:class_id(name, arm))')
      .eq('date', date)
    if (classId && students) {
      const studentIds = students.map((s) => s.id)
      attQuery = attQuery.in('student_id', studentIds)
    }
    const { data: attendance } = await attQuery

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

    return NextResponse.json({
      date,
      total_students: totalStudents,
      present,
      late,
      absent,
      checked_out: checkedOut,
      class_breakdown: classBreakdown,
      records: attendance || [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('relation') || msg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Student tables not found. Run 003_student_schema.sql.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Student attendance service unavailable' },
      { status: 503 }
    )
  }
}
