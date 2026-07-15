import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { sendParadeStartedNotification, sendParadeCancelledNotification } from '@/lib/notifications'


const updateParadeSchema = z.object({
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).optional(),
  start_time: z.string().datetime().nullable().optional(),
  end_time: z.string().datetime().nullable().optional(),
  conducted_by: z.string().uuid().nullable().optional(),
  type: z.enum(['morning', 'evening', 'special']).optional(),
  notes: z.string().max(2000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const adminSupabase = createAdminClient()

  const parsed = updateParadeSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const updates = parsed.data

  if (updates.status === 'completed' && !updates.end_time) {
    updates.end_time = new Date().toISOString()
  }
  if (updates.status === 'ongoing' && !updates.start_time) {
    updates.start_time = new Date().toISOString()
  }

  const { data, error } = await adminSupabase
    .from('parade_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, conductor:conducted_by(id, staff_id, full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget notifications for status changes
  if (data && updates.status === 'ongoing') {
    sendParadeStartedNotification(
      data.type,
      data.date,
      Array.isArray(data.conductor) ? data.conductor[0]?.full_name : data.conductor?.full_name || null,
    ).catch(() => {})
  } else if (data && updates.status === 'cancelled') {
    sendParadeCancelledNotification(id, data.type, data.date).catch(() => {})
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from('parade_sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
