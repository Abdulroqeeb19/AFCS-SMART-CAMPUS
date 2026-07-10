import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('notification_rules')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = createAdminClient()
  const staff = await getAuthStaff(supabase, request)
  if (!staff || (staff.role !== 'admin' && staff.role !== 'commandant')) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const { key, is_active } = await request.json()
  if (!key || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'key (string) and is_active (boolean) required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notification_rules')
    .update({ is_active })
    .eq('key', key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ key, is_active })
}
