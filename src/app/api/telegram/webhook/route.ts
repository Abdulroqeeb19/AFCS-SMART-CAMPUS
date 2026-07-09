import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramBotToken } from '@/lib/telegram/token'

const WELCOME_MESSAGE = `Welcome to *AFCS Smart Campus*!

You are now connected for notifications. Use the following commands:

/start - Show this message
/link [staff_id] [email] - Link your staff account
/status - Check your notification preferences
/unlink - Disconnect and stop notifications

To link your account, send:
/link YOUR_STAFF_ID YOUREMAIL@afcs.edu.ng`

function extractLinkArgs(text: string): { staffId?: string; email?: string } {
  const parts = text.trim().split(/\s+/)
  if (parts[0] === '/link' && parts.length >= 3) {
    return { staffId: parts[1], email: parts[2] }
  }
  if (parts[0] === '/start' && parts.length >= 3) {
    return { staffId: parts[1], email: parts[2] }
  }
  return {}
}

export async function POST(request: Request) {
  try {
    const update = await request.json()
    const message = update.message
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(message.chat.id)
    const text = (message.text as string).trim()
    const token = await getTelegramBotToken()
    if (!token) return NextResponse.json({ ok: true })

    const supabase = createAdminClient()
    const botUrl = `https://api.telegram.org/bot${token}`

    async function reply(msg: string) {
      await fetch(`${botUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
      })
    }

    if (text === '/start') {
      await reply(WELCOME_MESSAGE)
      return NextResponse.json({ ok: true })
    }

    if (text === '/status') {
      const { data: staff } = await supabase
        .from('staff')
        .select('full_name, role, notification_preferences')
        .eq('telegram_chat_id', chatId)
        .maybeSingle()

      if (!staff) {
        await reply('Your Telegram account is not linked to any staff profile.\nUse `/link STAFF_ID EMAIL` to connect.')
      } else {
        const prefs = staff.notification_preferences as Record<string, boolean> | null
        const telegramEnabled = prefs?.telegram !== false
        await reply(
          `*Account:* ${staff.full_name}\n*Role:* ${staff.role}\n*Telegram notifications:* ${telegramEnabled ? '✅ Enabled' : '❌ Disabled'}`
        )
      }
      return NextResponse.json({ ok: true })
    }

    if (text.startsWith('/link')) {
      const { staffId, email } = extractLinkArgs(text)
      if (!staffId || !email) {
        await reply('Usage: `/link STAFF_ID EMAIL`\nExample: `/link AFC-0001 commandant@afcs.edu.ng`')
        return NextResponse.json({ ok: true })
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('staff_id', staffId)
        .eq('email', email)
        .maybeSingle()

      if (!staff) {
        await reply('No staff account found with that Staff ID and email combination.')
        return NextResponse.json({ ok: true })
      }

      const { error } = await supabase
        .from('staff')
        .update({ telegram_chat_id: chatId })
        .eq('id', staff.id)

      if (error) {
        await reply('Failed to link account. Please try again later.')
        return NextResponse.json({ ok: true })
      }

      await reply(
        `✅ *Account Linked!*\n\nHello ${staff.full_name}, you will now receive notifications here.\n\nUse /status to check your preferences.\nUse /unlink to disconnect.`
      )
      return NextResponse.json({ ok: true })
    }

    if (text === '/unlink') {
      const { data: staff } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('telegram_chat_id', chatId)
        .maybeSingle()

      if (!staff) {
        await reply('Your Telegram account is not linked to any staff profile.')
      } else {
        await supabase.from('staff').update({ telegram_chat_id: null }).eq('id', staff.id)
        await reply(`You have been unlinked, ${staff.full_name}. You will no longer receive notifications here.`)
      }
      return NextResponse.json({ ok: true })
    }

    await reply(
      `Unknown command: \`${text.split(' ')[0]}\`\n\n${WELCOME_MESSAGE}`
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
