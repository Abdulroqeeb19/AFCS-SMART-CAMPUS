import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const identifier = searchParams.get('identifier')

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  const isStudent = identifier.startsWith('STU-') || identifier.startsWith('stu-')

  if (isStudent) {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, student_id, full_name, class:class_id(name, arm), is_active')
      .eq('student_id', identifier.toUpperCase())
      .maybeSingle()

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!student.is_active) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from('student_attendance')
      .select('id, check_in, check_out, status, period')
      .eq('student_id', student.id)
      .eq('date', today)
      .maybeSingle()

    return NextResponse.json({
      type: 'student',
      id: student.id,
      student_id: student.student_id,
      full_name: student.full_name,
      class: student.class,
      is_active: student.is_active,
      today_attendance: existing
        ? { ...existing, check_out: existing.check_out }
        : null,
    })
  }

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, staff_id, full_name, avatar_url, role, department:department_id(name), is_active')
    .eq('staff_id', identifier.toUpperCase())
    .maybeSingle()

  if (error || !staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
  }
  if (!staff.is_active) {
    return NextResponse.json({ error: 'Staff account is inactive' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('staff_attendance')
    .select('id, check_in, check_out, status')
    .eq('staff_id', staff.id)
    .eq('date', today)
    .maybeSingle()

  return NextResponse.json({
    type: 'staff',
    id: staff.id,
    staff_id: staff.staff_id,
    full_name: staff.full_name,
    avatar_url: staff.avatar_url,
    role: staff.role,
    department: staff.department,
    is_active: staff.is_active,
    today_attendance: existing,
  })
}
