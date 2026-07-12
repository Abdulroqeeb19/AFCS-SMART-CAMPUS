import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTaskAssignmentNotification } from '@/lib/notifications'
import type { Json } from '@/lib/database.types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teacher_id = searchParams.get('teacher_id')

  const supabase = createAdminClient()

  // Check if today is a weekend
  const today = new Date().getDay()
  if (today === 0 || today === 6) {
    return NextResponse.json({ next_period: null, message: `School is closed today (${DAY_NAMES[today]})`, day: today })
  }

  const dayOfWeek = today

  // Get current time
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Get current term
  const { data: currentTerm } = await supabase
    .from('academic_terms')
    .select('id, name')
    .eq('is_current', true)
    .single()

  if (!currentTerm) {
    return NextResponse.json({ error: 'No current term set' }, { status: 400 })
  }

  // Get time slots for today to find current and next period
  const { data: todaySlots } = await supabase
    .from('time_slots')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .order('period_number')

  if (!todaySlots?.length) {
    return NextResponse.json({ next_period: null, message: 'No slots defined for today' })
  }

  // Find current period and next period
  let currentPeriod = null
  let nextPeriod = null

  for (let i = 0; i < todaySlots.length; i++) {
    const slot = todaySlots[i]
    if (currentTime >= slot.start_time.slice(0, 5) && currentTime < slot.end_time.slice(0, 5)) {
      currentPeriod = slot
      nextPeriod = todaySlots[i + 1] || null
      break
    }
    if (currentTime < slot.start_time.slice(0, 5)) {
      nextPeriod = slot
      break
    }
  }

  if (!nextPeriod) {
    return NextResponse.json({ next_period: null, message: 'No more periods today' })
  }

  // Get timetable entries for the next period
  let query = supabase
    .from('timetable_entries')
    .select('*, class:class_id(id, name, arm), subject:subject_id(*), teacher:teacher_id(id, staff_id, full_name, phone)')
    .eq('term_id', currentTerm.id)
    .eq('day_of_week', dayOfWeek)
    .eq('period_number', nextPeriod.period_number)

  if (teacher_id) query = query.eq('teacher_id', teacher_id)

  const { data: entries } = await query

  return NextResponse.json({
    day: dayOfWeek,
    current_period: currentPeriod ? { number: currentPeriod.period_number, time: `${currentPeriod.start_time.slice(0,5)}-${currentPeriod.end_time.slice(0,5)}` } : null,
    next_period: {
      number: nextPeriod.period_number,
      time: `${nextPeriod.start_time.slice(0,5)}-${nextPeriod.end_time.slice(0,5)}`,
      is_break: nextPeriod.is_break,
      is_assembly: nextPeriod.is_assembly,
    },
    entries: entries || [],
  })
}

// POST: Send next-period reminders to all teachers with upcoming classes
export async function POST() {
  const supabase = createAdminClient()

  const { data: currentTerm } = await supabase
    .from('academic_terms')
    .select('id')
    .eq('is_current', true)
    .single()

  if (!currentTerm) {
    return NextResponse.json({ error: 'No current term set' }, { status: 400 })
  }

  const today = new Date().getDay()
  if (today === 0 || today === 6) {
    return NextResponse.json({ sent: 0, message: 'Weekend — no periods' })
  }
  const dayOfWeek = today
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Find next period
  const { data: todaySlots } = await supabase
    .from('time_slots')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .order('period_number')

  if (!todaySlots?.length) return NextResponse.json({ sent: 0, message: 'No slots today' })

  let nextPeriod = null
  for (const slot of todaySlots) {
    if (currentTime < slot.start_time.slice(0, 5)) {
      nextPeriod = slot
      break
    }
  }

  if (!nextPeriod || nextPeriod.is_break || nextPeriod.is_assembly) {
    return NextResponse.json({ sent: 0, message: 'No teachable next period' })
  }

  // Get entries for next period
  const { data: entries } = await supabase
    .from('timetable_entries')
    .select('*, class:class_id(id, name, arm), subject:subject_id(name), teacher:teacher_id(id, full_name, phone, telegram_chat_id)')
    .eq('term_id', currentTerm.id)
    .eq('day_of_week', dayOfWeek)
    .eq('period_number', nextPeriod.period_number)

  if (!entries?.length) return NextResponse.json({ sent: 0, message: 'No classes next period' })

  let sent = 0
  for (const entry of entries) {
    if (entry.teacher?.phone) {
      const entryClass = entry.class as { name?: string; arm?: string }
      const result = await sendTaskAssignmentNotification(
        {
          id: entry.teacher_id,
          full_name: entry.teacher.full_name,
          phone: entry.teacher.phone,
          telegram_chat_id: entry.teacher.telegram_chat_id,
        },
        'period_reminder',
        `Upcoming: ${entry.subject?.name} — ${entryClass?.name || ''} ${entryClass?.arm || ''}`,
        new Date().toISOString().split('T')[0],
        null,
        `Your ${entry.subject?.name} class for ${entryClass?.name || ''} ${entryClass?.arm || ''} starts at ${nextPeriod.start_time.slice(0, 5)}. Period ${nextPeriod.period_number}.`,
      )
      if (result.success) sent++

      await supabase.from('notification_logs').insert({
        recipient_id: entry.teacher_id,
        recipient_phone: entry.teacher.phone,
        recipient_name: entry.teacher.full_name,
        channel: 'whatsapp',
        message_type: 'period_reminder',
        message_body: `Reminder: ${entry.subject?.name} — Period ${nextPeriod.period_number} at ${nextPeriod.start_time.slice(0, 5)}`,
        status: result.success ? 'sent' : 'failed',
        provider_response: result as unknown as Json,
        sent_at: new Date().toISOString(),
      }).maybeSingle()
    }
  }

  return NextResponse.json({ sent, total: entries.length, period: nextPeriod.period_number })
}
