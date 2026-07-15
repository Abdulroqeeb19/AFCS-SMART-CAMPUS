import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('class_id')

  const adminSupabase = createAdminClient()
  let query = adminSupabase
    .from('students')
    .select('*, class:class_id(id, name, arm)')
    .eq('is_active', true)
    .order('full_name')

  if (classId) query = query.eq('class_id', classId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const body = await request.json()
  if (!body.student_id?.trim() || !body.full_name?.trim() || !body.class_id) {
    return NextResponse.json({ error: 'Student ID, full name, and class are required' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('students')
    .select('id')
    .eq('student_id', body.student_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Student ID already exists' }, { status: 409 })
  }

  const { data, error } = await adminSupabase
    .from('students')
    .insert({
      student_id: body.student_id,
      full_name: body.full_name,
      class_id: body.class_id,
      parent_name: body.parent_name || null,
      parent_phone: body.parent_phone || null,
      parent_email: body.parent_email || null,
      parent_whatsapp: body.parent_whatsapp || null,
      is_active: true,
    })
    .select('*, class:class_id(id, name, arm)')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

  const adminSupabase = createAdminClient()

  type StudentUpdate = {
    full_name?: string
    class_id?: string
    parent_name?: string | null
    parent_phone?: string | null
    parent_email?: string | null
    is_active?: boolean
    updated_at?: string
  }

  const cleanUpdates: StudentUpdate = { updated_at: new Date().toISOString() }
  if (updates.full_name !== undefined) cleanUpdates.full_name = updates.full_name
  if (updates.class_id !== undefined) cleanUpdates.class_id = updates.class_id
  if (updates.parent_name !== undefined) cleanUpdates.parent_name = updates.parent_name
  if (updates.parent_phone !== undefined) cleanUpdates.parent_phone = updates.parent_phone
  if (updates.parent_email !== undefined) cleanUpdates.parent_email = updates.parent_email
  if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active === true || updates.is_active === 'true'

  const { data, error } = await adminSupabase
    .from('students')
    .update(cleanUpdates)
    .eq('id', id)
    .select('*, class:class_id(id, name, arm)')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('students').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  return NextResponse.json({ success: true })
}
