import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'
import { sendTaskAssignmentNotification } from '@/lib/notifications'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'

const createTaskSchema = z.object({
  briefing_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  deadline: z.string().nullable().optional(),
})

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(5000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  deadline: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  completed_at: z.string().datetime().nullable().optional(),
  briefing_id: z.string().uuid().nullable().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('parade_tasks')
    .select('*, assignee:assigned_to(id, staff_id, full_name)')
    .eq('parade_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  const parsed = createTaskSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { briefing_id, assigned_to, description, priority, deadline } = parsed.data

  const { data, error } = await supabase
    .from('parade_tasks')
    .insert({
      parade_id: id,
      briefing_id: briefing_id || null,
      assigned_to: assigned_to || null,
      description,
      priority,
      deadline: deadline || null,
    })
    .select('*, assignee:assigned_to(id, staff_id, full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (assigned_to && data) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, full_name, phone, telegram_chat_id')
      .eq('id', assigned_to)
      .single()

    if (staff) {
      const result = await sendTaskAssignmentNotification(
        { id: staff.id, full_name: staff.full_name, phone: staff.phone, telegram_chat_id: staff.telegram_chat_id },
        'parade_task',
        data.description,
        new Date().toISOString().split('T')[0],
        data.deadline,
        `Priority: ${data.priority}`,
        data.id,
      )

      await supabase.from('notification_logs').insert({
        recipient_id: staff.id,
        recipient_phone: staff.phone,
        recipient_name: staff.full_name,
        channel: result.channel || 'telegram',
        message_type: 'parade_task',
        message_body: data.description,
        status: result.success ? 'sent' : 'failed',
        provider_response: result as unknown as Json,
        sent_at: result.success ? new Date().toISOString() : null,
      })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('id')
  const olderThanWeeks = searchParams.get('older_than_weeks')

  // Batch delete: completed tasks older than N weeks
  if (olderThanWeeks) {
    const weeks = parseInt(olderThanWeeks)
    if (isNaN(weeks) || weeks < 1) return NextResponse.json({ error: 'Invalid weeks' }, { status: 400 })

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - weeks * 7)

    const { data: toDelete } = await supabase
      .from('parade_tasks')
      .select('id')
      .eq('status', 'completed')
      .lt('completed_at', cutoff.toISOString())

    if (!toDelete?.length) return NextResponse.json({ deleted: 0 })

    const ids = toDelete.map((t) => t.id)

    await supabase.from('task_responses').delete().in('task_id', ids)
    await supabase.from('telegram_task_messages').delete().in('task_id', ids)
    const { error } = await supabase.from('parade_tasks').delete().in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ deleted: ids.length })
  }

  // Single task delete
  if (!taskId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('task_responses').delete().eq('task_id', taskId)
  await supabase.from('telegram_task_messages').delete().eq('task_id', taskId)
  const { error } = await supabase.from('parade_tasks').delete().eq('id', taskId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: 1 })
}

export async function PATCH(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  const parsed = updateTaskSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id, ...updates } = parsed.data

  if (updates.status === 'completed' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('parade_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, assignee:assigned_to(id, staff_id, full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.assigned_to && data) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, full_name, phone, telegram_chat_id')
      .eq('id', updates.assigned_to)
      .single()

    if (staff) {
      const result = await sendTaskAssignmentNotification(
        { id: staff.id, full_name: staff.full_name, phone: staff.phone, telegram_chat_id: staff.telegram_chat_id },
        'parade_task',
        data.description,
        new Date().toISOString().split('T')[0],
        data.deadline,
        `Priority: ${data.priority}`,
        data.id,
      )

      await supabase.from('notification_logs').insert({
        recipient_id: staff.id,
        recipient_phone: staff.phone,
        recipient_name: staff.full_name,
        channel: result.channel || 'telegram',
        message_type: 'parade_task',
        message_body: data.description,
        status: result.success ? 'sent' : 'failed',
        provider_response: result as unknown as Json,
        sent_at: result.success ? new Date().toISOString() : null,
      })
    }
  }

  return NextResponse.json(data)
}
