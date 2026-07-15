import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthStaff, requireAdmin } from '@/lib/auth-utils'

const createClassSchema = z.object({
  name: z.string().min(1).max(10),
  arm: z.string().min(1).max(5),
  class_teacher_id: z.string().uuid().nullable().optional(),
})

const updateClassSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(10).optional(),
  arm: z.string().min(1).max(5).optional(),
  class_teacher_id: z.string().uuid().nullable().optional(),
})

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('classes')
    .select('*')
    .order('name')
    .order('arm')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = createClassSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { name, arm, class_teacher_id } = parsed.data

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('classes')
    .insert({ name, arm, class_teacher_id: class_teacher_id || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const parsed = updateClassSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { id, ...updates } = parsed.data

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase.from('classes').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('classes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
