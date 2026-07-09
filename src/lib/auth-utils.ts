import { createServerSupabaseClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getAuthStaff(supabase: SupabaseClient, request?: Request): Promise<{ id: string; role: string } | null> {
  // Production: use Supabase Auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, role')
      .eq('email', user.email)
      .single()
    if (staff) return staff
  }

  // Dev mode: read header from client (localhost only — prevents accidental prod exposure)
  if (request && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    const host = request.headers.get('host') || ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1')
    if (!isLocalhost) return null

    const devEmail = request.headers.get('x-auth-email')
    if (devEmail) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id, role')
        .eq('email', devEmail)
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
