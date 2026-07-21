import { sendSms } from '@/lib/notifications/sms'
import { enqueueNotification } from '@/lib/notifications/queue'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage, sendTelegramKeyboard, answerCallbackQuery } from '@/lib/telegram/send'
import { getTelegramBotToken } from '@/lib/telegram/token'

const WHATSAPP_API_VERSION = 'v22.0'
const SCHOOL_NAME = 'AFCS Smart Campus'

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  channel?: string
  queued?: boolean
}

interface StaffInfo {
  id: string
  full_name: string
  phone: string | null
  telegram_chat_id?: string | null
}

function formatPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '234' + digits.slice(1)
  if (digits.startsWith('+234')) return digits.slice(1)
  return null
}

async function sendToWebhook(payload: {
  type: string
  recipient: string
  recipient_name: string
  message: string
}): Promise<void> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, sender: SCHOOL_NAME, timestamp: new Date().toISOString() }),
    })
  } catch {
    console.error('Webhook call failed')
  }
}

const TEMPLATE_NAMES: Record<string, string> = {
  duty: process.env.WHATSAPP_TEMPLATE_DUTY || '',
  parade_task: process.env.WHATSAPP_TEMPLATE_TASK || '',
  period_reminder: process.env.WHATSAPP_TEMPLATE_PERIOD || '',
  broadcast: process.env.WHATSAPP_TEMPLATE_BROADCAST || '',
}

async function sendWhatsAppCloud(to: string, messageBody: string, templateName?: string, templateParams?: string[]): Promise<SendResult> {
  const token = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp not configured' }
  }

  try {
    let payload: Record<string, unknown>

    if (templateName && templateParams?.length) {
      payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: templateParams.map((p) => ({ type: 'text', text: p })),
            },
          ],
        },
      }
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: messageBody },
      }
    }

    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'WhatsApp API error' }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

function buildMessageBody(staffName: string, taskType: string, taskDescription: string, date: string, deadline: string | null, details?: string): string {
  let body = `🏫 *${SCHOOL_NAME}*\n`
  body += `─────────────────\n\n`
  body += `Hello *${staffName}*,\n\n`
  body += `You have been assigned a new task:\n\n`
  body += `📋 *${taskType === 'duty' ? 'Duty Assignment' : taskType === 'period_reminder' ? 'Period Reminder' : 'Parade Task'}*\n`
  body += `━━━━━━━━━━━━━━━\n`
  body += `📌 ${taskDescription}\n`
  body += `📅 Date: ${date}\n`
  if (deadline) body += `⏰ Deadline: ${deadline}\n`
  if (details) body += `📝 ${details}\n`
  body += `━━━━━━━━━━━━━━━\n\n`
  body += `Please log in to the Smart Campus portal to update your task status.\n\n`
  body += `_Air Force Comprehensive School_`
  return body
}

function buildPlainBody(staffName: string, taskType: string, taskDescription: string, date: string, deadline: string | null, details?: string): string {
  let body = `AFCS Smart Campus - `
  body += `Hello ${staffName}, `
  body += `You have been assigned: ${taskDescription}. `
  body += `Date: ${date}`
  if (deadline) body += `, Deadline: ${deadline}`
  if (details) body += `. ${details}`
  body += `. Login to update status.`
  return body
}

