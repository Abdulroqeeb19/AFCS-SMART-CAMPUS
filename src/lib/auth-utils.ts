import { createServerSupabaseClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getAuthStaff(supabase: SupabaseClient, request?: Request): Promise<{ id: string; role: string } | null> {
  // Production: use Supabase Auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, role')
      .ilike('email', user.email)
      .eq('is_active', true)
      .single()
    if (staff) return staff
  }

  // Dev mode: read header from client
  if (request && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    const devEmail = request.headers.get('x-auth-email')
    if (devEmail) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id, role')
        .ilike('email', devEmail)
        .eq('is_active', true)
        .single()
      if (staff) return staff
    }
  }

  return null
}

export async function requireAdmin(supabase: SupabaseClient, request?: Request): Promise<{ id: string } | null> {
  const staff = await getAuthStaff(supabase, request)
  if (!staff || !['admin', 'commandant'].includes(staff.role)) return null
  return { id: staff.id }
}
