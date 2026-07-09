const SCHOOL_NAME = 'AFCS Campus'

interface SmsResponse {
  success: boolean
  messageId?: string
  error?: string
}

function formatPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '234' + digits.slice(1)
  if (digits.startsWith('+234')) return digits.slice(1)
  return null
}

/**
 * Send SMS via Termii API (popular in Nigeria/Africa).
 * Falls back to Africa's Talking if Termii not configured.
 */
export async function sendSms(
  to: string,
  message: string,
): Promise<SmsResponse> {
  const termiiApiKey = process.env.TERMII_API_KEY
  const termiiSenderId = process.env.TERMII_SENDER_ID || SCHOOL_NAME
  const africasTalkingKey = process.env.AFRICAS_TALKING_API_KEY
  const africasTalkingUsername = process.env.AFRICAS_TALKING_USERNAME

  const phone = formatPhone(to)
  if (!phone) return { success: false, error: 'Invalid phone number' }

  // Truncate SMS to 160 chars for single-part, or use concatenation
  const body = message.length > 1530 ? message.slice(0, 1527) + '...' : message

  // Try Termii first
  if (termiiApiKey) {
    try {
      const res = await fetch('https://api.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: termiiApiKey,
          to: phone,
          from: termiiSenderId,
          sms: body,
          type: 'plain',
          channel: 'generic',
        }),
      })

      const data = await res.json()
      if (data.message?.toLowerCase() === 'success' || data.status === 'success') {
        return { success: true, messageId: data.message_id || data.sms_id }
      }
      // Fall through to Africa's Talking on failure
    } catch (err) {
      console.error('Termii error:', err instanceof Error ? err.message : err)
    }
  }

  // Fallback to Africa's Talking
  if (africasTalkingKey && africasTalkingUsername) {
    try {
      const encoded = new URLSearchParams({
        username: africasTalkingUsername,
        to: phone,
        message: body,
      })

      const res = await fetch(
        'https://api.africastalking.com/version1/messaging',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'ApiKey': africasTalkingKey,
            'Accept': 'application/json',
          },
          body: encoded.toString(),
        },
      )

      const data = await res.json()
      if (data.SMSMessageData?.Recipients?.length > 0) {
        const recipient = data.SMSMessageData.Recipients[0]
        if (recipient.status === 'Success') {
          return { success: true, messageId: recipient.messageId }
        }
      }
      return { success: false, error: data.SMSMessageData?.Message || 'SMS failed' }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'SMS network error' }
    }
  }

  return { success: false, error: 'No SMS provider configured (set TERMII_API_KEY or AFRICAS_TALKING_API_KEY)' }
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSms(
  recipients: { phone: string; name: string }[],
  message: string,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const r of recipients) {
    const result = await sendSms(r.phone, message)
    if (result.success) sent++
    else { failed++; errors.push(`${r.name}: ${result.error}`) }
  }

  return { sent, failed, errors }
}
