import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

const createSubjectSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  department_id: z.string().uuid().nullable().optional(),
  class_level: z.string().max(50).nullable().optional(),
  periods_per_week: z.number().int().min(1).max(20).default(3),
  is_compulsory: z.boolean().default(true),
})

const updateSubjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(20).optional(),
  department_id: z.string().uuid().nullable().optional(),
  class_level: z.string().max(50).nullable().optional(),
  periods_per_week: z.number().int().min(1).max(20).optional(),
  is_compulsory: z.boolean().optional(),
})

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subjects')
    .select('*, department:department_id(name)')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = createSubjectSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { name, code, department_id, class_level, periods_per_week, is_compulsory } = parsed.data
  const { data, error } = await supabase.from('subjects').insert({
    name, code: code.toUpperCase(), department_id: department_id || null,
    class_level: class_level || null, periods_per_week, is_compulsory,
  }).select('*, department:department_id(name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = updateSubjectSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id, ...updates } = parsed.data
  if (updates.code) updates.code = updates.code.toUpperCase()
  const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select('*, department:department_id(name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