async function sendViaChannels(
  staff: StaffInfo,
  messageType: string,
  messageBody: string,
  plainBody: string,
): Promise<SendResult> {
  // Try Telegram first (free, reliable, no approval needed)
  if (staff.telegram_chat_id) {
    const tgToken = await getTelegramBotToken()
    const tgResult = await sendTelegramMessage(staff.telegram_chat_id, messageBody, tgToken)
    if (tgResult.success) {
      await logNotification(staff, 'telegram', messageType, messageBody, 'sent')
      return { success: true, messageId: tgResult.messageId, channel: 'telegram' }
    }
  }

  // Try SMS (Termii or Africa's Talking)
  const phoneFormatted = staff.phone ? formatPhone(staff.phone) : null
  if (phoneFormatted) {
    const smsResult = await sendSms(phoneFormatted, plainBody)
    if (smsResult.success) {
      await logNotification(staff, 'sms', messageType, plainBody, 'sent')
      return { success: true, messageId: smsResult.messageId, channel: 'sms' }
    }
  }

  // Try WhatsApp Cloud API (Meta Business API)
  const templateName = TEMPLATE_NAMES[messageType]
  const templateParams = templateName ? [staff.full_name, plainBody] : undefined

  if (phoneFormatted) {
    const whatsappResult = await sendWhatsAppCloud(phoneFormatted, messageBody, templateName || undefined, templateParams)
    if (whatsappResult.success) {
      await logNotification(staff, 'whatsapp', messageType, messageBody, 'sent')
      return { success: true, messageId: whatsappResult.messageId, channel: 'whatsapp' }
    }

    // Try WhatsApp text (within 24h CS window)
    const textResult = await sendWhatsAppCloud(phoneFormatted, messageBody)
    if (textResult.success) {
      await logNotification(staff, 'whatsapp', messageType, messageBody, 'sent')
      return { success: true, messageId: textResult.messageId, channel: 'whatsapp' }
    }
  }

  // Queue for retry
  if (phoneFormatted) {
    await enqueueNotification({
      recipient_id: staff.id,
      recipient_phone: phoneFormatted,
      recipient_name: staff.full_name,
      channel: 'sms',
      message_type: messageType,
      message_body: plainBody,
    })
  }

  await logNotification(staff, phoneFormatted ? 'sms' : 'telegram', messageType, messageBody, 'queued')
  return { success: false, error: 'All channels failed', channel: 'queued', queued: !!(phoneFormatted || staff.telegram_chat_id) }
}

async function logNotification(
  staff: StaffInfo,
  channel: string,
  messageType: string,
  messageBody: string,
  status: string,
): Promise<void> {
  const supabase = await import('@/lib/supabase/admin').then(m => m.createAdminClient()) as ReturnType<typeof createAdminClient>
  await supabase.from('notification_logs').insert({
    recipient_id: staff.id,
    recipient_phone: staff.phone,
    recipient_name: staff.full_name,
    channel,
    message_type: messageType,
    message_body: messageBody,
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  })
}

export async function sendTaskAssignmentNotification(
  staff: StaffInfo,
  taskType: 'duty' | 'parade_task' | 'period_reminder',
  taskDescription: string,
  date: string,
  deadline: string | null,
  details?: string,
  taskId?: string,
): Promise<SendResult> {
  const messageBody = buildMessageBody(staff.full_name, taskType, taskDescription, date, deadline, details)
  const plainBody = buildPlainBody(staff.full_name, taskType, taskDescription, date, deadline, details)

  // Send via Telegram with inline keyboard (for interactive response)
  if (staff.telegram_chat_id && taskId) {
    const tgToken = await getTelegramBotToken()
    if (tgToken) {
      const keyboardMsg = messageBody + (
        `\n\n_Reply via buttons below. Your response will be sent to the commandant._`
      )
      const tgResult = await sendTelegramKeyboard(
        staff.telegram_chat_id,
        keyboardMsg,
        [
          [
            { text: '✅ Acknowledge Task', callback_data: `task_ack:${taskId}` },
          ],
          [
            { text: '✅ Mark Complete', callback_data: `task_done:${taskId}` },
          ],
          [
            { text: '❌ Report Issue', callback_data: `task_issue:${taskId}` },
          ],
        ],
        tgToken,
      )

      if (tgResult.success && tgResult.messageId) {
        // Store message mapping for callback processing
        try {
          const supabase = createAdminClient()
          await supabase.from('telegram_task_messages').insert({
            telegram_message_id: Number(tgResult.messageId),
            task_id: taskId,
            chat_id: staff.telegram_chat_id,
          })
        } catch { /* non-critical */ }

        await logNotification(staff, 'telegram', taskType, messageBody, 'sent')
        return { success: true, messageId: tgResult.messageId, channel: 'telegram' }
      } else {
        await logNotification(staff, 'telegram', taskType, messageBody, 'failed')
      }
    }
  }

  // Fall through to other channels (SMS, WhatsApp, queue)
  const result = await sendViaChannels(staff, taskType, messageBody, plainBody)

  await sendToWebhook({
    type: result.channel || 'whatsapp',
    recipient: staff.phone || 'no-phone',
    recipient_name: staff.full_name,
    message: result.channel === 'sms' ? plainBody : messageBody,
  })

  return result
}

