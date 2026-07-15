import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { getTelegramBotToken } from '@/lib/telegram/token'
import { getWebhookInfo, setWebhook } from '@/lib/telegram/send'


const configSchema = z.object({
  token: z.string().min(1).max(255).optional(),
  webhookUrl: z.string().url().optional(),
})

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const token = await getTelegramBotToken()

  if (!token) {
    return NextResponse.json({
      configured: false,
      webhook: null,
      error: 'TELEGRAM_BOT_TOKEN not set',
      mode: 'polling',
    })
  }

  const info = await getWebhookInfo()
  return NextResponse.json({
    configured: true,
    webhook: info.url || null,
    pending: info.pending || 0,
    error: info.error || null,
    mode: info.url ? 'webhook' : 'polling',
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = await requireAdmin(supabase, request)
    if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

    const adminSupabase = createAdminClient()

    const parsed = configSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const body = parsed.data

    if (body.token) {
      const { data: settings } = await adminSupabase.from('settings').select('id').limit(1).maybeSingle()
      if (settings) {
        await adminSupabase.from('settings').update({ telegram_bot_token: body.token }).eq('id', settings.id)
      } else {
        await adminSupabase.from('settings').insert({ telegram_bot_token: body.token, cutoff_hour: 8, cutoff_minute: 0 })
      }
    }

    if (body.webhookUrl) {
      const result = await setWebhook(body.webhookUrl)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, webhook: body.webhookUrl, mode: 'webhook' })
    }

    return NextResponse.json({ success: true, mode: 'polling', note: 'Token saved.' })
  } catch {
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
  }
}
