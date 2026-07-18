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

  const { searchParams } = new URL(request.url)
  const identifier = searchParams.get('identifier')

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const isStudent = identifier.toUpperCase().startsWith('STU-')

  if (isStudent) {
    const { data: student, error } = await adminSupabase
      .from('students')
      .select('id, student_id, full_name, class:class_id(name, arm), is_active')
      .eq('student_id', identifier.toUpperCase())
      .maybeSingle()

    if (error || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (student.is_active === false) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 403 })
    }

    const { data: existing } = await adminSupabase
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
      today_attendance: existing
        ? { ...existing, check_out: existing.check_out }
        : null,
    })
  }

  const { data: staff, error } = await adminSupabase
    .from('staff')
    .select('id, staff_id, full_name, avatar_url, role, department:department_id(name), is_active')
    .eq('staff_id', identifier.toUpperCase())
    .maybeSingle()

  if (error || !staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
  }
  if (staff.is_active === false) {
    return NextResponse.json({ error: 'Staff account is inactive' }, { status: 403 })
  }

  const { data: existing } = await adminSupabase
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
    today_attendance: existing,
  })
}
