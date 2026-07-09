import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { ATTENDANCE_DEFAULTS } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const { student_id, period = 'morning' } = await request.json()

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = await requireAdmin(supabase, request)
    if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, class:class_id(name, arm)')
      .eq('student_id', student_id)
      .eq('is_active', true)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found or inactive' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('student_attendance')
      .select('id, check_in, status')
      .eq('student_id', student.id)
      .eq('date', today)
      .eq('period', period)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Already checked in for ${period} period` },
        { status: 409 }
      )
    }

    const now = new Date()
    const cutoff = new Date()
    cutoff.setHours(ATTENDANCE_DEFAULTS.CUTOFF_HOUR, ATTENDANCE_DEFAULTS.CUTOFF_MINUTE, 0, 0)
    const status = now > cutoff ? 'late' : 'present'

    const { data, error } = await supabase
      .from('student_attendance')
      .insert({
        student_id: student.id,
        date: today,
        check_in: now.toISOString(),
        status,
        check_in_method: 'manual',
        period,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
    }

    return NextResponse.json({
      message: `${student.full_name} checked in successfully`,
      status: data.status,
      check_in: data.check_in,
      class: student.class,
      id: data.id,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
