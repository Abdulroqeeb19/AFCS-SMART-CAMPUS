import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    adminClient = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    return adminClient
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return adminClient
}