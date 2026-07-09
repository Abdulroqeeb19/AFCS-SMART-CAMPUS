import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

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
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const staffId = searchParams.get('staff_id')
  const mine = searchParams.get('mine')

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('duty_rosters')
    .select('*, staff:staff_id(id, staff_id, full_name, department:department_id(name)), duty_type:duty_type_id(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (date) query = query.eq('date', date)

  if (staffId) {
    query = query.eq('staff_id', staffId)
  } else if (mine === 'true' && user) {
    query = query.eq('staff_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
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
  const supabase = await createServerSupabaseClient()
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
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Roster ID required' }, { status: 400 })
  const { error } = await supabase.from('duty_rosters').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
