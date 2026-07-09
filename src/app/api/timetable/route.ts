import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const term_id = searchParams.get('term_id')
  const class_id = searchParams.get('class_id')
  const teacher_id = searchParams.get('teacher_id')

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('timetable_entries')
    .select('*, class:class_id(id, name, arm), subject:subject_id(*), teacher:teacher_id(id, staff_id, full_name), room:room_id(*)')
    .order('day_of_week')
    .order('period_number')

  if (term_id) query = query.eq('term_id', term_id)
  if (class_id) query = query.eq('class_id', class_id)
  if (teacher_id) query = query.eq('teacher_id', teacher_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const term_id = searchParams.get('term_id')
  if (!term_id) return NextResponse.json({ error: 'term_id required' }, { status: 400 })
  const { error } = await supabase.from('timetable_entries').delete().eq('term_id', term_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
