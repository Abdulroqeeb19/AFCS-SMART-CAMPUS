import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

function getWeekDates(): { monday: string; friday: string; dates: string[] } {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  const dates: string[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return { monday: dates[0], friday: dates[4], dates }
}

export async function GET() {
  const adminSupabase = createAdminClient()
  const { dates } = getWeekDates()

  const { data: dutyType } = await adminSupabase
    .from('duty_types')
    .select('id, name')
    .ilike('name', '%Inspection%')
    .single()

  if (!dutyType) {
    return NextResponse.json({
      week: dates,
      today: null,
      schedule: [],
      message: 'No duty type found. Run seed data first.',
    })
  }

  const { data: rosters } = await adminSupabase
    .from('duty_rosters')
    .select('*, staff:staff_id(id, staff_id, full_name), duty_type:duty_type_id(id, name)')
    .eq('duty_type_id', dutyType.id)
    .in('date', dates)
    .order('date')

  const schedule = dates.map((date) => {
    const entry = (rosters || []).find((r) => r.date === date)
    return { date, staff: entry?.staff || null, status: entry?.status || 'unassigned' }
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const today = schedule.find((s) => s.date === todayStr) || null

  return NextResponse.json({ week: dates, today, schedule, duty_type: dutyType })
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { dates } = getWeekDates()

  const { data: dutyType } = await supabase
    .from('duty_types')
    .select('id, name')
    .ilike('name', '%Inspection%')
    .single()

  if (!dutyType) {
    return NextResponse.json({ error: 'Inspection/Report Duty type not found. Run seed data first.' }, { status: 400 })
  }

  const { data: allStaff } = await supabase
    .from('staff')
    .select('id, staff_id, full_name, email, phone, telegram_chat_id')
    .eq('is_active', true)
    .in('role', ['teacher', 'admin', 'support'])
    .order('staff_id')
    .order('full_name')

  if (!allStaff?.length) {
    return NextResponse.json({ error: 'No active staff found' }, { status: 400 })
  }

  // Find last assigned staff index from the most recent roster entry
  const { data: lastRoster } = await supabase
    .from('duty_rosters')
    .select('staff_id')
    .eq('duty_type_id', dutyType.id)
    .order('date', { ascending: false })
    .limit(1)

  let startIndex = 0
  if (lastRoster?.length) {
    const lastStaffIdx = allStaff.findIndex((s) => s.id === lastRoster[0].staff_id)
    if (lastStaffIdx >= 0) startIndex = (lastStaffIdx + 1) % allStaff.length
  }

  // Remove existing assignments for this week
  await supabase
    .from('duty_rosters')
    .delete()
    .eq('duty_type_id', dutyType.id)
    .in('date', dates)

  // Assign one staff per weekday (Mon-Fri)
  const assignments: { staff_id: string; duty_type_id: string; date: string; status: string }[] = []
  const notifiedStaff: { id: string; full_name: string; phone: string | null; telegram_chat_id: string | null }[] = []

  for (let i = 0; i < dates.length; i++) {
    const staffIdx = (startIndex + i) % allStaff.length
    const staff = allStaff[staffIdx]
    assignments.push({
      staff_id: staff.id,
      duty_type_id: dutyType.id,
      date: dates[i],
      status: 'pending',
    })
    if (!notifiedStaff.find((ns) => ns.id === staff.id)) {
      notifiedStaff.push({
        id: staff.id,
        full_name: staff.full_name,
        phone: staff.phone,
        telegram_chat_id: staff.telegram_chat_id,
      })
    }
  }

  const { error } = await supabase.from('duty_rosters').insert(assignments)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send notifications
  const { notifyMultipleStaff } = await import('@/lib/notifications')
  if (notifiedStaff.length > 0) {
    await notifyMultipleStaff(
      notifiedStaff,
      'duty',
      'Daily Report Duty',
      `${dates[0]} to ${dates[4]}`,
      null,
      `You have been assigned for Daily Report Duty this week (${dates[0]} to ${dates[4]}). Please submit your end-of-day report via the Daily Report page.`,
    )

    const logs = assignments.map((a) => {
      const s = allStaff.find((x) => x.id === a.staff_id)
      return {
        recipient_id: a.staff_id,
        recipient_phone: s?.phone || null,
        recipient_name: s?.full_name || null,
        channel: 'whatsapp',
        message_type: 'duty',
        message_body: `Daily Report Duty assigned on ${a.date}`,
        status: 'sent' as const,
        sent_at: new Date().toISOString(),
      }
    })
    if (logs.length > 0) {
      await supabase.from('notification_logs').insert(logs)
    }
  }

  return NextResponse.json({
    message: `Assigned ${assignments.length} staff for Daily Report Duty this week`,
    assignments,
  })
}
