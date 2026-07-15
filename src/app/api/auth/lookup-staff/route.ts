import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(`lookup-staff:${ip}`, 30, 60)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  const { identifier } = body

  if (!identifier || typeof identifier !== 'string') {
    return NextResponse.json({ error: 'identifier required' }, { status: 400 })
  }

  const supabase = createAdminClient()
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
