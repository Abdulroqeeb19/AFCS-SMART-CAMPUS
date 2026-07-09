import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'
import { getTelegramBotToken } from '@/lib/telegram/token'
import { sendTelegramMessage } from '@/lib/telegram/send'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const auth = await requireAdmin(supabase, request)
  if (!auth) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const token = await getTelegramBotToken()
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 })
  }

  // Get the admin's staff record
  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, telegram_chat_id')
    .eq('id', auth.id)
    .single()

  if (!staff) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
  }

  if (!staff.telegram_chat_id) {
    return NextResponse.json({
      error: 'No Telegram chat linked. Send /link STAFF_ID EMAIL to the bot first.',
      botUsername: null,
    }, { status: 400 })
  }

  const result = await sendTelegramMessage(
    staff.telegram_chat_id,
    `🔔 *Test Notification*\n\nHello ${staff.full_name}, this is a test message from *AFCS Smart Campus*.\n\nIf you received this, Telegram notifications are working! ✅`,
    token,
  )

  return NextResponse.json({
    success: result.success,
    error: result.error || null,
    messageId: result.messageId || null,
  })
}
