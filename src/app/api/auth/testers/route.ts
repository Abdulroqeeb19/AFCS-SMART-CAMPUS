import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('staff')
    .select('id, staff_id, full_name, email, role')
    .eq('is_active', true)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
