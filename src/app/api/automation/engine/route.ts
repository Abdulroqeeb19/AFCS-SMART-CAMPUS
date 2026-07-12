import { NextResponse } from 'next/server'
import { runAutomationEngine } from '@/lib/automation'
import { getAuthStaff } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const staff = await getAuthStaff(supabase, request)

  const isCronCall = !staff && !request.headers.get('x-auth-email')

  if (!isCronCall && staff?.role !== 'admin' && staff?.role !== 'commandant' && staff) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const body: any = request.headers.get('content-type')?.includes('json')
    ? await request.json().catch(() => ({}))
    : {}

  const { rule: specificRule, force } = body as { rule?: string; force?: boolean }

  const results = await runAutomationEngine(specificRule, isCronCall || force)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    triggeredBy: staff ? `${(staff as any).full_name || staff.role} (${staff.role})` : 'cron',
    results,
  })
}
