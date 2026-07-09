import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const classId = searchParams.get('class_id')
  const staffId = searchParams.get('staff_id')

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('student_activity_reports')
    .select('*, staff:staff_id(id, staff_id, full_name), class:class_id(id, name, arm)')
    .order('submitted_at', { ascending: false })

  if (date) query = query.eq('date', date)
  if (classId) query = query.eq('class_id', classId)
  if (staffId) query = query.eq('staff_id', staffId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()

  if (!body.class_id) return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
  if (!body.activities_done?.trim()) return NextResponse.json({ error: 'Activities report is required' }, { status: 400 })

  const today = body.date || new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('student_activity_reports')
    .select('id')
    .eq('staff_id', staff.id)
    .eq('class_id', body.class_id)
    .eq('date', today)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('student_activity_reports')
      .update({
        activities_done: body.activities_done,
        challenges: body.challenges || null,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*, staff:staff_id(id, full_name), class:class_id(id, name, arm)')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('student_activity_reports')
    .insert({
      staff_id: staff.id,
      class_id: body.class_id,
      date: today,
      activities_done: body.activities_done,
      challenges: body.challenges || null,
      notes: body.notes || null,
    })
    .select('*, staff:staff_id(id, full_name), class:class_id(id, name, arm)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
