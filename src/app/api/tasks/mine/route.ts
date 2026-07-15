import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const adminSupabase = createAdminClient()

  const [paradeTasks, dutyRosters] = await Promise.all([
    adminSupabase
      .from('parade_tasks')
      .select('*, assignee:assigned_to(id, staff_id, full_name), parade:parade_id(id, date, type, status)')
      .eq('assigned_to', staff.id)
      .order('created_at', { ascending: false })
      .limit(50),

    adminSupabase
      .from('duty_rosters')
      .select('*, duty_type:duty_type_id(*), staff:staff_id(id, staff_id, full_name)')
      .eq('staff_id', staff.id)
      .order('date', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    user: { id: staff.id },
    paradeTasks: paradeTasks.data || [],
    dutyRosters: dutyRosters.data || [],
    errors: {
      paradeTasks: paradeTasks.error?.message || null,
      dutyRosters: dutyRosters.error?.message || null,
    },
  })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const adminSupabase = createAdminClient()

  const { description, deadline } = await request.json()
  if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

  // Find today's parade or create one
  const today = new Date().toISOString().split('T')[0]
  let { data: parade } = await adminSupabase
    .from('parade_sessions')
    .select('id')
    .eq('date', today)
    .neq('status', 'cancelled')
    .limit(1)
    .maybeSingle()

  if (!parade) {
    const { data: created } = await adminSupabase
      .from('parade_sessions')
      .insert({ date: today, type: 'morning' })
      .select('id')
      .single()
    parade = created
  }

  if (!parade) return NextResponse.json({ error: 'Failed to create parade' }, { status: 500 })

  const { data, error } = await adminSupabase
    .from('parade_tasks')
    .insert({
      parade_id: parade.id,
      assigned_to: staff.id,
      description: description.trim(),
      priority: 'normal',
      deadline: deadline || null,
    })
    .select('*, parade:parade_id(id, date, type, status)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const adminSupabase = createAdminClient()

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('id')
  if (!taskId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Only allow deleting own tasks
  const { data: task } = await adminSupabase
    .from('parade_tasks')
    .select('id, assigned_to')
    .eq('id', taskId)
    .maybeSingle()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.assigned_to !== staff.id) return NextResponse.json({ error: 'Not your task' }, { status: 403 })

  const { error } = await adminSupabase.from('parade_tasks').delete().eq('id', taskId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: 1 })
}
