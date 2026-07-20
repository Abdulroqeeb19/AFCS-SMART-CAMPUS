const FREE_EXPIRY_DATE = process.env.FREE_EXPIRY_DATE || '2027-07-20T00:00:00Z'
const FREE_EXPIRY = new Date(FREE_EXPIRY_DATE)

export function isWithinFreePeriod(): boolean {
  return new Date() < FREE_EXPIRY
}

export function getFreeDaysRemaining(): number {
  return Math.max(0, Math.ceil((FREE_EXPIRY.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export function getFreeExpiryDate(): string {
  return FREE_EXPIRY_DATE
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkLicense(supabase: SupabaseClient): Promise<{
  locked: boolean
  reason: string | null
  daysRemaining: number
  free: boolean
}> {
  const now = new Date()

  if (now < FREE_EXPIRY) {
    return {
      locked: false,
      reason: null,
      daysRemaining: Math.ceil((FREE_EXPIRY.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      free: true,
    }
  }

  const { data } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data && data.is_active !== false) {
    const expires = new Date(data.expires_at)
    if (now < expires) {
      return {
        locked: false,
        reason: null,
        daysRemaining: Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        free: false,
      }
    }
  }

  return {
    locked: true,
    reason: 'The free access period has ended. A valid license key is required to continue using AFCS Smart Campus. Please contact the system administrator.',
    daysRemaining: 0,
    free: false,
  }
}
