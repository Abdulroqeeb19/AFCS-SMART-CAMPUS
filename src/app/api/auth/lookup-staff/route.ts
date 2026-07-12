import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { identifier } = body

  if (!identifier) {
    return NextResponse.json({ error: 'identifier required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const isEmail = identifier.includes('@')
  const query = supabase.from('staff').select('*')

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