export async function notifyMultipleStaff(
  staffList: StaffInfo[],
  taskType: 'duty' | 'parade_task' | 'period_reminder',
  taskDescription: string,
  date: string,
  deadline: string | null,
  details?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const staff of staffList) {
    const result = await sendTaskAssignmentNotification(staff, taskType, taskDescription, date, deadline, details)
    if (result.success) {
      sent++
    } else {
      failed++
      if (result.error) errors.push(`${staff.full_name}: ${result.error}`)
    }
  }

  return { sent, failed, errors }
}

/**
 * Send a plain text notification via SMS-only channel (no WhatsApp attempt).
 */
export async function sendSmsNotification(
  staff: StaffInfo,
  message: string,
): Promise<SendResult> {
  if (!staff.phone) return { success: false, error: 'No phone number' }
  const phoneFormatted = formatPhone(staff.phone)
  if (!phoneFormatted) return { success: false, error: 'Invalid phone number' }

  const smsResult = await sendSms(phoneFormatted, message)
  if (smsResult.success) {
    await logNotification(staff, 'sms', 'sms_direct', message, 'sent')
    return { success: true, messageId: smsResult.messageId, channel: 'sms' }
  }

  await enqueueNotification({
    recipient_id: staff.id,
    recipient_phone: phoneFormatted,
    recipient_name: staff.full_name,
    channel: 'sms',
    message_type: 'sms_direct',
    message_body: message,
  })

  return { success: false, error: 'Queued for retry', queued: true }
}

/**
 * Send a broadcast to all active staff via their preferred channel.
 */
/**
 * Send a parade started alert to all active staff with Telegram linked.
 */
export async function sendParadeStartedNotification(
  paradeType: string,
  date: string,
  conductorName: string | null,
): Promise<{ sent: number; failed: number }> {
  const supabase = await import('@/lib/supabase/admin').then(m => m.createAdminClient()) as ReturnType<typeof createAdminClient>

  const { data: staffList } = await supabase
    .from('staff')
    .select('id, full_name, phone, telegram_chat_id')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)

  if (!staffList?.length) return { sent: 0, failed: 0 }

  const label = paradeType === 'morning' ? 'Morning' : paradeType === 'evening' ? 'Evening' : 'Special'
  const messageBody =
    `🏫 *AFCS Smart Campus*\n` +
    `─────────────────\n\n` +
    `🚨 *Parade Alert*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `The *${label} Parade* for today (${date}) has just started.\n` +
    `${conductorName ? `Conducted by: ${conductorName}\n` : ''}\n` +
    `Please proceed to the parade ground.\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `_Air Force Comprehensive School_`

  const plainBody = messageBody.replace(/\*+/g, '').replace(/[━─]+/g, '')

  let sent = 0, failed = 0
  for (const s of staffList) {
    const result = await sendViaChannels(
      { id: s.id, full_name: s.full_name, phone: s.phone, telegram_chat_id: s.telegram_chat_id },
      'parade_alert',
      messageBody,
      plainBody,
    )
    if (result.success) sent++
    else failed++
  }
  return { sent, failed }
}

/**
 * Send a parade cancelled alert to all staff who acknowledged that parade.
 */
