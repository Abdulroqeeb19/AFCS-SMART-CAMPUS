import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

const acknowledgeSchema = z.object({
  staff_id: z.string().uuid(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Authentication required' }, { status: 403 })
  const parsed = acknowledgeSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { staff_id } = parsed.data

  const { data, error } = await supabase
    .from('parade_acknowledgements')
    .insert({
      parade_id: id,
      staff_id,
    })
    .select('*, staff:staff_id(id, staff_id, full_name)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already acknowledged' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('parade_acknowledgements')
    .select('*, staff:staff_id(id, staff_id, full_name)')
    .eq('parade_id', id)
    .order('acknowledged_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
