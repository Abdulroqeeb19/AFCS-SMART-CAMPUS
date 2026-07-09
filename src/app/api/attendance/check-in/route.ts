import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { ATTENDANCE_DEFAULTS } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const { staff_id } = await request.json()

    if (!staff_id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = await requireAdmin(supabase, request)
    if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name')
      .eq('staff_id', staff_id)
      .eq('is_active', true)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff not found or inactive' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('staff_attendance')
      .select('id, check_in, status')
      .eq('staff_id', staff.id)
      .eq('date', today)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already checked in today', check_in: existing.check_in },
        { status: 409 }
      )
    }

    const now = new Date()
    const cutoff = new Date()
    cutoff.setHours(ATTENDANCE_DEFAULTS.CUTOFF_HOUR, ATTENDANCE_DEFAULTS.CUTOFF_MINUTE, 0, 0)
    const status = now > cutoff ? 'late' : 'present'

    const { data, error } = await supabase
      .from('staff_attendance')
      .insert({
        staff_id: staff.id,
        date: today,
        check_in: now.toISOString(),
        status,
        check_in_method: 'manual',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Welcome, ${staff.full_name}!`,
      status: data.status,
      check_in: data.check_in,
      id: data.id,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
