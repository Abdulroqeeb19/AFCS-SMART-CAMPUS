import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramBotToken } from '@/lib/telegram/token'
import { answerCallbackQuery, editMessageReplyMarkup } from '@/lib/telegram/send'

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

async function handleCallbackQuery(cq: {
  id: string
  from: { id: number }
  data?: string
  message?: { chat: { id: number }; message_id: number }
}, supabase: ReturnType<typeof createAdminClient>, botUrl: string) {
  if (!cq.data || !cq.message) return

  const [action, taskId] = cq.data.split(':')
  if (!taskId) {
    await answerCallbackQuery(cq.id, 'Invalid task reference')
    return
  }

  let responseType: string
  let answerText: string
  let updateTaskStatus = false

  switch (action) {
    case 'task_ack':
      responseType = 'acknowledged'
      answerText = '✅ Task acknowledged! Commandant has been notified.'
      break
    case 'task_done':
      responseType = 'completed'
      answerText = '✅ Marked as complete! Well done.'
      updateTaskStatus = true
      break
    case 'task_issue':
      responseType = 'issue_reported'
      answerText = '📝 Issue reported. Commandant will review.'
      break
    default:
      await answerCallbackQuery(cq.id, 'Unknown action')
      return
  }

  const chatId = String(cq.message.chat.id)
  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (!staff) {
    await answerCallbackQuery(cq.id, 'Account not linked. Use /link first.')
    return
  }

  const { error: respError } = await supabase.from('task_responses').insert({
    task_id: taskId,
    staff_id: staff.id,
    response_type: responseType,
    telegram_message_id: cq.message.message_id,
  })

  if (respError) {
    await answerCallbackQuery(cq.id, 'Failed to save response. Try again.')
    return
  }

  if (updateTaskStatus) {
    await supabase
      .from('parade_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)
  }

  await supabase.from('notification_logs').insert({
    recipient_id: staff.id,
    recipient_name: staff.full_name,
    channel: 'telegram',
    message_type: `task_${responseType}`,
    message_body: `${staff.full_name} ${responseType} task ${taskId} via Telegram`,
    status: 'sent',
    sent_at: new Date().toISOString(),
  })

  if (responseType === 'acknowledged') {
    await editMessageReplyMarkup(chatId, cq.message.message_id, [
      [{ text: '✅ Mark Complete', callback_data: `task_done:${taskId}` }],
      [{ text: '❌ Report Issue', callback_data: `task_issue:${taskId}` }],
    ], process.env.TELEGRAM_BOT_TOKEN)
  } else {
    await editMessageReplyMarkup(chatId, cq.message.message_id, undefined, process.env.TELEGRAM_BOT_TOKEN)
  }

  await answerCallbackQuery(cq.id, answerText)
}

export async function POST(request: Request) {
  try {
    const update = await request.json()

    // Handle callback queries (inline button taps)
    if (update.callback_query) {
      const token = await getTelegramBotToken()
      if (!token) return NextResponse.json({ ok: true })
      const supabase = createAdminClient()
      const botUrl = `https://api.telegram.org/bot${token}`
      await handleCallbackQuery(update.callback_query, supabase, botUrl)
      return NextResponse.json({ ok: true })
    }

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
