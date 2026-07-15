import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthStaff } from '@/lib/auth-utils'
import { sendDailyReportNotification } from '@/lib/notifications'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const adminSupabase = createAdminClient()
  let query = adminSupabase
    .from('daily_reports')
    .select('*, staff:staff_id(id, staff_id, full_name, department:department_id(name))')
    .order('submitted_at', { ascending: false })

  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()

  if (!body.activities_done) {
    return NextResponse.json({ error: 'Activities report is required' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('daily_reports')
    .select('id')
    .eq('staff_id', body.staff_id)
    .eq('date', body.date || new Date().toISOString().split('T')[0])
    .single()

  if (existing) {
    const { data, error } = await adminSupabase
      .from('daily_reports')
      .update({
        activities_done: body.activities_done,
        challenges: body.challenges || null,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*, staff:staff_id(id, full_name)')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const name = Array.isArray(data?.staff) ? data.staff[0]?.full_name : data?.staff?.full_name
    if (name) {
      sendDailyReportNotification(name, data.date, data.activities_done).catch(() => {})
    }
    return NextResponse.json(data)
  }

  const { data, error } = await adminSupabase
    .from('daily_reports')
    .insert({
      staff_id: body.staff_id,
      date: body.date || new Date().toISOString().split('T')[0],
      activities_done: body.activities_done,
      challenges: body.challenges || null,
      notes: body.notes || null,
    })
    .select('*, staff:staff_id(id, full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const name = Array.isArray(data?.staff) ? data.staff[0]?.full_name : data?.staff?.full_name
  if (name) {
    sendDailyReportNotification(name, data.date, data.activities_done).catch(() => {})
  }
  return NextResponse.json(data, { status: 201 })
}
