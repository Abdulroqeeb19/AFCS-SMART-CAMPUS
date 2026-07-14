import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthStaff, requireAdmin } from '@/lib/auth-utils'

const createRosterSchema = z.object({
  staff_id: z.string().uuid(),
  duty_type_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).nullable().optional(),
})

const updateRosterSchema = z.object({
  id: z.string().uuid(),
  staff_id: z.string().uuid().optional(),
  duty_type_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
})

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const staff = await getAuthStaff(supabase, request)

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const staffId = searchParams.get('staff_id')
  const dutyTypeId = searchParams.get('duty_type_id')
  const mine = searchParams.get('mine')

  let query = supabase
    .from('duty_rosters')
    .select('*, staff:staff_id(id, staff_id, full_name, department:department_id(name)), duty_type:duty_type_id(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (date) {
    query = query.eq('date', date)
  } else if (startDate && endDate) {
    query = query.gte('date', startDate).lte('date', endDate)
  }

  if (dutyTypeId) query = query.eq('duty_type_id', dutyTypeId)

  if (staffId) {
    query = query.eq('staff_id', staffId)
  } else if (mine === 'true' && staff) {
    query = query.eq('staff_id', staff.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = createRosterSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { staff_id, duty_type_id, date, notes } = parsed.data

  const { data, error } = await supabase
    .from('duty_rosters')
    .insert({
      staff_id,
      duty_type_id,
      date,
      notes: notes || null,
    })
    .select('*, staff:staff_id(id, staff_id, full_name), duty_type:duty_type_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = updateRosterSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id, ...updates } = parsed.data

  if (updates.status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('duty_rosters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, staff:staff_id(id, staff_id, full_name), duty_type:duty_type_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Roster ID required' }, { status: 400 })
  const { error } = await supabase.from('duty_rosters').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
