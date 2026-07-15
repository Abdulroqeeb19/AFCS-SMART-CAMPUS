import { createAdminClient } from '@/lib/supabase/admin'

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; resetInSeconds: number }> {
  try {
    const supabase = createAdminClient()
    const now = Date.now()
    const windowStart = new Date(now - windowSeconds * 1000).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rl: any = supabase.from('rate_limit_logs')
    const { count } = await rl
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart)

    const currentCount = count || 0

    if (currentCount >= maxRequests) {
      const resetInSeconds = windowSeconds - Math.floor((now - new Date(windowStart).getTime()) / 1000)
      return { allowed: false, resetInSeconds: Math.max(1, resetInSeconds) }
    }

    await rl.insert({
      key,
      created_at: new Date().toISOString(),
    })

    return { allowed: true, resetInSeconds: windowSeconds }
  } catch {
    return { allowed: true, resetInSeconds: 1 }
  }
}
