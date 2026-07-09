import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

interface Slot {
  id: string
  day_of_week: number
  period_number: number
  is_break: boolean
  is_assembly: boolean
  period_label: string | null
}

interface TeacherForSubject {
  teacher_id: string
  max_periods_per_day: number
}

interface SubjectReq {
  subject_id: string
  subject_name: string
  subject_code: string
  periods_per_week: number
  difficulty_tier: number
  needs_double_period: boolean
  teachers: TeacherForSubject[]
}

interface ClassReq {
  class_id: string
  class_name: string
  subjects: SubjectReq[]
}

interface Assignment {
  class_id: string
  subject_id: string
  teacher_id: string
  day_of_week: number
  period_number: number
  room_id: string | null
}

interface QualityReport {
  name: string
  score: number
  max: number
  details: string
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function slotKey(day: number, period: number) { return `${day}-${period}` }

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const { term_id } = await request.json()
  if (!term_id) {
    return NextResponse.json({ error: 'term_id required' }, { status: 400 })
  }

  const { data: term } = await supabase.from('academic_terms').select('*').eq('id', term_id).single()
  if (!term) return NextResponse.json({ error: 'Term not found' }, { status: 404 })

  const [{ data: classes }, { data: classSubjects }, { data: subjects }, { data: teacherSubjects }, { data: slots }, { data: rooms }, { data: staff }] = await Promise.all([
    supabase.from('classes').select('*').order('name').order('arm'),
    supabase.from('class_subjects').select('*'),
    supabase.from('subjects').select('*').eq('is_active', true),
    supabase.from('teacher_subjects').select('*'),
    supabase.from('time_slots').select('*').order('day_of_week').order('period_number'),
    supabase.from('rooms').select('*').eq('is_active', true),
    supabase.from('staff').select('id, full_name').eq('is_active', true),
  ])

  if (!classes?.length) return NextResponse.json({ error: 'No classes found' }, { status: 400 })
  if (!slots?.length) return NextResponse.json({ error: 'No time slots defined' }, { status: 400 })

  const usableSlots: Slot[] = (slots || []).filter((s) => !s.is_break && !s.is_assembly)

  // Group teaching slots by period_number for double-period detection
  const slotsByPeriod = new Map<number, Slot[]>()
  for (const slot of usableSlots) {
    if (!slotsByPeriod.has(slot.period_number)) slotsByPeriod.set(slot.period_number, [])
    slotsByPeriod.get(slot.period_number)!.push(slot)
  }

  // Round-robin room index for fair distribution
  let roomIndex = 0
  function pickRoom(): string | null {
    if (!rooms?.length) return null
    const room = rooms[roomIndex % rooms.length]
    roomIndex++
    return room.id
  }

  // --------
  // Build class requirements
  // --------
  const classReqs: ClassReq[] = []
  const teacherMap = new Map(staff?.map((s) => [s.id, s.full_name]) || [])
  const diagnostics: { class_name: string; subject_name?: string; reason: string }[] = []

  for (const cls of classes) {
    const cs = (classSubjects || []).filter((c) => c.class_id === cls.id)
    if (cs.length === 0) {
      diagnostics.push({ class_name: `${cls.name} ${cls.arm}`, reason: 'No subjects assigned in Setup > Classes tab' })
      continue
    }

    const subjectsList: SubjectReq[] = []
    for (const csItem of cs) {
      const sub = (subjects || []).find((s) => s.id === csItem.subject_id)
      if (!sub) {
        diagnostics.push({ class_name: `${cls.name} ${cls.arm}`, subject_name: `subject_id=${csItem.subject_id}`, reason: 'Subject record not found or inactive' })
        continue
      }

      const ts = (teacherSubjects || []).filter((t) => t.subject_id === sub.id)
      if (ts.length === 0) {
        diagnostics.push({ class_name: `${cls.name} ${cls.arm}`, subject_name: sub.name, reason: 'No teacher assigned to this subject in Setup > Teacher Assignments' })
        continue
      }

      subjectsList.push({
        subject_id: sub.id,
        subject_name: sub.name,
        subject_code: sub.code,
        periods_per_week: csItem.periods_per_week || sub.periods_per_week,
        difficulty_tier: sub.difficulty_tier,
        needs_double_period: sub.needs_double_period,
        teachers: ts.map((t) => ({ teacher_id: t.teacher_id, max_periods_per_day: t.max_periods_per_day })),
      })
    }

    if (subjectsList.length === 0) {
      diagnostics.push({ class_name: `${cls.name} ${cls.arm}`, reason: 'All subjects for this class were skipped (check subject/teacher setup)' })
      continue
    }

    subjectsList.sort((a, b) => a.teachers.length - b.teachers.length)
    classReqs.push({
      class_id: cls.id,
      class_name: `${cls.name} ${cls.arm}`,
      subjects: subjectsList,
    })
  }

