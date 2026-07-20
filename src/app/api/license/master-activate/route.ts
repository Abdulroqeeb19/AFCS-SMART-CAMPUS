import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'
import { constantTimeCompare, getFreeExpiryDate } from '@/lib/license-check'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

function generateLicenseKey(): string {
  const prefix = 'AFCSSMART'
  const segments = [
    crypto.randomBytes(4).toString('hex').toUpperCase(),
    crypto.randomBytes(4).toString('hex').toUpperCase(),
    crypto.randomBytes(4).toString('hex').toUpperCase(),
  ]
  return `${prefix}-${segments.join('-')}`
}

export async function POST(request: Request) {
  const masterKey = process.env.APP_MASTER_KEY
  if (!masterKey) {
    return NextResponse.json({ error: 'Master key not configured on server' }, { status: 500 })
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rl = await rateLimit(`master-activate:${ip}`, 5, 3600)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) {
    return NextResponse.json({ error: 'Authentication required. You must be logged in as an administrator.' }, { status: 401 })
  }

  const body = await request.json()
  const { master_key } = body

  if (!master_key || typeof master_key !== 'string' || master_key.length < 8) {
    return NextResponse.json({ error: 'Invalid master key format' }, { status: 400 })
  }

  if (!constantTimeCompare(master_key, masterKey)) {
    return NextResponse.json({ error: 'Invalid master activation key' }, { status: 403 })
  }

  const adminSupabase = createAdminClient()
  const licenseKey = generateLicenseKey()
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + 5)

  const { data: existing } = await adminSupabase
    .from('licenses')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { error: updateError } = await adminSupabase
      .from('licenses')
      .update({
        license_key: licenseKey,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  } else {
    const { error: insertError } = await adminSupabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        tier: 'enterprise',
        school_name: 'Air Force Comprehensive School, Igbara-Oke',
        expires_at: expiresAt.toISOString(),
        features: ['attendance', 'duty_roster', 'reports', 'ai_timetable', 'telegram_bot', 'automation', 'muster_parade', 'prefect_roles', 'daily_reports', 'global_search', 'ai_assistant', 'whatsapp_sms', 'notifications_hub', 'dedicated_support'],
        is_active: true,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'License activated successfully. You now have a 5-year enterprise license.',
    license_key: licenseKey,
    expires_at: expiresAt.toISOString(),
  })
}
