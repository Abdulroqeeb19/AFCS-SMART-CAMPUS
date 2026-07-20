import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { id } = await params

  if (id === 'read-all') {
    const { error } = await supabase
      .from('notification_logs')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', auth.id)
      .eq('is_read', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { error } = await supabase
    .from('notification_logs')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('recipient_id', auth.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
