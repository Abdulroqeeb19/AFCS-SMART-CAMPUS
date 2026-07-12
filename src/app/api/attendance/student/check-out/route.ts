import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

export async function POST(request: Request) {
  try {
    const { student_id, period } = await request.json()

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = await requireAdmin(supabase, request)
    if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

    const adminSupabase = createAdminClient()

    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('id, full_name, class:class_id(name, arm)')
      .eq('student_id', student_id)
      .eq('is_active', true)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found or inactive' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    let query = adminSupabase
      .from('student_attendance')
      .select('id, check_in, check_out, status, period')
      .eq('student_id', student.id)
      .eq('date', today)

    if (period) query = query.eq('period', period)

    const { data: attendance } = await query
      .order('period', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!attendance) {
      return NextResponse.json(
        { error: 'No check-in record found for today. Please check in first.' },
        { status: 404 }
      )
    }

    if (attendance.check_out) {
      return NextResponse.json(
        { error: `Already checked out for ${attendance.period} period`, check_out: attendance.check_out },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await adminSupabase
      .from('student_attendance')
      .update({ check_out: now, updated_at: now })
      .eq('id', attendance.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record check-out' }, { status: 500 })
    }

    return NextResponse.json({
      message: `${student.full_name} checked out successfully`,
      check_in: data.check_in,
      check_out: data.check_out,
      status: data.status,
      class: student.class,
      period: attendance.period,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
