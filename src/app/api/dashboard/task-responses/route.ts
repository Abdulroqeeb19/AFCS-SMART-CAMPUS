import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
  const taskId = searchParams.get('task_id')

  let query = adminClient
    .from('task_responses')
    .select('*, task:task_id(id, description, status, priority), staff:staff_id(id, staff_id, full_name, role)')
    .order('responded_at', { ascending: false })
    .limit(limit)

  if (taskId) query = query.eq('task_id', taskId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
