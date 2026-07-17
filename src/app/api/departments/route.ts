import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) return NextResponse.json({ error: 'Failed to load departments' }, { status: 500 })
  return NextResponse.json(data)
}
