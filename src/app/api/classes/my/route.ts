import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const adminSupabase = createAdminClient()

  const { data: classes } = await adminSupabase
    .from('classes')
    .select('id, name, arm')
    .eq('class_teacher_id', staff.id)
    .order('name')

  if (!classes?.length) {
    return NextResponse.json({
      classes: [],
      message: staff.role === 'admin' || staff.role === 'commandant'
        ? 'Admins can take attendance from the Student Check-In page'
        : 'No class assigned to you. Contact the administration.',
    })
  }

  const classIds = classes.map((c) => c.id)

  const { data: students } = await adminSupabase
    .from('students')
    .select('id, student_id, full_name, class_id')
    .eq('is_active', true)
    .in('class_id', classIds)
    .order('full_name')

  const { data: attendance } = await adminSupabase
    .from('student_attendance')
    .select('id, student_id, check_in, check_out, status, period')
    .eq('date', today)
    .in('student_id', students?.map((s) => s.id) || [])

  const classesWithStudents = classes.map((cls) => ({
    ...cls,
    students: (students || [])
      .filter((s) => s.class_id === cls.id)
      .map((s) => ({
        ...s,
        today_attendance: (attendance || []).find((a) => a.student_id === s.id) || null,
      })),
  }))

  return NextResponse.json({
    classes: classesWithStudents,
    total_students: students?.length || 0,
    checked_in: attendance?.length || 0,
    date: today,
  })
}
