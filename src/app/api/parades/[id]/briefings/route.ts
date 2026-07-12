import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'


const createBriefingSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(10000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().max(100).default('general'),
  created_by: z.string().uuid().nullable().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { data, error } = await supabase
    .from('parade_briefings')
    .select('*, author:created_by(id, staff_id, full_name)')
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
  const parsed = createBriefingSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { title, content, priority, category, created_by } = parsed.data

  const { data, error } = await supabase
    .from('parade_briefings')
    .insert({
      parade_id: id,
      title,
      content,
      priority,
      category,
      created_by: created_by || null,
    })
    .select('*, author:created_by(id, staff_id, full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
