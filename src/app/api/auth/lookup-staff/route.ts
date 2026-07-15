import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()
  const { identifier } = body

  if (!identifier) {
    return NextResponse.json({ error: 'identifier required' }, { status: 400 })
  }

  const isEmail = identifier.includes('@')
  const query = supabase.from('staff').select('id, staff_id, full_name, email, role, department_id, is_active')

  if (isEmail) {
    query.ilike('email', identifier)
  } else {
    query.ilike('staff_id', identifier)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Staff lookup failed:', error.message)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }

  return NextResponse.json({ staff: data || null })
}
