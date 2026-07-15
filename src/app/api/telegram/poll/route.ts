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
    let maxOffset = 0
    let processed = 0

    for (const update of data.result) {
      maxOffset = Math.max(maxOffset, update.update_id + 1)

      if (update.callback_query) {
        await handleTelegramCallback(update.callback_query, supabase, botUrl)
        processed++
        continue
      }

      const msg = update.message
      if (!msg?.chat?.id) continue

      if (msg.text) {
        const chatId = String(msg.chat.id)
        const text = msg.text.trim()
        await handleTelegramCommand(chatId, text, supabase, botUrl)
        processed++
      }
    }

    // Acknowledge all updates at once to avoid infinite retry
    if (maxOffset > 0) {
      await fetch(`${botUrl}/getUpdates?offset=${maxOffset}`, { method: 'GET' })
    }

    return NextResponse.json({ ok: true, processed })
  } catch (err) {
    console.error('Telegram poll error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Poll error' }, { status: 500 })
  }
}
