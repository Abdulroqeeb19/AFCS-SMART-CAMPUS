import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

const settingsSchema = z.object({
  cutoff_hour: z.number().int().min(0).max(23).optional(),
  cutoff_minute: z.number().int().min(0).max(59).optional(),
  closing_hour: z.number().int().min(0).max(23).optional(),
  closing_minute: z.number().int().min(0).max(59).optional(),
  school_name: z.string().min(1).max(255).optional(),
  enable_qr_checkin: z.boolean().optional(),
  telegram_bot_token: z.string().max(255).optional(),
})

const DEFAULT_SETTINGS = {
  cutoff_hour: 7,
  cutoff_minute: 30,
  closing_hour: 16,
  closing_minute: 0,
  school_name: 'Air Force Comprehensive School, Igbara-Oke',
  enable_qr_checkin: true,
}

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || DEFAULT_SETTINGS)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = settingsSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const body = parsed.data

  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('settings')
    .select('id')
    .single()

  if (existing) {
    const { data, error } = await adminSupabase
      .from('settings')
      .update(body)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await adminSupabase
    .from('settings')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
