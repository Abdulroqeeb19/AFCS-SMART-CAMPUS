import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage, sendTelegramKeyboard } from '@/lib/telegram/send'

interface EngineResult {
  rule: string
  executed: boolean
  sent?: number
  error?: string
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function nowISO(): string {
  return new Date().toISOString()
}

function getDay(): number {
  return new Date().getDay() // 0=Sun, 1=Mon...5=Fri, 6=Sat
}

function getHourMin(): { h: number; m: number } {
  const d = new Date()
  return { h: d.getHours(), m: d.getMinutes() }
}

// ── Check if current time falls within a cron-like window ──
function matchesWindow(hour: number, minute: number, toleranceMin = 10): boolean {
  const { h, m } = getHourMin()
  const currentTotal = h * 60 + m
  const targetTotal = hour * 60 + minute
  return Math.abs(currentTotal - targetTotal) <= toleranceMin
}

function isWeekday(): boolean {
  const d = getDay()
  return d >= 1 && d <= 5
}

function isMonOrFri(): boolean {
  const d = getDay()
  return d === 1 || d === 5
}

// ── Log to notification_logs ──
async function logRun(supabase: ReturnType<typeof createAdminClient>, key: string, ok: boolean, detail?: string) {
  await supabase.from('notification_logs').insert({
    channel: 'system',
    message_type: `automation_${key}`,
    message_body: detail || (ok ? `${key} executed successfully` : `${key} skipped: no action needed`),
    status: ok ? 'sent' : 'pending',
    sent_at: ok ? nowISO() : null,
  })
}

async function updateLastRun(supabase: ReturnType<typeof createAdminClient>, key: string) {
  try {
    await supabase.from('notification_rules').update({ last_run_at: nowISO() }).eq('key', key)
  } catch {
    // Column may not exist yet if migration 025 hasn't been applied
  }
}

// ── Helper: get staff by duty type for today ──
async function getStaffByDutyType(supabase: ReturnType<typeof createAdminClient>, dutyTypeName: string) {
  const today = todayStr()
  const { data } = await supabase
    .from('duty_rosters')
    .select('*, staff:staff_id(id, full_name, telegram_chat_id, phone, role), duty_type:duty_type_id(name)')
    .eq('date', today) as any

  if (!data) return []
  const rosters = data.filter((r: any) => {
    const dt = Array.isArray(r.duty_type) ? r.duty_type[0] : r.duty_type
    return dt?.name === dutyTypeName || r.duty_types?.name === dutyTypeName
  })
  return rosters.map((r: any) => {
    const s = Array.isArray(r.staff) ? r.staff[0] : r.staff
    return s
  }).filter(Boolean)
}

// ── Helper: get all admins/commandant ──
async function getAdmins(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from('staff')
    .select('id, full_name, telegram_chat_id, phone, role')
    .eq('is_active', true)
    .in('role', ['admin', 'commandant'])
    .not('telegram_chat_id', 'is', null)

  return data || []
}

// ============================================================
// HANDLERS
// ============================================================

// 1. Duty Roster Notify — notify staff of today's duty assignments
async function handleDutyRosterNotify(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()
  const { data: rosters }: any = await supabase
    .from('duty_rosters')
    .select('*, duty_type:duty_type_id(name, icon), staff:staff_id(id, full_name, telegram_chat_id)')
    .eq('date', today)

  if (!rosters?.length) {
    await logRun(supabase, 'duty_roster_notify', false, 'No duty rosters for today')
    return { rule: 'duty_roster_notify', executed: false }
  }

  let sent = 0
  for (const r of rosters) {
    if (!r.staff?.telegram_chat_id) continue
    const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff
    const dutyType = Array.isArray(r.duty_type) ? r.duty_type[0] : r.duty_type
    const msg =
      `🗓 *Duty Assignment for Today*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${staff.full_name}*,\n\n` +
      `You are assigned to:\n` +
      `📌 *${dutyType?.name || 'Duty'}*\n` +
      `📅 ${today}\n\n` +
      `Please report to your duty post promptly.\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(staff.telegram_chat_id, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'duty_roster_notify', sent > 0, `Notified ${sent} staff of today's duties`)
  return { rule: 'duty_roster_notify', executed: sent > 0, sent }
}

// 2. Check-in Reminder — ping staff who haven't checked in by cutoff
async function handleCheckinReminder(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()

  const { data: settings } = await supabase.from('settings').select('cutoff_hour, cutoff_minute').limit(1).single()
  const cutoffH = settings?.cutoff_hour ?? 8
  const cutoffM = settings?.cutoff_minute ?? 30

  const { data: allStaff } = await supabase
    .from('staff')
    .select('id, full_name, telegram_chat_id, phone')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)

  if (!allStaff?.length) {
    await logRun(supabase, 'checkin_reminder', false, 'No staff with Telegram linked')
    return { rule: 'checkin_reminder', executed: false }
  }

  // Get staff who already checked in today
  const { data: checkedIn } = await supabase
    .from('staff_attendance')
    .select('staff_id')
    .eq('date', today)
    .not('check_in', 'is', null)

  const checkedInIds = new Set((checkedIn || []).map(c => c.staff_id))
  const pending = allStaff.filter(s => !checkedInIds.has(s.id))

  if (!pending.length) {
    await logRun(supabase, 'checkin_reminder', false, 'All staff checked in already')
    return { rule: 'checkin_reminder', executed: false }
  }

  let sent = 0
  for (const s of pending) {
    const msg =
      `⏰ *Check-In Reminder*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${s.full_name}*,\n\n` +
      `You haven't checked in yet today (${today}).\n` +
      `Please check in by ${cutoffH.toString().padStart(2, '0')}:${cutoffM.toString().padStart(2, '0')}.\n\n` +
      `Use the portal or tell the admin to record your attendance.\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(s.telegram_chat_id!, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'checkin_reminder', sent > 0, `Reminded ${sent} staff to check in`)
  return { rule: 'checkin_reminder', executed: sent > 0, sent }
}

// 3. Absentee Alert — alert commandant if student absentee rate > threshold
async function handleAbsenteeAlert(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()
  const threshold = 30 // default 30%

  const { count: totalStudents } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (!totalStudents) {
    await logRun(supabase, 'absentee_alert', false, 'No students found')
    return { rule: 'absentee_alert', executed: false }
  }

  const { count: absentCount } = await supabase
    .from('student_attendance')
    .select('id', { count: 'exact', head: true })
    .eq('date', today)
    .eq('status', 'absent')

  const absenteeRate = totalStudents > 0 ? Math.round(((absentCount ?? 0) / totalStudents) * 100) : 0

  if (absenteeRate < threshold) {
    await logRun(supabase, 'absentee_alert', false, `Absentee rate ${absenteeRate}% below threshold ${threshold}%`)
    return { rule: 'absentee_alert', executed: false }
  }

  const admins = await getAdmins(supabase)
  let sent = 0
  for (const a of admins) {
    const msg =
      `⚠️ *High Absentee Alert*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📅 ${today}\n` +
      `📊 Absentee Rate: *${absenteeRate}%*\n` +
      `👤 Absent: ${absentCount} / ${totalStudents} students\n\n` +
      `Threshold: ${threshold}%\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(a.telegram_chat_id!, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'absentee_alert', sent > 0, `Alerted ${sent} admins of ${absenteeRate}% absentee rate`)
  return { rule: 'absentee_alert', executed: sent > 0, sent }
}

// 4. Next Period Reminder — remind teachers of upcoming class period
async function handleNextPeriodNotify(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const dayOfWeek = getDay()
  if (dayOfWeek < 1 || dayOfWeek > 5) {
    await logRun(supabase, 'next_period_notify', false, 'Weekend — no periods')
    return { rule: 'next_period_notify', executed: false }
  }

  const { h, m } = getHourMin()
  const currentTotal = h * 60 + m

  // Find the next period starting within 10 minutes
  const { data: slots } = await supabase
    .from('time_slots')
    .select('period_number, start_time, end_time, is_break, is_assembly, period_label')
    .eq('day_of_week', dayOfWeek)
    .order('period_number', { ascending: true })

  if (!slots?.length) {
    await logRun(supabase, 'next_period_notify', false, 'No time slots found')
    return { rule: 'next_period_notify', executed: false }
  }

  // Find the current or next non-break, non-assembly period
  const upcoming = slots.find(s => {
    if (s.is_break || s.is_assembly) return false
    const parts = s.start_time.split(':')
    const slotStart = parseInt(parts[0]) * 60 + parseInt(parts[1])
    return slotStart > currentTotal && (slotStart - currentTotal) <= 15
  })

  if (!upcoming) {
    await logRun(supabase, 'next_period_notify', false, 'No upcoming period within window')
    return { rule: 'next_period_notify', executed: false }
  }

  // Get current academic term
  const { data: term } = await supabase
    .from('academic_terms')
    .select('id')
    .eq('is_current', true)
    .limit(1)
    .maybeSingle()

  if (!term) {
    await logRun(supabase, 'next_period_notify', false, 'No active academic term')
    return { rule: 'next_period_notify', executed: false }
  }

  // Get timetable entries for this period + day
  const { data: entries } = await supabase
    .from('timetable_entries')
    .select('*, teacher:teacher_id(id, full_name, telegram_chat_id), subject:subject_id(name, code), class:class_id(name, arm), room:room_id(name)')
    .eq('term_id', term.id)
    .eq('day_of_week', dayOfWeek)
    .eq('period_number', upcoming.period_number)

  if (!entries?.length) {
    await logRun(supabase, 'next_period_notify', false, `No timetable entries for period ${upcoming.period_number}`)
    return { rule: 'next_period_notify', executed: false }
  }

  let sent = 0
  for (const e of entries) {
    const teacher = Array.isArray(e.teacher) ? e.teacher[0] : e.teacher
    if (!teacher?.telegram_chat_id) continue
    const subject = Array.isArray(e.subject) ? e.subject[0] : e.subject
    const cls = Array.isArray(e.class) ? e.class[0] : e.class
    const room = Array.isArray(e.room) ? e.room[0] : e.room

    const msg =
      `🔔 *Next Period Reminder*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${teacher.full_name}*,\n\n` +
      `Your next class starts soon:\n\n` +
      `📚 *${subject?.name || ''}* (${subject?.code || ''})\n` +
      `🏫 ${cls?.name || ''} ${cls?.arm || ''}\n` +
      `🕐 ${upcoming.start_time} — ${upcoming.end_time}\n` +
      `${room ? `📍 ${room.name}\n` : ''}` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(teacher.telegram_chat_id, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'next_period_notify', sent > 0, `Notified ${sent} teachers of period ${upcoming.period_number}`)
  return { rule: 'next_period_notify', executed: sent > 0, sent }
}

// 5. Daily Summary Broadcast — send end-of-day stats to commandant
async function handleDailySummary(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()

  const [
    { count: totalStaff },
    { count: checkedIn },
    { count: presentStudents },
    { count: totalStudents },
    { count: totalTasks },
    { count: completedTasks },
    { count: pendingTasks },
  ] = await Promise.all([
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('staff_attendance').select('id', { count: 'exact', head: true }).eq('date', today).not('check_in', 'is', null),
    supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }),
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).not('status', 'eq', 'completed').not('status', 'eq', 'cancelled'),
  ])

