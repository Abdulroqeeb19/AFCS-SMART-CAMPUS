import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramBotToken } from '@/lib/telegram/token'
import { answerCallbackQuery, editMessageReplyMarkup } from '@/lib/telegram/send'

const WELCOME_MESSAGE = `Welcome to *AFCS Smart Campus*!

You are now connected for notifications. Use:

/link STAFF_ID EMAIL - Link your account
/status - Check preferences
/unlink - Disconnect`

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

    async function reply(chatId: string, msg: string) {
      await fetch(`${botUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
      })
    }

    async function handleCallbackQuery(cq: {
      id: string
      from: { id: number }
      data?: string
      message?: { chat: { id: number }; message_id: number }
    }) {
      if (!cq.data || !cq.message) return

      const [action, taskId] = cq.data.split(':')
      if (!taskId) {
        await answerCallbackQuery(cq.id, 'Invalid task reference')
        return
      }

      // Map callback action to response type
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

      // Find the staff by telegram chat ID
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

      // Store the response
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

      // Update task status for completions
      if (updateTaskStatus) {
        await supabase
          .from('parade_tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId)
      }

      // Also store in notification_logs for dashboard visibility
      await supabase.from('notification_logs').insert({
        recipient_id: staff.id,
        recipient_name: staff.full_name,
        channel: 'telegram',
        message_type: `task_${responseType}`,
        message_body: `${staff.full_name} ${responseType} task ${taskId} via Telegram`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      // Update the inline keyboard based on response type
      if (responseType === 'acknowledged') {
        // Keep "Mark Complete" + "Report Issue" available (ack is done, task still open)
        await editMessageReplyMarkup(chatId, cq.message.message_id, [
          [{ text: '✅ Mark Complete', callback_data: `task_done:${taskId}` }],
          [{ text: '❌ Report Issue', callback_data: `task_issue:${taskId}` }],
        ])
      } else {
        // Task done or issue reported — remove all buttons
        await editMessageReplyMarkup(chatId, cq.message.message_id)
      }

      // Answer the callback query (dismisses loading spinner)
      await answerCallbackQuery(cq.id, answerText)
    }

    for (const update of data.result) {
      // Process callback queries (inline button taps)
      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query)
        processed++
        await fetch(`${botUrl}/getUpdates?offset=${update.update_id + 1}`, { method: 'GET' })
        continue
      }

      const msg = update.message
      if (!msg?.text || !msg?.chat?.id) continue

      const chatId = String(msg.chat.id)
      const text = (msg.text as string).trim()

      if (text === '/start') {
        await reply(chatId, WELCOME_MESSAGE)
      } else if (text === '/status') {
        const { data: staff } = await supabase
          .from('staff')
          .select('full_name, role')
          .eq('telegram_chat_id', chatId)
          .maybeSingle()

        if (!staff) {
          await reply(chatId, 'Not linked. Use `/link STAFF_ID EMAIL` to connect.')
        } else {
          await reply(chatId, `*Account:* ${staff.full_name}\n*Role:* ${staff.role}\n*Notifications:* ✅ Active`)
        }
      } else if (text.startsWith('/link')) {
        const parts = text.trim().split(/\s+/)
        const staffId = parts[1]
        const email = parts[2]

        if (!staffId || !email) {
          await reply(chatId, 'Usage: `/link STAFF_ID EMAIL`\nExample: `/link AFC-0001 commandant@afcs.edu.ng`')
          continue
        }

        const { data: staff } = await supabase
          .from('staff')
          .select('id, full_name')
          .eq('staff_id', staffId)
          .eq('email', email)
          .maybeSingle()

        if (!staff) {
          await reply(chatId, 'No staff found with that Staff ID and email.')
          continue
        }

        const { error } = await supabase
          .from('staff')
          .update({ telegram_chat_id: chatId })
          .eq('id', staff.id)

        if (error) {
          await reply(chatId, 'Failed to link. Try again later.')
        } else {
          await reply(chatId, `✅ *Linked!* You'll now receive notifications here, ${staff.full_name}.`)
        }
      } else if (text === '/unlink') {
        const { data: staff } = await supabase
          .from('staff')
          .select('full_name')
          .eq('telegram_chat_id', chatId)
          .maybeSingle()

        if (staff) {
          await supabase.from('staff').update({ telegram_chat_id: null }).eq('telegram_chat_id', chatId)
          await reply(chatId, `Unlinked, ${staff.full_name}. No more notifications here.`)
        } else {
          await reply(chatId, 'Not linked.')
        }
      } else {
        await reply(chatId, `Unknown command: \`${text.split(' ')[0]}\`\n\n${WELCOME_MESSAGE}`)
      }

      await fetch(`${botUrl}/getUpdates?offset=${update.update_id + 1}`, { method: 'GET' })
      processed++
    }

    return NextResponse.json({ ok: true, processed })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Poll error' }, { status: 500 })
  }
}
