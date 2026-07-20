import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) {
    return NextResponse.json({
      license_key: null,
      tier: null,
      school_name: '',
      issued_at: null,
      expires_at: null,
      is_active: false,
      features: [],
      days_remaining: 0,
      is_expired: true,
    })
  }

  const now = new Date()
  const expires = new Date(data.expires_at)
  const daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const isExpired = now >= expires || !data.is_active

  return NextResponse.json({ ...data, days_remaining: daysRemaining, is_expired: isExpired })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const body = await request.json()
  const { license_key } = body
  if (!license_key) return NextResponse.json({ error: 'License key required' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('licenses')
    .select('*')
    .eq('license_key', license_key)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Invalid license key' }, { status: 404 })

  const now = new Date()
  const expires = new Date(data.expires_at)
  const isExpired = now >= expires || !data.is_active

  if (isExpired) return NextResponse.json({ error: 'License has expired' }, { status: 403 })

  return NextResponse.json({
    valid: true,
    tier: data.tier,
    school_name: data.school_name,
    expires_at: data.expires_at,
    features: data.features,
  })
}
