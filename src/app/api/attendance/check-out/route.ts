import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

export async function POST(request: Request) {
  try {
    const { staff_id } = await request.json()

    if (!staff_id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const admin = await requireAdmin(supabase, request)
    if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

    const adminSupabase = createAdminClient()

    const { data: staff, error: staffError } = await adminSupabase
      .from('staff')
      .select('id, full_name')
      .eq('staff_id', staff_id)
      .eq('is_active', true)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: 'Staff not found or inactive' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: attendance, error: attError } = await adminSupabase
      .from('staff_attendance')
      .select('id, check_in, check_out')
      .eq('staff_id', staff.id)
      .eq('date', today)
      .single()

    if (attError || !attendance) {
      return NextResponse.json(
        { error: 'No check-in record found for today. Please check in first.' },
        { status: 404 }
      )
    }

    if (attendance.check_out) {
      return NextResponse.json(
        { error: 'Already checked out today', check_out: attendance.check_out },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await adminSupabase
      .from('staff_attendance')
      .update({ check_out: now, updated_at: now })
      .eq('id', attendance.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to record check-out' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Goodbye, ${staff.full_name}! See you tomorrow.`,
      check_in: data.check_in,
      check_out: data.check_out,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
