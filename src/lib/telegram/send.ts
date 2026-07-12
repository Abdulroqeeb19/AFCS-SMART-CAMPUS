interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

interface InlineButton {
  text: string
  callback_data: string
}

function getToken(override?: string): string {
  return override || process.env.TELEGRAM_BOT_TOKEN || ''
}

export async function sendTelegramMessage(chatId: string, message: string, tokenOverride?: string): Promise<SendResult> {
  const token = getToken(tokenOverride)
  if (!token) {
    return { success: false, error: 'Telegram bot not configured. Set TELEGRAM_BOT_TOKEN.' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    const data = await res.json()
    if (!data.ok) {
      return { success: false, error: data.description || 'Telegram API error' }
    }

    return { success: true, messageId: String(data.result?.message_id) }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Telegram network error' }
  }
}

export async function setWebhook(url: string, tokenOverride?: string): Promise<SendResult> {
  const token = getToken(tokenOverride)
  if (!token) return { success: false, error: 'Telegram bot not configured' }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (!data.ok) return { success: false, error: data.description || 'Failed to set webhook' }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export async function deleteWebhook(tokenOverride?: string): Promise<SendResult> {
  const token = getToken(tokenOverride)
  if (!token) return { success: false, error: 'Telegram bot not configured' }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' })
    const data = await res.json()
    if (!data.ok) return { success: false, error: data.description || 'Failed to delete webhook' }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export async function getWebhookInfo(tokenOverride?: string): Promise<{ url: string; pending?: number; error?: string }> {
  const token = getToken(tokenOverride)
  if (!token) return { url: '', error: 'Telegram bot not configured' }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    const data = await res.json()
    if (!data.ok) return { url: '', error: data.description }
    return { url: data.result.url, pending: data.result.pending_update_count }
  } catch (err) {
    return { url: '', error: err instanceof Error ? err.message : 'Network error' }
  }
}

export async function sendTelegramKeyboard(
  chatId: string,
  message: string,
  buttons: InlineButton[][],
  tokenOverride?: string,
): Promise<SendResult> {
  const token = getToken(tokenOverride)
  if (!token) return { success: false, error: 'Telegram bot not configured' }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: buttons },
      }),
    })

    const data = await res.json()
    if (!data.ok) return { success: false, error: data.description || 'Telegram API error' }
    return { success: true, messageId: String(data.result?.message_id) }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Telegram network error' }
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  tokenOverride?: string,
): Promise<void> {
  const token = getToken(tokenOverride)
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || '' }),
    })
  } catch {
    // Network error — no recovery needed for callback ack
  }
}

export async function editMessageReplyMarkup(
  chatId: string,
  messageId: number,
  buttons?: InlineButton[][],
  tokenOverride?: string,
): Promise<void> {
  const token = getToken(tokenOverride)
  if (!token) return

  const replyMarkup = buttons ? { inline_keyboard: buttons } : { inline_keyboard: [] }

  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
    })
  } catch {
    // Network error — message may have been deleted, non-critical
  }
}
