import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('staff')
    .select('id, staff_id, full_name, email, role')
    .eq('is_active', true)
    .order('full_name')

  if (error) return NextResponse.json({ error: 'Failed to load staff list' }, { status: 500 })
  return NextResponse.json(data || [])
}
