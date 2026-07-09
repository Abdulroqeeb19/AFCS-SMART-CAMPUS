import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { sendBroadcastNotification } from '@/lib/notifications'
import type { Database } from '@/lib/database.types'

const createSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(10000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  target_roles: z.array(z.string()).nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(10000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  target_roles: z.array(z.string()).nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
})

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('broadcast_messages')
    .select('*, author:created_by(id, staff_id, full_name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { title, content, priority, target_roles, status } = parsed.data
  const { data, error } = await supabase.from('broadcast_messages').insert({
    title: title || null, content,
    priority,
    target_roles: target_roles || null,
    status,
  }).select('*, author:created_by(id, staff_id, full_name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id, ...updates } = parsed.data
  const dbUpdates: Database['public']['Tables']['broadcast_messages']['Update'] = { ...updates }
  if (updates.status === 'published') dbUpdates.published_at = new Date().toISOString()
  const { data, error } = await supabase.from('broadcast_messages').update(dbUpdates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send WhatsApp when broadcast is published
  if (updates.status === 'published' && data) {
    const message = data.title ? `*${data.title}*\n\n${data.content}` : data.content
    const result = await sendBroadcastNotification(
      message,
      data.target_roles || undefined,
    )
    await supabase.from('broadcast_messages').update({
      published_at: new Date().toISOString(),
    } as Database['public']['Tables']['broadcast_messages']['Update']).eq('id', id).then(() => {})
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('broadcast_messages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
