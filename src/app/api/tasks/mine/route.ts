import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [paradeTasks, dutyRosters] = await Promise.all([
    supabase
      .from('parade_tasks')
      .select('*, assignee:assigned_to(id, staff_id, full_name), parade:parade_id(id, date, type, status)')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('duty_rosters')
      .select('*, duty_type:duty_type_id(*), staff:staff_id(id, staff_id, full_name)')
      .eq('staff_id', user.id)
      .order('date', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    user: { id: user.id },
    paradeTasks: paradeTasks.data || [],
    dutyRosters: dutyRosters.data || [],
    errors: {
      paradeTasks: paradeTasks.error?.message || null,
      dutyRosters: dutyRosters.error?.message || null,
    },
  })
}
