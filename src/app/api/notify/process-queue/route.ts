import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { sendSms } from '@/lib/notifications/sms'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { data: pending } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .lte('retry_count', 3)
    .order('retry_count')
    .limit(50)

  if (!pending?.length) {
    return NextResponse.json({ processed: 0, message: 'No pending items' })
  }

  let succeeded = 0
  let failed = 0

  for (const item of pending) {
    try {
      const result = await sendSms(item.recipient_phone ?? '', item.message_body)

      if (result.success) {
        await supabase.from('notification_queue').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_error: null,
        }).eq('id', item.id)

        await supabase.from('notification_logs').insert({
          recipient_id: item.recipient_id,
          recipient_phone: item.recipient_phone,
          recipient_name: item.recipient_name,
          channel: item.channel,
          message_type: item.message_type,
          message_body: item.message_body,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

        succeeded++
      } else {
        throw new Error(result.error || 'Send failed')
      }
    } catch (err) {
      const newRetry = (item.retry_count || 0) + 1
      await supabase.from('notification_queue').update({
        retry_count: newRetry,
        last_error: err instanceof Error ? err.message : String(err),
        status: newRetry >= 3 ? 'failed' : 'pending',
        next_attempt_at: new Date(Date.now() + newRetry * 120_000).toISOString(),
      }).eq('id', item.id)
      failed++
    }
  }

  return NextResponse.json({
    processed: pending.length,
    succeeded,
    failed,
    remaining: pending.length - succeeded - failed,
  })
}
