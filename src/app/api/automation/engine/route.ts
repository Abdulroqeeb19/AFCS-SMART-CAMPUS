import { NextResponse } from 'next/server'
import { runAutomationEngine } from '@/lib/automation'
import { getAuthStaff } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const staff = await getAuthStaff(supabase, request)

  const cronSecret = request.headers.get('x-cron-secret')
  const isCronCall = !staff && !request.headers.get('x-auth-email') &&
    cronSecret === process.env.CRON_SECRET

  if (!isCronCall && staff?.role !== 'admin' && staff?.role !== 'commandant' && staff) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  if (!staff && !isCronCall) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body: Record<string, unknown> = request.headers.get('content-type')?.includes('json')
    ? await request.json().catch(() => ({}))
    : {}

  const { rule: specificRule, force } = body as { rule?: string; force?: boolean }

  const results = await runAutomationEngine(specificRule, isCronCall || force)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    triggeredBy: staff
      ? `${'full_name' in staff ? (staff as Record<string, string>).full_name : staff.role} (${staff.role})`
      : 'cron',
    results,
  })
}
