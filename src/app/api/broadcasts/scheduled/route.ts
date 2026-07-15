import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const adminSupabase = createAdminClient()

  const { data, error } = await adminSupabase
    .from('scheduled_broadcasts')
    .select('*')
    .order('scheduled_for', { ascending: true })
    .limit(20) as any

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff || (staff.role !== 'admin' && staff.role !== 'commandant')) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const adminSupabase = createAdminClient()

  const { content, scheduled_for, title, target_roles } = await request.json()
  if (!content || !scheduled_for) {
    return NextResponse.json({ error: 'content and scheduled_for required' }, { status: 400 })
  }

  if (new Date(scheduled_for) <= new Date()) {
    return NextResponse.json({ error: 'scheduled_for must be in the future' }, { status: 400 })
  }

  const { data, error } = await adminSupabase
    .from('scheduled_broadcasts')
    .insert({
      title: title || 'Scheduled Broadcast',
      content,
      scheduled_for,
      target_roles: target_roles || null,
      created_by: staff.id,
      status: 'pending',
    })
    .select()
    .single() as any

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