  const attendancePct = (totalStaff ?? 0) > 0 ? Math.round(((checkedIn ?? 0) / (totalStaff ?? 1)) * 100) : 0
  const studentPct = (totalStudents ?? 0) > 0 ? Math.round(((presentStudents ?? 0) / (totalStudents ?? 1)) * 100) : 0

  const admins = await getAdmins(supabase)
  let sent = 0
  for (const a of admins) {
    const msg =
      `📊 *End-of-Day Summary*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📅 ${today}\n\n` +
      `*Staff Attendance:*\n` +
      `✅ ${checkedIn ?? 0}/${totalStaff ?? 0} (${attendancePct}%)\n\n` +
      `*Student Attendance:*\n` +
      `✅ ${presentStudents ?? 0}/${totalStudents ?? 0} (${studentPct}%)\n\n` +
      `*Task Overview:*\n` +
      `📋 Total: ${totalTasks ?? 0}\n` +
      `✅ Completed: ${completedTasks ?? 0}\n` +
      `🔄 Pending: ${pendingTasks ?? 0}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(a.telegram_chat_id!, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'daily_summary_broadcast', sent > 0, `Sent daily summary to ${sent} admins`)
  return { rule: 'daily_summary_broadcast', executed: sent > 0, sent }
}

// 6. Assembly Talk Reminder — Mon & Fri, notify Morning Talk duty staff
async function handleAssemblyTalkReminder(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  if (!isMonOrFri()) {
    await logRun(supabase, 'assembly_talk_reminder', false, 'Not Mon or Fri')
    return { rule: 'assembly_talk_reminder', executed: false }
  }

  const staffList = await getStaffByDutyType(supabase, 'Morning Talk')
  if (!staffList.length) {
    await logRun(supabase, 'assembly_talk_reminder', false, 'No staff assigned to Morning Talk today')
    return { rule: 'assembly_talk_reminder', executed: false }
  }

  const dayLabel = getDay() === 1 ? 'Monday' : 'Friday'
  let sent = 0
  for (const s of staffList) {
    if (!s.telegram_chat_id) continue
    const msg =
      `🎤 *Assembly Talk Reminder*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${s.full_name}*,\n\n` +
      `You are assigned to deliver the *Morning Talk* at today's assembly (${dayLabel}).\n\n` +
      `📌 *Topic:* Prepare a short motivational/educational talk for the students.\n` +
      `🕐 Time: 7:30 AM — Assembly\n` +
      `📍 Venue: Assembly Ground\n\n` +
      `Please be prepared and deliver promptly.\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(s.telegram_chat_id, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'assembly_talk_reminder', sent > 0, `Notified ${sent} staff of morning talk duty`)
  return { rule: 'assembly_talk_reminder', executed: sent > 0, sent }
}

// 7. Assembly Discussion Reminder — Mon & Fri, student discussion session
async function handleAssemblyDiscussionReminder(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  if (!isMonOrFri()) {
    await logRun(supabase, 'assembly_discussion_reminder', false, 'Not Mon or Fri')
    return { rule: 'assembly_discussion_reminder', executed: false }
  }

  // Find staff assigned to Assembly Duty
  const staffList = await getStaffByDutyType(supabase, 'Assembly Duty')
  if (!staffList.length) {
    await logRun(supabase, 'assembly_discussion_reminder', false, 'No staff assigned to Assembly Duty today')
    return { rule: 'assembly_discussion_reminder', executed: false }
  }

  const dayLabel = getDay() === 1 ? 'Monday' : 'Friday'
  let sent = 0
  for (const s of staffList) {
    if (!s.telegram_chat_id) continue
    const msg =
      `💬 *Student Discussion Session*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${s.full_name}*,\n\n` +
      `You are assigned to lead the *Student Discussion Session* today (${dayLabel}) after assembly.\n\n` +
      `📌 Engage students in discussion on current affairs, values, or academic topics.\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(s.telegram_chat_id, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'assembly_discussion_reminder', sent > 0, `Notified ${sent} staff of discussion session`)
  return { rule: 'assembly_discussion_reminder', executed: sent > 0, sent }
}

// 8. Daily Report Reminder — remind Inspection/Report Duty staff to submit report
async function handleDailyReportReminder(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const staffList = await getStaffByDutyType(supabase, 'Inspection/Report Duty')
  if (!staffList.length) {
    await logRun(supabase, 'daily_report_reminder', false, 'No staff assigned to Inspection/Report Duty today')
    return { rule: 'daily_report_reminder', executed: false }
  }

  const today = todayStr()
  let sent = 0
  for (const s of staffList) {
    if (!s.telegram_chat_id) continue

    // Check if they already submitted a report
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('staff_id', s.id)
      .eq('date', today)
      .limit(1)
      .maybeSingle()

    if (existing) continue // Already submitted

    const msg =
      `📝 *Daily Report Reminder*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `Hello *${s.full_name}*,\n\n` +
      `You are the *Inspection/Report Duty* officer today (${today}).\n\n` +
      `Please submit your daily report of school activities via the portal:\n` +
      `🔗 https://afcs-smart-campus.vercel.app/reports\n\n` +
      `Include:\n` +
      `✅ Activities done today\n` +
      `⚠️ Challenges encountered\n` +
      `📌 Any other notes\n` +
      `━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_`

    const result = await sendTelegramMessage(s.telegram_chat_id, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'daily_report_reminder', sent > 0, `Reminded ${sent} staff to submit daily report`)
  return { rule: 'daily_report_reminder', executed: sent > 0, sent }
}

// 9. Duty Auto-Assign — rotate duty assignments automatically
async function handleDutyAutoAssign(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()

  if (!isWeekday()) {
    await logRun(supabase, 'duty_auto_assign', false, 'Weekend — no duty assignment')
    return { rule: 'duty_auto_assign', executed: false }
  }

  // Check if today's rosters already exist
  const { count: existing } = await supabase
    .from('duty_rosters')
    .select('id', { count: 'exact', head: true })
    .eq('date', today)

  if (existing && existing > 0) {
    await logRun(supabase, 'duty_auto_assign', false, `Rosters already exist for ${today}`)
    return { rule: 'duty_auto_assign', executed: false }
  }

  // Get all active duty types
  const { data: dutyTypes } = await supabase
    .from('duty_types')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (!dutyTypes?.length) {
    await logRun(supabase, 'duty_auto_assign', false, 'No duty types found')
    return { rule: 'duty_auto_assign', executed: false }
  }

  // Get all active staff with Telegram
  const { data: allStaff } = await supabase
    .from('staff')
    .select('id, full_name, telegram_chat_id')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)

  if (!allStaff?.length) {
    await logRun(supabase, 'duty_auto_assign', false, 'No active staff with Telegram')
    return { rule: 'duty_auto_assign', executed: false }
  }

  // Get last assignments to rotate fairly
  const { data: lastAssignments } = await supabase
    .from('duty_rosters')
    .select('staff_id, duty_type_id, date')
    .order('date', { ascending: false })
    .limit(200)

  // Build a map of duty_type -> last assigned staff_id date
  const lastAssigned = new Map<string, { staff_id: string; date: string }>()
  for (const a of lastAssignments || []) {
    const key = `${a.duty_type_id}:${a.staff_id}`
    if (!lastAssigned.has(key) || a.date > lastAssigned.get(key)!.date) {
      lastAssigned.set(key, a)
    }
  }

  // For each duty type, pick the staff who was assigned longest ago
  let assigned = 0
  for (const dt of dutyTypes) {
    // Sort staff by last assignment date for this duty type
    const sorted = [...allStaff].sort((a, b) => {
      const aLast = lastAssigned.get(`${dt.id}:${a.id}`)?.date || '1970-01-01'
      const bLast = lastAssigned.get(`${dt.id}:${b.id}`)?.date || '1970-01-01'
      return aLast.localeCompare(bLast)
    })

    const chosen = sorted[0]
    if (!chosen) continue

    const { error } = await supabase.from('duty_rosters').insert({
      staff_id: chosen.id,
      duty_type_id: dt.id,
      date: today,
      status: 'pending',
    })

    if (!error) assigned++
  }

  await logRun(supabase, 'duty_auto_assign', assigned > 0, `Auto-assigned ${assigned} duty rosters for ${today}`)
  return { rule: 'duty_auto_assign', executed: assigned > 0, sent: assigned }
}

// 10. Parade Auto-Close — auto-complete parade sessions past end time
async function handleParadeAutoClose(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()

  const { data: openParades } = await supabase
    .from('parade_sessions')
    .select('id, date, type')
    .eq('date', today)
    .in('status', ['scheduled', 'active'])

  if (!openParades?.length) {
    await logRun(supabase, 'parade_auto_close', false, 'No open parades to close')
    return { rule: 'parade_auto_close', executed: false }
  }

  let closed = 0
  for (const p of openParades) {
    await supabase
      .from('parade_sessions')
      .update({ status: 'completed', end_time: nowISO() })
      .eq('id', p.id)
    closed++
  }

  await logRun(supabase, 'parade_auto_close', closed > 0, `Auto-closed ${closed} parade(s)`)
  return { rule: 'parade_auto_close', executed: closed > 0, sent: closed }
}

// 11. Scheduled Broadcast Processor — send due broadcasts
async function handleScheduledBroadcastProcessor(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  let due: any[]
  try {
    const { data } = await supabase
      .from('scheduled_broadcasts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', nowISO())
      .limit(20) as any
    due = data || []
  } catch {
    // scheduled_broadcasts table may not exist yet (pre-migration-025)
    return { rule: 'scheduled_broadcast_processor', executed: false }
  }

  if (!due.length) {
    return { rule: 'scheduled_broadcast_processor', executed: false }
  }

  let sent = 0
  for (const b of due) {
    let q = supabase.from('staff').select('telegram_chat_id, full_name').eq('is_active', true).not('telegram_chat_id', 'is', null)
    if (b.target_roles?.length) q = q.in('role', b.target_roles)

    const { data: recipients } = await q as any
    if (!recipients?.length) {
      await supabase.from('scheduled_broadcasts').update({ status: 'sent', sent_at: nowISO() }).eq('id', b.id) as any
      continue
    }

    for (const r of recipients) {
      const msg =
        `📢 *${b.title || 'Broadcast'}*\n` +
        `━━━━━━━━━━━━━━━\n` +
        `${b.content}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `_AFCS Smart Campus_`

      const result = await sendTelegramMessage(r.telegram_chat_id!, msg)
      if (result.success) sent++
    }

    await supabase.from('scheduled_broadcasts').update({ status: 'sent', sent_at: nowISO() }).eq('id', b.id) as any
  }

  if (sent > 0) {
    await logRun(supabase, 'scheduled_broadcast_processor', true, `Sent ${sent} scheduled broadcast messages`)
  }
  return { rule: 'scheduled_broadcast_processor', executed: sent > 0, sent }
}

// 12. End-of-Day Digest — comprehensive stats to commandant
async function handleEndOfDayDigest(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()

  const [
    { count: totalStaff },
    { count: checkedIn },
    { count: lateCheckIn },
    { count: presentStudents },
    { count: totalStudents },
    { count: submittedReports },
    { data: dutyRosters },
    { count: totalTasks },
    { count: completedTasks },
    { count: highPriorityTasks },
    { count: absentStudents },
  ] = await Promise.all([
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('staff_attendance').select('id', { count: 'exact', head: true }).eq('date', today).not('check_in', 'is', null),
    supabase.from('staff_attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'late'),
    supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('daily_reports').select('id', { count: 'exact', head: true }).eq('date', today),
    supabase.from('duty_rosters').select('*, staff:staff_id(full_name), duty_type:duty_type_id(name)').eq('date', today),
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }),
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).eq('priority', 'high').neq('status', 'completed').neq('status', 'cancelled'),
    supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'absent'),
  ])

  // Build duty roster summary
  const dutySummary = (dutyRosters || []).slice(0, 10).map((r: any) => {
    const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff
    const dt = Array.isArray(r.duty_type) ? r.duty_type[0] : r.duty_type
    return `${dt?.name || 'Duty'} → ${staff?.full_name || 'Unassigned'}`
  }).join('\n')

  const staffPct = (totalStaff ?? 0) > 0 ? Math.round(((checkedIn ?? 0) / (totalStaff ?? 1)) * 100) : 0
  const studentPct = (totalStudents ?? 0) > 0 ? Math.round(((presentStudents ?? 0) / (totalStudents ?? 1)) * 100) : 0

  const admins = await getAdmins(supabase)
  let sent = 0
  for (const a of admins) {
    const msg =
      `📋 *Comprehensive Daily Digest*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📅 ${today}\n\n` +
      `*👥 Staff Attendance*\n` +
      `✅ Present: ${checkedIn}/${totalStaff} (${staffPct}%)\n` +
      `⚠️ Late: ${lateCheckIn ?? 0}\n\n` +
      `*🎓 Student Attendance*\n` +
      `✅ Present: ${presentStudents}/${totalStudents} (${studentPct}%)\n` +
      `❌ Absent: ${absentStudents ?? 0}\n\n` +
      `*📋 Duty Rosters*\n` +
      `${dutySummary || 'No duties assigned'}\n\n` +
      `*📝 Reports*\n` +
      `📄 Daily reports submitted: ${submittedReports ?? 0}\n\n` +
      `*📌 Tasks*\n` +
      `📋 Total: ${totalTasks ?? 0}\n` +
      `✅ Completed: ${completedTasks ?? 0}\n` +
      `🔴 High Priority Pending: ${highPriorityTasks ?? 0}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🔗 Portal: https://afcs-smart-campus.vercel.app\n` +
      `_Air Force Comprehensive School, Igbara-Oke_`

    const result = await sendTelegramMessage(a.telegram_chat_id!, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'end_of_day_digest', sent > 0, `Sent digest to ${sent} admins`)
  return { rule: 'end_of_day_digest', executed: sent > 0, sent }
}

// 13. Commandant's Daily To-Do — morning briefing pushed to commandant's Telegram
async function handleCommandantTodo(supabase: ReturnType<typeof createAdminClient>): Promise<EngineResult> {
  const today = todayStr()

  // Find commandants with Telegram linked
  const { data: commandants } = await supabase
    .from('staff')
    .select('id, full_name, telegram_chat_id')
    .eq('role', 'commandant')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)

  if (!commandants?.length) {
    await logRun(supabase, 'commandant_todo', false, 'No commandant with Telegram linked')
    return { rule: 'commandant_todo', executed: false }
  }

  // Gather all data in parallel
  const [
    { data: taskData },
    { data: dutyData },
    { count: staffCheckedIn },
    { count: totalStaff },
    { count: presentStudents },
    { count: totalStudents },
    { count: absentStudents },
    { data: parades },
    { count: highPriorityTasks },
  ] = await Promise.all([
    // Tasks assigned to commandant (open + created today)
    supabase.from('parade_tasks').select('id, description, parade_id, status, priority, assigned_to')
      .or(`assigned_to.in.(${commandants.map(c => c.id).join(',')}),and(assigned_to.is.null,created_at.gte.${today}T00:00:00)`)
      .neq('status', 'completed').neq('status', 'cancelled').order('priority', { ascending: false }).limit(15) as any,

    // Today's duty rosters
    supabase.from('duty_rosters')
      .select('*, staff:staff_id(full_name), duty_type:duty_type_id(name)')
      .eq('date', today) as any,

    // Staff attendance
    supabase.from('staff_attendance').select('id', { count: 'exact', head: true }).eq('date', today).not('check_in', 'is', null),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'absent'),
    supabase.from('parade_sessions').select('id, type, status, start_time').eq('date', today).in('status', ['scheduled', 'active']) as any,
    supabase.from('parade_tasks').select('id', { count: 'exact', head: true }).eq('priority', 'high').neq('status', 'completed').neq('status', 'cancelled'),
  ])

  const tasks = (taskData || []).slice(0, 8)
  const duties = (dutyData || []).slice(0, 10)
  const paradeList = (parades || [])

  // Format duty summary
  const dutySummary = duties.map((r: any) => {
    const staff = Array.isArray(r.staff) ? r.staff[0] : r.staff
    const dt = Array.isArray(r.duty_type) ? r.duty_type[0] : r.duty_type
    const statusIcon = r.status === 'completed' ? '✅' : r.status === 'active' ? '🔄' : '⏳'
    return `${statusIcon} ${dt?.name || 'Duty'} → ${staff?.full_name || 'Unassigned'}`
  }).join('\n')

  // Format task summary
  const taskSummary = tasks.map((t: any) => {
    const icon = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🔵'
    const statusTag = t.status === 'in_progress' ? ' *(in progress)*' : ''
    return `${icon} ${t.description?.substring(0, 60)}${t.description?.length > 60 ? '…' : ''}${statusTag}`
  }).join('\n')

  // Format parade summary
  const paradeSummary = paradeList.map((p: any) => {
    const icon = p.type === 'morning' ? '🌅' : p.type === 'evening' ? '🌇' : '📋'
    return `${icon} ${p.type} parade — ${p.status}${p.start_time ? ` (${p.start_time.substring(0, 5)})` : ''}`
  }).join('\n')

  const staffPct = (totalStaff ?? 0) > 0 ? Math.round(((staffCheckedIn ?? 0) / (totalStaff ?? 1)) * 100) : 0
  const studentPct = (totalStudents ?? 0) > 0 ? Math.round(((presentStudents ?? 0) / (totalStudents ?? 1)) * 100) : 0

  let sent = 0
  for (const cmd of commandants) {
    const msg =
      `☀️ *Good Morning, ${cmd.full_name.split(' ').pop()}!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Today's Brief — ${today}*\n\n` +
      (taskSummary
        ? `📋 *Pending Tasks (${tasks.length})*\n${taskSummary}\n\n`
        : `📋 *No pending tasks*\n\n`) +
      `*👥 Staff Attendance*\n` +
      `${staffCheckedIn ?? 0}/${totalStaff ?? 0} checked in (${staffPct}%)\n\n` +
      `*🎓 Student Attendance*\n` +
      `Present: ${presentStudents ?? 0}\n` +
      `Absent: ${absentStudents ?? 0}\n` +
      `Rate: ${studentPct}% present\n\n` +
      (dutySummary
        ? `*📋 Today's Duties*\n${dutySummary}\n\n`
        : ``) +
      (paradeSummary
        ? `*🏛 Parades Today*\n${paradeSummary}\n\n`
        : ``) +
      (highPriorityTasks && highPriorityTasks > 0
        ? `⚠️ *${highPriorityTasks} high-priority task${highPriorityTasks > 1 ? 's' : ''}* need attention!\n\n`
        : ``) +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_AFCS Smart Campus_\n` +
      `🔗 Portal: https://afcs-smart-campus.vercel.app`

    const result = await sendTelegramMessage(cmd.telegram_chat_id!, msg)
    if (result.success) sent++
  }

  await logRun(supabase, 'commandant_todo', sent > 0, `Sent daily briefing to ${sent} commandant(s)`)
  return { rule: 'commandant_todo', executed: sent > 0, sent }
}

// ============================================================
// ENGINE
// ============================================================

type RuleConfig = {
  key: string
  config: Record<string, any>
  cron_schedule: string | null
}

// Map of cron_schedule patterns to handler time checks
const SCHEDULE_MAP: Record<string, { hour: number; minute: number; days?: number[] }[]> = {
  'duty_roster_notify': [{ hour: 6, minute: 30 }],
  'checkin_reminder': [{ hour: 8, minute: 30 }],
  'absentee_alert': [{ hour: 10, minute: 0 }],
  'next_period_notify': [{ hour: 7, minute: 55 }, { hour: 8, minute: 35 }, { hour: 9, minute: 25 }, { hour: 9, minute: 55 }, { hour: 10, minute: 35 }, { hour: 11, minute: 0 }, { hour: 11, minute: 35 }, { hour: 12, minute: 15 }, { hour: 13, minute: 0 }, { hour: 13, minute: 35 }],
  'daily_summary_broadcast': [{ hour: 14, minute: 0 }],
  'assembly_talk_reminder': [{ hour: 7, minute: 0, days: [1, 5] }],
  'assembly_discussion_reminder': [{ hour: 8, minute: 0, days: [1, 5] }],
  'daily_report_reminder': [{ hour: 12, minute: 0 }],
  'duty_auto_assign': [{ hour: 6, minute: 0 }],
  'parade_auto_close': [{ hour: 14, minute: 30 }],
  'scheduled_broadcast_processor': [],
  'end_of_day_digest': [{ hour: 15, minute: 0 }],
  'commandant_todo': [{ hour: 6, minute: 30, days: [1, 2, 3, 4, 5] }],
}

const HANDLERS: Record<string, (supabase: ReturnType<typeof createAdminClient>) => Promise<EngineResult>> = {
  duty_roster_notify: handleDutyRosterNotify,
  checkin_reminder: handleCheckinReminder,
  absentee_alert: handleAbsenteeAlert,
  next_period_notify: handleNextPeriodNotify,
  daily_summary_broadcast: handleDailySummary,
  assembly_talk_reminder: handleAssemblyTalkReminder,
  assembly_discussion_reminder: handleAssemblyDiscussionReminder,
  daily_report_reminder: handleDailyReportReminder,
  duty_auto_assign: handleDutyAutoAssign,
  parade_auto_close: handleParadeAutoClose,
  scheduled_broadcast_processor: handleScheduledBroadcastProcessor,
  end_of_day_digest: handleEndOfDayDigest,
  commandant_todo: handleCommandantTodo,
}

// Rules that should always run (not time-dependent)
const ALWAYS_RUN = ['scheduled_broadcast_processor']

function isDue(key: string, config: RuleConfig): boolean {
  if (ALWAYS_RUN.includes(key)) return true

  const schedule = SCHEDULE_MAP[key]
  if (!schedule?.length) return false

  // Check if any schedule entry matches
  return schedule.some(s => {
    const { hour, minute, days } = s

    // Check day constraint
    if (days && !days.includes(getDay())) return false

    // Check time window
    return matchesWindow(hour, minute)
  })
}

export async function runAutomationEngine(specificRule?: string, force?: boolean): Promise<EngineResult[]> {
  const supabase = createAdminClient()
  const results: EngineResult[] = []

  const query = supabase
    .from('notification_rules')
    .select('key, is_active, config')
    .eq('is_active', true) as any

  if (specificRule) (query as any).eq('key', specificRule)

  const { data: activeRules } = await query as any

  if (!activeRules?.length) {
    return [{ rule: 'engine', executed: false, error: 'No active rules' }]
  }

  // Try to fetch last_run_at separately (column may not exist pre-migration-025)
  let lastRunMap: Record<string, string> = {}
  try {
    const { data: lastRunData } = await supabase
      .from('notification_rules')
      .select('key, last_run_at')
      .in('key', activeRules.map((r: any) => r.key)) as any
    if (lastRunData) {
      lastRunMap = Object.fromEntries(lastRunData.map((r: any) => [r.key, r.last_run_at]))
    }
  } catch {
    // last_run_at column doesn't exist yet — skip cooldown checks
  }

  for (const rule of activeRules) {
    const handler = HANDLERS[rule.key]
    if (!handler) {
      results.push({ rule: rule.key, executed: false, error: 'No handler registered' })
      continue
    }

    const config: RuleConfig = { key: rule.key, config: (rule.config as Record<string, any>) || {}, cron_schedule: null }

    // Check if due (unless specific rule requested or force mode)
    if (!specificRule && !force && !isDue(rule.key, config)) {
      results.push({ rule: rule.key, executed: false, error: 'Not yet due' })
      continue
    }

    // Check last_run_at to prevent duplicate runs within the same window
    if (!specificRule && lastRunMap[rule.key]) {
      const lastRun = new Date(lastRunMap[rule.key]).getTime()
      const now = Date.now()
      const minutesSinceLastRun = (now - lastRun) / (1000 * 60)
      if (minutesSinceLastRun < 30 && !ALWAYS_RUN.includes(rule.key)) {
        results.push({ rule: rule.key, executed: false, error: `Last run ${Math.round(minutesSinceLastRun)}m ago (min 30m interval)` })
        continue
      }
    }

    try {
      const result = await handler(supabase)
      await updateLastRun(supabase, rule.key)
      results.push(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      results.push({ rule: rule.key, executed: false, error: msg })
      await logRun(supabase, rule.key, false, `Error: ${msg}`)
    }
  }

  return results
}
