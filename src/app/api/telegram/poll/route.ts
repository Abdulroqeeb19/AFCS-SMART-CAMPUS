import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramBotToken } from '@/lib/telegram/token'
import { handleTelegramCommand, handleTelegramCallback } from '@/lib/telegram/commands'

export async function POST() {
  const token = await getTelegramBotToken()
  if (!token) return NextResponse.json({ ok: false, error: 'Not configured' })

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?timeout=5&allowed_updates=["message","callback_query"]`,
      { method: 'GET' }
    )
    const data = await res.json()
    if (!data.ok || !data.result?.length) {
      return NextResponse.json({ ok: true, processed: 0 })
    }

    const supabase = createAdminClient()
    const botUrl = `https://api.telegram.org/bot${token}`
    let processed = 0

    for (const update of data.result) {
      if (update.callback_query) {
        await handleTelegramCallback(update.callback_query, supabase, botUrl)
        processed++
        await fetch(`${botUrl}/getUpdates?offset=${update.update_id + 1}`, { method: 'GET' })
        continue
      }

      const msg = update.message
      if (!msg?.text || !msg?.chat?.id) continue

      const chatId = String(msg.chat.id)
      const text = (msg.text as string).trim()

      await handleTelegramCommand(chatId, text, supabase, botUrl)
      await fetch(`${botUrl}/getUpdates?offset=${update.update_id + 1}`, { method: 'GET' })
      processed++
    }

    return NextResponse.json({ ok: true, processed })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Poll error' }, { status: 500 })
  }
}
