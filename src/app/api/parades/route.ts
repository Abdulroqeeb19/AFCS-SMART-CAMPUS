import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'


const createParadeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['morning', 'evening', 'special']).default('morning'),
  conducted_by: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const limit = searchParams.get('limit') || '10'

  const supabase = createAdminClient()
  let query = supabase
    .from('parade_sessions')
    .select('*, conductor:conducted_by(id, staff_id, full_name), briefings:parade_briefings(*), tasks:parade_tasks(*, assignee:assigned_to(id, staff_id, full_name)), acknowledgements:parade_acknowledgements(*, staff:staff_id(id, staff_id, full_name))')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))

  if (date) query = query.eq('date', date)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  const parsed = createParadeSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { date, type, conducted_by, notes } = parsed.data

  const { data, error } = await supabase
    .from('parade_sessions')
    .insert({
      date: date || new Date().toISOString().split('T')[0],
      type,
      conducted_by: conducted_by || null,
      notes: notes || null,
    })
    .select('*, conductor:conducted_by(id, staff_id, full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
