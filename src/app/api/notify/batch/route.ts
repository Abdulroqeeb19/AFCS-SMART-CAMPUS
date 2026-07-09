import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { notifyMultipleStaff } from '@/lib/notifications'

const batchSchema = z.object({
  staff_ids: z.array(z.string().uuid()).nonempty(),
  task_type: z.string().max(50).default('duty'),
  task_description: z.string().max(5000).default('New assignment'),
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  task_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  details: z.string().max(5000).optional(),
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = batchSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { staff_ids, task_type, task_description, task_date, task_deadline, details } = parsed.data

  const { data: staffList } = await supabase
    .from('staff')
    .select('id, full_name, phone')
    .in('id', staff_ids)

  if (!staffList || staffList.length === 0) {
    return NextResponse.json({ error: 'No staff found' }, { status: 404 })
  }

  const result = await notifyMultipleStaff(
    staffList,
    (task_type || 'duty') as 'duty' | 'parade_task' | 'period_reminder',
    task_description || 'New assignment',
    task_date || new Date().toISOString().split('T')[0],
    task_deadline || null,
    details,
  )

  const logs = staffList.map((s) => ({
    recipient_id: s.id,
    recipient_phone: s.phone,
    recipient_name: s.full_name,
    channel: 'whatsapp',
    message_type: task_type || 'duty',
    message_body: task_description || 'New assignment',
    status: 'sent' as const,
    sent_at: new Date().toISOString(),
  }))

  if (logs.length > 0) {
    await supabase.from('notification_logs').insert(logs)
  }

  return NextResponse.json({
    total: staffList.length,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors.slice(0, 5),
  })
}
