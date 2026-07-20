import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'
import crypto from 'crypto'

const generateSchema = z.object({
  tier: z.enum(['essential', 'professional', 'enterprise']),
  school_name: z.string().min(1).max(255),
  duration_years: z.number().int().min(1).max(10).default(1),
})

const TIER_FEATURES: Record<string, string[]> = {
  essential: ['attendance', 'duty_roster', 'reports'],
  professional: ['attendance', 'duty_roster', 'reports', 'ai_timetable', 'telegram_bot', 'automation', 'muster_parade', 'prefect_roles', 'daily_reports', 'global_search', 'ai_assistant'],
  enterprise: ['attendance', 'duty_roster', 'reports', 'ai_timetable', 'telegram_bot', 'automation', 'muster_parade', 'prefect_roles', 'daily_reports', 'global_search', 'ai_assistant', 'whatsapp_sms', 'notifications_hub', 'dedicated_support'],
}

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
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = generateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { tier, school_name, duration_years } = parsed.data
  const licenseKey = generateLicenseKey()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + duration_years)

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('licenses')
    .insert({
      license_key: licenseKey,
      tier,
      school_name,
      expires_at: expiresAt.toISOString(),
      features: TIER_FEATURES[tier],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ license_key: null, tier: null, expires_at: null, is_active: false, features: [] })
  return NextResponse.json(data)
}