export async function sendParadeCancelledNotification(
  paradeId: string,
  paradeType: string,
  date: string,
): Promise<{ sent: number; failed: number }> {
  const supabase = await import('@/lib/supabase/admin').then(m => m.createAdminClient()) as ReturnType<typeof createAdminClient>

  const { data: acks } = await supabase
    .from('parade_acknowledgements')
    .select('staff:staff_id(id, full_name, phone, telegram_chat_id)')
    .eq('parade_id', paradeId)

  if (!acks?.length) return { sent: 0, failed: 0 }

  const label = paradeType === 'morning' ? 'Morning' : paradeType === 'evening' ? 'Evening' : 'Special'
  const messageBody =
    `🏫 *AFCS Smart Campus*\n` +
    `─────────────────\n\n` +
    `🚨 *Parade Update*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `The *${label} Parade* for ${date} has been cancelled.\n\n` +
    `Please check the portal for further updates.\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `_Air Force Comprehensive School_`

  const plainBody = messageBody.replace(/\*+/g, '').replace(/[━─]+/g, '')

  let sent = 0, failed = 0
  for (const ack of (acks as any[])) {
    const staff = Array.isArray(ack.staff) ? ack.staff[0] : ack.staff
    if (!staff?.telegram_chat_id) continue
    const result = await sendViaChannels(
      { id: staff.id, full_name: staff.full_name, phone: staff.phone, telegram_chat_id: staff.telegram_chat_id },
      'parade_cancelled',
      messageBody,
      plainBody,
    )
    if (result.success) sent++
    else failed++
  }
  return { sent, failed }
}

/**
 * Send a daily report submission alert to all admin staff.
 */
export async function sendDailyReportNotification(
  reporterName: string,
  date: string,
  activitiesPreview: string,
): Promise<{ sent: number; failed: number }> {
  const supabase = await import('@/lib/supabase/admin').then(m => m.createAdminClient()) as ReturnType<typeof createAdminClient>

  const { data: admins } = await supabase
    .from('staff')
    .select('id, full_name, phone, telegram_chat_id')
    .eq('is_active', true)
    .in('role', ['admin', 'commandant'])
    .not('telegram_chat_id', 'is', null)

  if (!admins?.length) return { sent: 0, failed: 0 }

  const preview = activitiesPreview.length > 80
    ? activitiesPreview.slice(0, 80) + '...'
    : activitiesPreview

  const messageBody =
    `🏫 *AFCS Smart Campus*\n` +
    `─────────────────\n\n` +
    `📋 *Daily Report Submitted*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `👤 *${reporterName}*\n` +
    `📅 ${date}\n` +
    `📝 ${preview}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `View all reports on the portal.\n\n` +
    `_Air Force Comprehensive School_`

  const plainBody = messageBody.replace(/\*+/g, '').replace(/[━─]+/g, '')

  let sent = 0, failed = 0
  for (const a of admins) {
    const result = await sendViaChannels(
      { id: a.id, full_name: a.full_name, phone: a.phone, telegram_chat_id: a.telegram_chat_id },
      'daily_report',
      messageBody,
      plainBody,
    )
    if (result.success) sent++
    else failed++
  }
  return { sent, failed }
}

export async function sendBroadcastNotification(
  message: string,
  targetRoles?: string[],
): Promise<{ sent: number; failed: number; queued: number }> {
  const supabase = await import('@/lib/supabase/admin').then(m => m.createAdminClient())

  let query = supabase.from('staff').select('*').eq('is_active', true)
  if (targetRoles?.length) query = query.in('role', targetRoles)

  const { data: staffList } = await query
  if (!staffList?.length) return { sent: 0, failed: 0, queued: 0 }

  const plainBody = message.replace(/\*+/g, '').replace(/[━─]+/g, '')

  let sent = 0, failed = 0, queued = 0

  for (const s of staffList) {
    const result = await sendViaChannels(
      { id: s.id, full_name: s.full_name, phone: s.phone, telegram_chat_id: s.telegram_chat_id },
      'broadcast',
      message,
      plainBody,
    )
    if (result.success) sent++
    else if (result.queued) queued++
    else failed++
  }

  return { sent, failed, queued }
}
