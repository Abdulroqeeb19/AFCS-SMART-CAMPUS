import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramBotToken } from '@/lib/telegram/token'
import { handleTelegramCommand, handleTelegramCallback } from '@/lib/telegram/commands'

export async function POST(request: Request) {
  try {
    const update = await request.json()
    const token = await getTelegramBotToken()
    if (!token) return NextResponse.json({ ok: true })

    const supabase = createAdminClient()
    const botUrl = `https://api.telegram.org/bot${token}`

    // Handle callback queries (inline button taps)
    if (update.callback_query) {
      await handleTelegramCallback(update.callback_query, supabase, botUrl)
      return NextResponse.json({ ok: true })
    }

    // Handle text messages
    const message = update.message
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(message.chat.id)
    const text = (message.text as string).trim()

    await handleTelegramCommand(chatId, text, supabase, botUrl)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: true })
  }
}
