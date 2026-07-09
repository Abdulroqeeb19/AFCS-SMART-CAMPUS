import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('class_id')

  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('students')
    .select('*, class:class_id(id, name, arm)')
    .eq('is_active', true)
    .order('full_name')

  if (classId) query = query.eq('class_id', classId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const body = await request.json()

  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('student_id', body.student_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Student ID already exists' }, { status: 409 })
  }

  const { data, error } = await supabase
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { id, ...updates } = await request.json()

  const { data, error } = await supabase
    .from('students')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, class:class_id(id, name, arm)')
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
  if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
