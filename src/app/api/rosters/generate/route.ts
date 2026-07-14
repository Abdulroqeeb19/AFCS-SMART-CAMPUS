import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'
import { notifyMultipleStaff } from '@/lib/notifications'

const DUTY_DEPARTMENT_MAP: Record<string, string[]> = {
  'Morning Talk': ['Guidance & Counseling', 'English', 'Arts'],
  'Parade Duty': ['Administration', 'Military Training'],
  'Assembly Duty': ['Administration'],
  'Inspection': ['Administration', 'Military Training', 'Mathematics', 'Science'],
  'Sports Duty': ['Science'],
  'Library Duty': ['English', 'Arts', 'ICT'],
  'Dining Hall Duty': [],
  'Guard Duty': ['Military Training'],
}

function matchStaffForDuty(
  dutyName: string,
  staffList: { id: string; role: string; department: { name: string } | null }[]
): string[] {
  const preferred = Object.entries(DUTY_DEPARTMENT_MAP).find(([key]) =>
    dutyName.toLowerCase().includes(key.toLowerCase().replace(' duty', ''))
  )?.[1]

  if (!preferred || preferred.length === 0) {
    return staffList.map((s) => s.id)
  }

  const matched = staffList
    .filter((s) => s.department && preferred.includes(s.department.name))
    .map((s) => s.id)

  if (matched.length === 0) return staffList.map((s) => s.id)
  return matched
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { start_date, end_date } = await request.json()

  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
  }

  const { data: dutyTypes } = await supabase
    .from('duty_types')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  const { data: rawStaff } = await supabase
    .from('staff')
    .select('id, full_name, phone, telegram_chat_id, role, department:department_id(name)')
    .eq('is_active', true)
    .in('role', ['teacher', 'admin', 'support'])

  const activeStaff = (rawStaff || []).map((s) => ({
    id: s.id as string,
    full_name: s.full_name as string,
    phone: s.phone as string | null,
    telegram_chat_id: s.telegram_chat_id as string | null,
    role: s.role as string,
    department: Array.isArray(s.department) ? (s.department[0] || null) : (s.department || null),
  }))

  if (!dutyTypes?.length || !activeStaff?.length) {
    return NextResponse.json({ error: 'No duty types or active staff found' }, { status: 400 })
  }

  const start = new Date(start_date)
  const end = new Date(end_date)
  const assignments: { staff_id: string; duty_type_id: string; date: string; status: string }[] = []
  const staffIndices: Record<string, number> = {}

  for (const duty of dutyTypes) {
    staffIndices[duty.id] = 0
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]

    for (const duty of dutyTypes) {
      const eligibleIds = matchStaffForDuty(duty.name, activeStaff)
      const eligibleStaff = activeStaff.filter((s) => eligibleIds.includes(s.id))

      if (eligibleStaff.length === 0) continue

      const idx = staffIndices[duty.id] % eligibleStaff.length
      const staff = eligibleStaff[idx]
      staffIndices[duty.id]++

      assignments.push({
        staff_id: staff.id,
        duty_type_id: duty.id,
        date: dateStr,
        status: 'pending',
      })
    }
  }

  const { data, error } = await supabase.from('duty_rosters').upsert(assignments, {
    onConflict: 'staff_id, duty_type_id, date',
    ignoreDuplicates: true,
  }).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send WhatsApp notifications to assigned staff
  const assignedIds = [...new Set(assignments.map((a) => a.staff_id))]
  if (assignedIds.length > 0) {
    const dutyName = dutyTypes.length === 1 ? dutyTypes[0].name : 'Duty assignments'
    const dateRange = start_date === end_date ? start_date : `${start_date} to ${end_date}`
    await notifyMultipleStaff(
      assignedIds.map((id) => {
        const s = activeStaff.find((x) => x.id === id)
        return { id: s!.id, full_name: s!.full_name, phone: s!.phone, telegram_chat_id: s!.telegram_chat_id }
      }),
      'duty',
      dutyName,
      dateRange,
      null,
      `You have been assigned duties for ${dateRange}. Please check your tasks on the portal.`,
    )

    // Log notifications
    const logs = assignments.map((a) => {
      const s = activeStaff.find((x) => x.id === a.staff_id)
      return {
        recipient_id: a.staff_id,
        recipient_phone: s?.phone || null,
        recipient_name: s?.full_name || null,
        channel: 'whatsapp',
        message_type: 'duty',
        message_body: `${dutyName} on ${a.date}`,
        status: 'sent' as const,
        sent_at: new Date().toISOString(),
      }
    })
    if (logs.length > 0) {
      await supabase.from('notification_logs').insert(logs)
    }
  }

  return NextResponse.json({
    message: `Generated ${assignments.length} roster entries with department matching`,
    count: assignments.length,
    data,
  })
}
