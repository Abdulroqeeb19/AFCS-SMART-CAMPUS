import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/database.types'

interface QueueItem {
  recipient_id?: string
  recipient_phone: string
  recipient_name: string
  channel: string
  message_type: string
  message_body: string
}

/**
 * Enqueue a notification for retry. Inserts into notification_queue table.
 */
export async function enqueueNotification(item: QueueItem): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('notification_queue').insert({
    recipient_id: item.recipient_id || null,
    recipient_phone: item.recipient_phone,
    recipient_name: item.recipient_name,
    channel: item.channel,
    message_type: item.message_type,
    message_body: item.message_body,
    status: 'pending',
    next_attempt_at: new Date(Date.now() + 60_000).toISOString(), // retry in 1 min
  })
}

/**
 * Retry all pending notifications in the queue whose next_attempt_at has passed.
 * Returns counts of processed items.
 */
export async function processQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const supabase = createAdminClient()

  const { data: pending } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .lte('retry_count', 3)
    .order('retry_count')
    .limit(50)

  if (!pending?.length) return { processed: 0, succeeded: 0, failed: 0 }

  let succeeded = 0
  let failed = 0

  for (const item of pending) {
    try {
      // Attempt send via original channel
      const { sendSms } = await import('@/lib/notifications/sms')
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
      const update: Database['public']['Tables']['notification_queue']['Update'] = {
        retry_count: newRetry,
        last_error: err instanceof Error ? err.message : String(err),
        status: newRetry >= 3 ? 'failed' : 'pending',
        next_attempt_at: new Date(Date.now() + newRetry * 120_000).toISOString(), // exponential backoff
      }

      await supabase.from('notification_queue').update(update).eq('id', item.id)
      failed++
    }
  }

  return { processed: pending.length, succeeded, failed }
}

/**
 * Get pending queue count for UI badge
 */
export async function getQueueCount(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('notification_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count || 0
}