  classReqs.sort((a, b) => b.subjects.length - a.subjects.length)

  if (classReqs.length === 0) {
    return NextResponse.json({
      error: 'No classes could be processed',
      diagnostics: diagnostics.slice(0, 50),
      hints: [
        'Go to Setup > Subjects and add subjects',
        'Go to Setup > Teacher Assignments and assign teachers to each subject',
        'Go to Setup > Classes and assign subjects to each class',
      ],
    }, { status: 400 })
  }

  // --------
  // Tracking structures
  // --------
  const teacherSlots = new Map<string, Set<string>>()
  const classSlots = new Map<string, Set<string>>()
  const roomSlots = new Map<string, Set<string>>()
  const teacherDailyCount = new Map<string, Map<number, number>>()
  const assignments: Assignment[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conflicts: any[] = []

  function isSlotAvailable(teacherId: string, classId: string, day: number, period: number, roomId: string | null): boolean {
    const key = slotKey(day, period)
    if (teacherSlots.get(teacherId)?.has(key)) return false
    if (classSlots.get(classId)?.has(key)) return false
    if (roomId && roomSlots.get(roomId)?.has(key)) return false
    return true
  }

  function assignSlot(teacherId: string, classId: string, day: number, period: number, roomId: string | null) {
    const key = slotKey(day, period)
    if (!teacherSlots.has(teacherId)) teacherSlots.set(teacherId, new Set())
    teacherSlots.get(teacherId)!.add(key)
    if (!classSlots.has(classId)) classSlots.set(classId, new Set())
    classSlots.get(classId)!.add(key)
    if (roomId) {
      if (!roomSlots.has(roomId)) roomSlots.set(roomId, new Set())
      roomSlots.get(roomId)!.add(key)
    }
    if (!teacherDailyCount.has(teacherId)) teacherDailyCount.set(teacherId, new Map())
    const dayCount = teacherDailyCount.get(teacherId)!
    dayCount.set(day, (dayCount.get(day) || 0) + 1)
  }

  function isDoubleSlotAvailable(teacherId: string, classId: string, day: number, startPeriod: number, roomId: string | null): boolean {
    return isSlotAvailable(teacherId, classId, day, startPeriod, roomId) &&
           isSlotAvailable(teacherId, classId, day, startPeriod + 1, roomId)
  }

  function assignDoubleSlot(teacherId: string, classId: string, day: number, startPeriod: number, roomId: string | null) {
    assignSlot(teacherId, classId, day, startPeriod, roomId)
    assignSlot(teacherId, classId, day, startPeriod + 1, roomId)
  }

  // --------
  // Morning vs afternoon periods
  // --------
  const morningPeriods = [2, 3, 5, 6, 7, 8] // Periods before Long Break (P10)


  function getPeriodScore(periodNum: number, difficultyTier: number): number {
    // Higher = better match. Hard subjects (tier 1) get morning bonus.
    if (morningPeriods.includes(periodNum)) {
      return 10 - difficultyTier + 5 // morning bonus
    }
    return 10 - difficultyTier + (difficultyTier >= 4 ? 3 : 0) // easy subjects can go afternoon
  }

  // --------
  // Main generation loop
  // --------
  let totalNeeded = 0
  let totalAssigned = 0

  for (const cls of classReqs) {
    for (const subj of cls.subjects) {
      const periodsNeeded = subj.periods_per_week
      totalNeeded += periodsNeeded
      let assigned = 0

      const shuffledTeachers = shuffleArray(subj.teachers)
      let teacherIdx = 0

      // Build ordered slot list with difficulty-based weighting
      const orderedSlots = shuffleArray(usableSlots).sort((a, b) => {
        const scoreA = getPeriodScore(a.period_number, subj.difficulty_tier)
        const scoreB = getPeriodScore(b.period_number, subj.difficulty_tier)
        return scoreB - scoreA
      })

      // Track what days we've already used for distribution
      const usedDays = new Set<number>()

      if (subj.needs_double_period) {
        // Double-period subjects: find consecutive slot pairs
        let doubleAssigned = 0
        const doublePeriodPairs: { day: number; startPeriod: number }[] = []

        for (const slot of orderedSlots) {
          if (slot.period_number >= 12) continue
          const nextSlot = usableSlots.find(
            (s) => s.day_of_week === slot.day_of_week && s.period_number === slot.period_number + 1
          )
          if (!nextSlot) continue
          doublePeriodPairs.push({ day: slot.day_of_week, startPeriod: slot.period_number })
        }

        const shuffledPairs = shuffleArray(doublePeriodPairs)

        for (const pair of shuffledPairs) {
          if (doubleAssigned * 2 >= periodsNeeded) break
          for (let t = 0; t < shuffledTeachers.length; t++) {
            const teacher = shuffledTeachers[teacherIdx % shuffledTeachers.length]
            teacherIdx++
            const maxDaily = teacher.max_periods_per_day
            const dayCount = teacherDailyCount.get(teacher.teacher_id)?.get(pair.day) || 0
            if (dayCount + 2 > maxDaily) continue
            if (usedDays.has(pair.day)) continue // spread across days
            // Check if there's already another assignment on this day for this class
            if (classSlots.get(cls.class_id)?.has(slotKey(pair.day, pair.startPeriod))) continue

            if (isDoubleSlotAvailable(teacher.teacher_id, cls.class_id, pair.day, pair.startPeriod, pickRoom())) {
              assignDoubleSlot(teacher.teacher_id, cls.class_id, pair.day, pair.startPeriod, pickRoom())
              assignments.push({
                class_id: cls.class_id, subject_id: subj.subject_id, teacher_id: teacher.teacher_id,
                day_of_week: pair.day, period_number: pair.startPeriod, room_id: pickRoom(),
              })
              assignments.push({
                class_id: cls.class_id, subject_id: subj.subject_id, teacher_id: teacher.teacher_id,
                day_of_week: pair.day, period_number: pair.startPeriod + 1, room_id: pickRoom(),
              })
              usedDays.add(pair.day)
              doubleAssigned++
              assigned += 2
              break
            }
          }
        }
      }

      // Single periods for remaining needs
      const remaining = periodsNeeded - assigned
      for (let p = 0; p < remaining; p++) {
        let found = false
        for (let t = 0; t < shuffledTeachers.length * 3; t++) {
          const teacher = shuffledTeachers[teacherIdx % shuffledTeachers.length]
          teacherIdx++

          const maxDaily = teacher.max_periods_per_day
          const shuffledSlots = shuffleArray(orderedSlots)

          for (const slot of shuffledSlots) {
            const dayCount = teacherDailyCount.get(teacher.teacher_id)?.get(slot.day_of_week) || 0
            if (dayCount >= maxDaily) continue

            const roomId = pickRoom()

            // Distribution bonus: prefer days not already used for this subject
            if (usedDays.size > 0 && !usedDays.has(slot.day_of_week) && Math.random() > 0.3) {
              // Bonus for new days
            }

            if (isSlotAvailable(teacher.teacher_id, cls.class_id, slot.day_of_week, slot.period_number, roomId)) {
              assignSlot(teacher.teacher_id, cls.class_id, slot.day_of_week, slot.period_number, roomId)
              assignments.push({
                class_id: cls.class_id, subject_id: subj.subject_id, teacher_id: teacher.teacher_id,
                day_of_week: slot.day_of_week, period_number: slot.period_number, room_id: roomId,
              })
              usedDays.add(slot.day_of_week)
              assigned++
              found = true
              break
            }
          }
          if (found) break
        }

        if (!found) {
          conflicts.push({
            class: cls.class_name,
            subject: subj.subject_name,
            issue: 'No available slot',
            periods_needed: periodsNeeded,
            periods_assigned: assigned,
          })
        }
      }
      totalAssigned += assigned
    }
  }

  // --------
  // Quality scoring
  // --------
  const qualityReports: QualityReport[] = []

  // 1. Distribution score: how well subjects are spread across days
  let distributionScore = 0
  let distributionMax = 0
  const subjDayCount = new Map<string, Set<number>>()
  for (const a of assignments) {
    const key = `${a.class_id}-${a.subject_id}`
    if (!subjDayCount.has(key)) subjDayCount.set(key, new Set())
    subjDayCount.get(key)!.add(a.day_of_week)
  }
  for (const [, days] of subjDayCount) {
    distributionMax += 4 // max 5 days, minus 1
    distributionScore += days.size - 1
  }
  const distPct = distributionMax > 0 ? Math.round((distributionScore / distributionMax) * 100) : 100
  qualityReports.push({
    name: 'Subject Distribution Across Week',
    score: distPct,
    max: 100,
    details: `${distributionScore}/${distributionMax} day-spread score (subjects spread across different days = better)`,
  })

  // 2. Hard subject morning ratio
  let hardMorning = 0
  let hardTotal = 0
  for (const a of assignments) {
    const sub = (subjects || []).find((s) => s.id === a.subject_id)
    if (sub && sub.difficulty_tier <= 2) {
      hardTotal++
      if (morningPeriods.includes(a.period_number)) hardMorning++
    }
  }
  const morningPct = hardTotal > 0 ? Math.round((hardMorning / hardTotal) * 100) : 100
  qualityReports.push({
    name: 'Hard Subjects in Morning',
    score: morningPct,
    max: 100,
    details: `${hardMorning}/${hardTotal} hard-subject periods scheduled before lunch (higher = better for student focus)`,
  })

  // 3. Teacher load balance
  const teacherLoads: { name: string; days: number[] }[] = []
  for (const [tid, days] of teacherDailyCount) {
    const loads = Array.from({ length: 5 }, (_, i) => days.get(i + 1) || 0)
    teacherLoads.push({ name: teacherMap.get(tid) || tid, days: loads })
  }
  const allLoads = teacherLoads.flatMap((t) => t.days)
  const mean = allLoads.length > 0 ? allLoads.reduce((a, b) => a + b, 0) / allLoads.length : 0
  const variance = allLoads.length > 0
    ? Math.sqrt(allLoads.reduce((sum, v) => sum + (v - mean) ** 2, 0) / allLoads.length)
    : 0
  const balanceScore = Math.max(0, Math.round(100 - variance * 20))
  const unbalancedTeachers = teacherLoads.filter((t) => {
    const max = Math.max(...t.days)
    const min = Math.min(...t.days)
    return max - min > 2
  })

  qualityReports.push({
    name: 'Teacher Daily Load Balance',
    score: balanceScore,
    max: 100,
    details: `Std dev ${variance.toFixed(1)}${unbalancedTeachers.length > 0 ? `. ${unbalancedTeachers.length} teacher(s) with uneven loads` : '. All teachers have balanced daily loads.'}`,
  })

  // 4. Conflict-free rate
  const conflictFreePct = totalNeeded > 0
    ? Math.round(((totalNeeded - conflicts.length) / totalNeeded) * 100)
    : 100
  qualityReports.push({
    name: 'Conflict-Free Rate',
    score: conflictFreePct,
    max: 100,
    details: `${totalAssigned}/${totalNeeded} periods assigned, ${conflicts.length} conflict(s).`,
  })

  const overallScore = Math.round(
    (distPct + morningPct + balanceScore + conflictFreePct) / 4
  )

  // --------
  // Bulk insert
  // --------
  const entries = assignments.map((a) => ({
    term_id,
    class_id: a.class_id,
    subject_id: a.subject_id,
    teacher_id: a.teacher_id,
    day_of_week: a.day_of_week,
    period_number: a.period_number,
    room_id: a.room_id,
  }))

  await supabase.from('timetable_entries').delete().eq('term_id', term_id)

  if (entries.length > 0) {
    const { error } = await supabase.from('timetable_entries').insert(entries)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: gen } = await supabase.from('timetable_generations').insert({
    term_id,
    status: 'draft',
    algorithm_used: 'constraint-sat-v2',
    total_periods: totalNeeded,
    assigned_periods: totalAssigned,
    conflict_count: conflicts.length,
    conflicts: conflicts.length > 0 ? conflicts : null,
  }).select().single()

  return NextResponse.json({
    success: true,
    generation_id: gen?.id,
    total_periods: totalNeeded,
    assigned_periods: totalAssigned,
    conflict_count: conflicts.length,
    conflicts: conflicts.slice(0, 50),
    classes_generated: classReqs.length,
    diagnostics: diagnostics.slice(0, 50),
    quality: {
      overall_score: overallScore,
      reports: qualityReports,
    },
  })
}
