import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'afcs_webhook_2026'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    if (!value) {
      return NextResponse.json({ status: 'ok' })
    }

    // Process delivery status updates
    const statuses = value.statuses
    if (statuses?.length) {
      const supabase = await createServerSupabaseClient()
      for (const s of statuses) {
        const messageId = s.id
        const status = s.status
        const recipientPhone = s.recipient_id

        if (!messageId || !status) continue

        const mappedStatus =
          status === 'sent' ? 'sent' :
          status === 'delivered' ? 'delivered' :
          status === 'read' ? 'read' :
          status === 'failed' ? 'failed' : 'unknown'

        await supabase
          .from('notification_logs')
          .update({
            status: mappedStatus,
            provider_response: { ...s, updated_at: new Date().toISOString() },
            sent_at: mappedStatus === 'sent' ? new Date().toISOString() : undefined,
          })
          .eq('provider_response->messages[0]->id', messageId)
          .not('provider_response->messages[0]->id', 'is', null)
          .then(() => {})

        if (status === 'failed' && recipientPhone) {
          const { data: staff } = await supabase
            .from('staff')
            .select('id')
            .eq('phone', recipientPhone)
            .maybeSingle()

          if (staff) {
            const { sendSms } = await import('@/lib/notifications/sms')
            const { data: failedLog } = await supabase
              .from('notification_logs')
              .select('*')
              .eq('provider_response->messages[0]->id', messageId)
              .maybeSingle()

            if (failedLog?.message_body) {
              await sendSms(recipientPhone, failedLog.message_body)

              await supabase.from('notification_logs').insert({
                recipient_id: failedLog.recipient_id,
                recipient_phone: recipientPhone,
                recipient_name: failedLog.recipient_name,
                channel: 'sms',
                message_type: failedLog.message_type,
                message_body: failedLog.message_body,
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
            }
          }
        }
      }
    }

    // Process incoming messages (future: auto-reply, opt-out handling)
    const messages = value.messages
    if (messages?.length) {
      for (const msg of messages) {
        if (msg.type === 'text' && msg.text?.body) {
          const incoming = msg.text.body.toLowerCase().trim()
          const from = msg.from

          if (incoming === 'stop' || incoming === 'opt out' || incoming === 'unsubscribe') {
            const supabase = await createServerSupabaseClient()
            await supabase
              .from('staff')
              .update({ notification_preferences: { whatsapp: false, sms: false, print: true } })
              .eq('phone', from)
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'ok' })
  }
}
