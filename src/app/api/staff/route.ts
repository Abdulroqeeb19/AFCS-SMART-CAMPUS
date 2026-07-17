import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

const createStaffSchema = z.object({
  staff_id: z.string().min(1).max(20),
  full_name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(20).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  role: z.string().max(50).default('teacher'),
  subjects: z.array(z.string().uuid()).optional(),
})

const updateStaffSchema = z.object({
  id: z.string().uuid(),
  staff_id: z.string().min(1).max(20).optional(),
  full_name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  role: z.string().max(50).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('staff')
    .select('*, department:department_id(id, name)')
    .order('full_name')

  if (error) return NextResponse.json({ error: 'Failed to load staff' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = createStaffSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid staff data' }, { status: 400 })
  const { staff_id, full_name, email, phone, department_id, role, subjects } = parsed.data

  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('staff')
    .select('id')
    .eq('staff_id', staff_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Staff ID already exists' }, { status: 409 })
  }

  const { data, error } = await adminSupabase
    .from('staff')
    .insert({
      staff_id, full_name, email,
      phone: phone || null,
      department_id: department_id || null,
      role, is_active: true,
    })
    .select('*, department:department_id(name)')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })

  await adminSupabase.from('audit_logs').insert({
    staff_id: admin.id, action: 'create_staff', entity_type: 'staff', entity_id: data.id, changes: { staff_id, full_name },
  }).maybeSingle()

  if (subjects && subjects.length > 0 && role === 'teacher') {
    const subjectInserts = subjects.map((subject_id) => ({
      teacher_id: data.id, subject_id,
      is_primary: false, max_periods_per_day: 4,
    }))
    const { error: subjErr } = await adminSupabase.from('teacher_subjects').insert(subjectInserts)
    if (subjErr) console.error('Failed to assign subjects:', subjErr.message)
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = updateStaffSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid staff data' }, { status: 400 })
  const { id, ...updates } = parsed.data

  if (id === admin.id && updates.role && updates.role !== 'admin' && updates.role !== 'commandant') {
    return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 403 })
  }

  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('staff')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, department:department_id(name)')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })

  await adminSupabase.from('audit_logs').insert({
    staff_id: admin.id, action: 'update_staff', entity_type: 'staff', entity_id: id, changes: updates,
  }).maybeSingle()

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
  if (id === admin.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 })

  const adminSupabase = createAdminClient()

  const { error: rpcErr } = await (adminSupabase as any).rpc('delete_staff_cascade', { p_staff_id: id })
  if (rpcErr) {
    return NextResponse.json({ error: 'Failed to delete staff. Remove related records first (attendance, duties, reports, class teacher assignments).' }, { status: 500 })
  }

  await adminSupabase.from('audit_logs').insert({
    staff_id: admin.id, action: 'delete_staff', entity_type: 'staff', entity_id: id, changes: {},
  }).maybeSingle()

  return NextResponse.json({ success: true })
}
