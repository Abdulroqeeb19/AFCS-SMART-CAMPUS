import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) return NextResponse.json({ error: 'Failed to load departments' }, { status: 500 })
  return NextResponse.json(data)
}
