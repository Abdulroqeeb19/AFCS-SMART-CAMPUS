'use client'

import { useEffect, useState, type ComponentType } from 'react'
import {
  ChevronLeft, Plus, BookOpen, Users, GraduationCap, Clock, Save, Trash2, Loader2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

type SetupTab = 'subjects' | 'teachers' | 'classes' | 'slots' | 'rooms'

interface Department { id: string; name: string; code: string }
interface Staff { id: string; staff_id: string; full_name: string; role: string }
interface Class { id: string; name: string; arm: string }
interface Subject { id: string; name: string; code: string; department_id: string | null; class_level: string | null; periods_per_week: number; difficulty_tier: number; needs_double_period: boolean; department?: { name: string } }
interface TeacherSubject { id: string; teacher_id: string; subject_id: string; is_primary: boolean; max_periods_per_day: number; teacher?: Staff; subject?: Subject }
interface ClassSubject { id: string; class_id: string; subject_id: string; periods_per_week: number | null; class?: Class; subject?: Subject }
interface TimeSlot { id: string; day_of_week: number; period_number: number; start_time: string; end_time: string; is_break: boolean; is_assembly: boolean; period_label: string | null }
interface Room { id: string; name: string; capacity: number; room_type: string }

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export default function TimetableSetupPage() {
  const [tab, setTab] = useState<SetupTab>('subjects')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [rooms, setRooms] = useState<Room[]>([])

  const [newSubject, setNewSubject] = useState({ name: '', code: '', department_id: '', class_level: '', periods_per_week: 3, difficulty_tier: 3, needs_double_period: false })
  const [newTeacherSubj, setNewTeacherSubj] = useState({ teacher_id: '', subject_id: '', is_primary: false })
  const [newClassSubj, setNewClassSubj] = useState({ class_id: '', subject_id: '', periods_per_week: '' })
  const [newRoom, setNewRoom] = useState({ name: '', capacity: 40, room_type: 'classroom' })

  const loadAll = async () => {
    setError('')
    try {
      const [subs, depts, stf, cls, ts, cs, sl, rm] = await Promise.all([
        api('/api/subjects'),
        api('/api/departments'),
        api('/api/staff'),
        api('/api/classes'),
        api('/api/teacher-subjects'),
        api('/api/class-subjects'),
        api('/api/time-slots'),
        api('/api/rooms'),
      ])
      setSubjects(subs)
      setDepartments(depts)
      setStaff(stf)
      setClasses(cls)
      setTeacherSubjects(ts)
      setClassSubjects(cs)
      setSlots(sl)
      setRooms(rm)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const addSubject = async () => {
    if (!newSubject.name || !newSubject.code) return
    setError('')
    try {
      const data = await api('/api/subjects', {
        method: 'POST',
        body: JSON.stringify(newSubject),
      })
      setSubjects((prev) => [...prev, data])
      setNewSubject({ name: '', code: '', department_id: '', class_level: '', periods_per_week: 3, difficulty_tier: 3, needs_double_period: false })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add subject')
    }
  }

  const deleteSubject = async (id: string) => {
    setError('')
    try {
      await api(`/api/subjects?id=${id}`, { method: 'DELETE' })
      setSubjects((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete subject')
    }
  }

  const addTeacherSubject = async () => {
    if (!newTeacherSubj.teacher_id || !newTeacherSubj.subject_id) return
    setError('')
    try {
      const data = await api('/api/teacher-subjects', {
        method: 'POST',
        body: JSON.stringify(newTeacherSubj),
      })
      setTeacherSubjects((prev) => [...prev, data])
      setNewTeacherSubj({ teacher_id: '', subject_id: '', is_primary: false })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign teacher')
    }
  }

  const deleteTeacherSubject = async (id: string) => {
    setError('')
    try {
      await api(`/api/teacher-subjects?id=${id}`, { method: 'DELETE' })
      setTeacherSubjects((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove assignment')
    }
  }

  const addClassSubject = async () => {
    if (!newClassSubj.class_id || !newClassSubj.subject_id) return
    setError('')
    try {
      const data = await api('/api/class-subjects', {
        method: 'POST',
        body: JSON.stringify(newClassSubj),
      })
      setClassSubjects((prev) => [...prev, data])
      setNewClassSubj({ class_id: '', subject_id: '', periods_per_week: '' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign subject to class')
    }
  }

  const deleteClassSubject = async (id: string) => {
    setError('')
    try {
      await api(`/api/class-subjects?id=${id}`, { method: 'DELETE' })
      setClassSubjects((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove class subject')
    }
  }

  const addRoom = async () => {
    if (!newRoom.name) return
    setError('')
    try {
      const data = await api('/api/rooms', {
        method: 'POST',
        body: JSON.stringify(newRoom),
      })
      setRooms((prev) => [...prev, data])
      setNewRoom({ name: '', capacity: 40, room_type: 'classroom' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add room')
    }
  }

  const deleteRoom = async (id: string) => {
    setError('')
    try {
      await api(`/api/rooms?id=${id}`, { method: 'DELETE' })
      setRooms((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete room')
    }
  }

  const tabs: { id: SetupTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'teachers', label: 'Teacher Assignments', icon: Users },
    { id: 'classes', label: 'Class Subjects', icon: GraduationCap },
    { id: 'slots', label: 'Time Slots', icon: Clock },
    { id: 'rooms', label: 'Rooms', icon: Save },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/timetable" className="text-zinc-400 hover:text-zinc-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">Timetable Setup</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Configure subjects, teacher assignments, and class schedules</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-[#001A4D]' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Subjects Tab */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-[#001A4D]">Add Subject</h3>
            <div className="flex flex-wrap gap-2">
              <input placeholder="Name" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-48" />
              <input placeholder="Code (e.g. MTH)" value={newSubject.code} onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-24" />
              <select value={newSubject.department_id} onChange={(e) => setNewSubject({ ...newSubject, department_id: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                <option value="">No dept</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={newSubject.class_level} onChange={(e) => setNewSubject({ ...newSubject, class_level: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                <option value="">All levels</option>
                {['JS1','JS2','JS3','SS1','SS2','SS3'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <input type="number" placeholder="Periods/wk" value={newSubject.periods_per_week} onChange={(e) => setNewSubject({ ...newSubject, periods_per_week: Number(e.target.value) })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-20" />
              <select value={newSubject.difficulty_tier} onChange={(e) => setNewSubject({ ...newSubject, difficulty_tier: Number(e.target.value) })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                <option value={1}>Tier 1 (Hardest)</option>
                <option value={2}>Tier 2 (Hard)</option>
                <option value={3}>Tier 3 (Medium)</option>
                <option value={4}>Tier 4 (Easy)</option>
                <option value={5}>Tier 5 (Easiest)</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer">
                <input type="checkbox" checked={newSubject.needs_double_period} onChange={(e) => setNewSubject({ ...newSubject, needs_double_period: e.target.checked })}
                  className="rounded" />
                <span className="text-xs">2x period</span>
              </label>
              <button onClick={addSubject}
                className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-3 py-2 text-sm font-medium hover:bg-blue-900 transition-colors">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border divide-y">
            {subjects.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No subjects defined. Add your first subject above.</p>
            ) : subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="font-medium text-zinc-800 w-36">{s.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{s.code}</span>
                <span className="text-xs text-zinc-400 w-16">{s.class_level || 'All'}</span>
                <span className="text-xs text-zinc-500 w-14">{s.periods_per_week}/wk</span>
                {s.needs_double_period && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">2x</span>}
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  s.difficulty_tier === 1 ? 'bg-red-100 text-red-700' :
                  s.difficulty_tier === 2 ? 'bg-orange-100 text-orange-700' :
                  s.difficulty_tier === 3 ? 'bg-blue-100 text-blue-700' :
                  s.difficulty_tier === 4 ? 'bg-green-100 text-green-700' :
                  'bg-zinc-100 text-zinc-600'
                }`}>T{s.difficulty_tier}</span>
                <span className="text-xs text-zinc-400 flex-1">{s.department?.name || ''}</span>
                <button onClick={() => deleteSubject(s.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Teacher Assignments Tab */}
      {tab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-[#001A4D]">Assign Teacher to Subject</h3>
            <div className="flex flex-wrap gap-2">
              <select value={newTeacherSubj.teacher_id} onChange={(e) => setNewTeacherSubj({ ...newTeacherSubj, teacher_id: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white w-48">
                <option value="">Select Teacher</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <select value={newTeacherSubj.subject_id} onChange={(e) => setNewTeacherSubj({ ...newTeacherSubj, subject_id: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white w-40">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input type="checkbox" checked={newTeacherSubj.is_primary} onChange={(e) => setNewTeacherSubj({ ...newTeacherSubj, is_primary: e.target.checked })} />
                Primary
              </label>
              <button onClick={addTeacherSubject} className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-3 py-2 text-sm font-medium hover:bg-blue-900 transition-colors">
                <Plus className="h-4 w-4" /> Assign
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border divide-y">
            {teacherSubjects.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No teacher-subject assignments yet.</p>
            ) : teacherSubjects.map((ts) => (
              <div key={ts.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Users className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="font-medium w-40 truncate">{ts.teacher?.full_name || '?'}</span>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{ts.subject?.name || '?'}</span>
                {ts.is_primary && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Primary</span>}
                <span className="text-xs text-zinc-400">Max {ts.max_periods_per_day}/day</span>
                <button onClick={() => deleteTeacherSubject(ts.id)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class Subjects Tab */}
      {tab === 'classes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-[#001A4D]">Assign Subject to Class</h3>
            <div className="flex flex-wrap gap-2">
              <select value={newClassSubj.class_id} onChange={(e) => setNewClassSubj({ ...newClassSubj, class_id: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white w-40">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.arm}</option>)}
              </select>
              <select value={newClassSubj.subject_id} onChange={(e) => setNewClassSubj({ ...newClassSubj, subject_id: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white w-40">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              <input type="number" placeholder="Periods/wk" value={newClassSubj.periods_per_week}
                onChange={(e) => setNewClassSubj({ ...newClassSubj, periods_per_week: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-20" />
              <button onClick={addClassSubject} className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-3 py-2 text-sm font-medium hover:bg-blue-900 transition-colors">
                <Plus className="h-4 w-4" /> Assign
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border divide-y">
            {classSubjects.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No subjects assigned to classes yet.</p>
            ) : (
              <>
                {classes.filter((c) => classSubjects.some((cs) => cs.class_id === c.id)).map((cls) => {
                  const csForClass = classSubjects.filter((cs) => cs.class_id === cls.id)
                  return (
                    <div key={cls.id} className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#001A4D] mb-2">{cls.name} {cls.arm}</p>
                      <div className="flex flex-wrap gap-2">
                        {csForClass.map((cs) => (
                          <span key={cs.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {cs.subject?.name || '?'}
                            {cs.periods_per_week && <span className="text-blue-400">({cs.periods_per_week}/wk)</span>}
                            <button onClick={() => deleteClassSubject(cs.id)} className="text-blue-300 hover:text-red-500 ml-1">&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Time Slots Tab */}
      {tab === 'slots' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="px-3 py-2 text-left">Period</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
                    <th key={d} className="px-3 py-2 text-center">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...new Set(slots.map((s) => s.period_number))].sort((a, b) => a - b).map((pn) => (
                  <tr key={pn} className="hover:bg-zinc-50">
                    <td className="px-3 py-2 font-medium text-zinc-600">{pn}</td>
                    {[1,2,3,4,5].map((d) => {
                      const slot = slots.find((s) => s.day_of_week === d && s.period_number === pn)
                      return (
                        <td key={d} className="px-3 py-2 text-center text-zinc-500">
                          {slot ? (
                            <span className={`${slot.is_break ? 'text-amber-500 font-medium' : slot.is_assembly ? 'text-purple-500 font-medium' : ''}`}>
                              {slot.start_time.slice(0,5)}-{slot.end_time.slice(0,5)}
                              {slot.is_break && ` (${slot.period_label || 'Break'})`}
                              {slot.is_assembly && ` (${slot.period_label || 'Assembly'})`}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-400">
              Mon&ndash;Thu: 40-min periods, Short Break (P4), Long Break (P10), closes 14:20. Fri: 30-min periods, Short Break (P4), Long Break (P9), closes 13:00.
          </p>
        </div>
      )}

      {/* Rooms Tab */}
      {tab === 'rooms' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            <strong>What is a Room?</strong> A physical location where a class takes place — e.g., <em>Lab A</em> (Science Laboratory), <em>Hall 1</em> (Assembly Hall), <em>JSS1A</em> (classroom), <em>ICT Lab</em> (Computer Lab). Rooms help the timetable avoid double-booking. This is optional — the generator works without rooms.
          </div>
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-[#001A4D]">Add Room</h3>
            <div className="flex flex-wrap gap-2">
              <input placeholder="Room name (e.g. Lab A, Hall 1, JSS1A Classroom)" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-64" />
              <select value={newRoom.room_type} onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                <option value="classroom">Classroom</option>
                <option value="lab">Laboratory</option>
                <option value="hall">Hall</option>
                <option value="workshop">Workshop</option>
              </select>
              <input type="number" placeholder="Capacity" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-20" />
              <button onClick={addRoom} className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-3 py-2 text-sm font-medium hover:bg-blue-900 transition-colors">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg border divide-y">
            {rooms.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No rooms defined.</p>
            ) : rooms.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="font-medium w-32">{r.name}</span>
                <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded capitalize">{r.room_type}</span>
                <span className="text-xs text-zinc-400">{r.capacity} capacity</span>
                <button onClick={() => deleteRoom(r.id)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
