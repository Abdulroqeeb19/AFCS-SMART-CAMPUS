import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthStaff } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const auth = await getAuthStaff(supabase, request)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
  const unreadOnly = searchParams.get('unread_only') === 'true'

  let query = supabase
    .from('notification_logs')
    .select('*', { count: 'exact' })
    .eq('recipient_id', auth.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count: unread_count } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', auth.id)
    .eq('is_read', false)

  return NextResponse.json({ data: data || [], unread_count: unread_count || 0, total: count })
}
