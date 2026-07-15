import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { sendTaskAssignmentNotification } from '@/lib/notifications'
import type { Json } from '@/lib/database.types'

const notifySchema = z.object({
  type: z.string().max(50).optional(),
  recipient: z.string().max(255).optional(),
  message: z.string().max(10000).optional(),
  staff_id: z.string().uuid().optional(),
  task_type: z.string().max(50).optional(),
  task_description: z.string().max(5000).optional(),
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  task_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = notifySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { type, recipient, message, staff_id, task_type, task_description, task_date, task_deadline } = parsed.data

  if ((!type || !recipient || !message) && !staff_id) {
    return NextResponse.json({ error: 'Send either {type,recipient,message} for custom or {staff_id,task_type,task_description} for tasks' }, { status: 400 })
  }

  if (staff_id) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, full_name, phone, telegram_chat_id')
      .eq('id', staff_id)
      .single()

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const result = await sendTaskAssignmentNotification(
      { id: staff.id, full_name: staff.full_name, phone: staff.phone, telegram_chat_id: staff.telegram_chat_id },
      (task_type || 'duty') as 'duty' | 'parade_task',
      (task_description || message || ''),
      task_date || new Date().toISOString().split('T')[0],
      task_deadline || null,
    )

    await supabase.from('notification_logs').insert({
      recipient_id: staff.id,
      recipient_phone: staff.phone,
      recipient_name: staff.full_name,
      channel: 'whatsapp',
      message_type: task_type || 'task',
      message_body: message || task_description || '',
      status: result.success ? 'sent' : 'failed',
      provider_response: result as unknown as Json,
      sent_at: result.success ? new Date().toISOString() : null,
    })

    return NextResponse.json({ queued: true, result })
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, recipient, message, sender: 'AFCS Smart Campus', timestamp: new Date().toISOString() }),
      })
    } catch (err) {
      console.error('Webhook call failed:', err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({
    queued: true,
    channel: type === 'whatsapp' ? 'WhatsApp' : type || 'unknown',
    note: webhookUrl
      ? 'Notification forwarded to automation webhook'
      : 'No webhook configured. Set MAKE_WEBHOOK_URL or N8N_WEBHOOK_URL.',
  })
}
