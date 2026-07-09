import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('*, teacher:teacher_id(id, staff_id, full_name, department:department_id(name)), subject:subject_id(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const body = await request.json()
  if (!body.teacher_id || !body.subject_id) {
    return NextResponse.json({ error: 'teacher_id and subject_id required' }, { status: 400 })
  }
  const { data, error } = await supabase.from('teacher_subjects').insert({
    teacher_id: body.teacher_id, subject_id: body.subject_id,
    is_primary: body.is_primary || false, max_periods_per_day: body.max_periods_per_day || 4,
  }).select('*, teacher:teacher_id(id, staff_id, full_name), subject:subject_id(*)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('teacher_subjects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
