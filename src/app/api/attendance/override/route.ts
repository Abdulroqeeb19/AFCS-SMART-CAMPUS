import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

const MAX_BODY_SIZE = 4096

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Verify admin/commandant role
  const { data: requester } = await supabase
    .from('staff')
    .select('id, role')
    .eq('email', user.email)
    .single()

  if (!requester || !['admin', 'commandant'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }

  const { id, status, notes, check_in, check_out, reason } = JSON.parse(raw)

  if (!id) {
    return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 })
  }

  const updates: Database['public']['Tables']['staff_attendance']['Update'] = { updated_at: new Date().toISOString(), overridden_by: requester.id, overridden_at: new Date().toISOString() }

  if (status) {
    if (!['present', 'late', 'absent'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = status
  }
  if (notes !== undefined) updates.notes = notes
  if (reason) updates.override_reason = reason
  if (check_in !== undefined) updates.check_in = check_in
  if (check_out !== undefined) updates.check_out = check_out

  const { data, error } = await supabase
    .from('staff_attendance')
    .update(updates)
    .eq('id', id)
    .select('*, staff:staff_id(full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await supabase.from('audit_logs').insert({
    staff_id: requester.id,
    action: 'override_attendance',
    entity_type: 'staff_attendance',
    entity_id: id,
    changes: { status: status || 'unchanged', check_in, check_out, reason },
  }).maybeSingle()

  return NextResponse.json(data)
}
