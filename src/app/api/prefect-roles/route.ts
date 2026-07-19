import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('prefect_roles')
    .select('id, name, display_order')
    .order('display_order')

  if (error) return NextResponse.json({ error: 'Failed to load prefect roles' }, { status: 500 })
  return NextResponse.json(data)
}
