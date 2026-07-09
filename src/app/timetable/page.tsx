'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Calendar, CheckCircle2, XCircle, AlertTriangle, Settings,
  Loader2, BarChart3, RefreshCw, Sparkles, Filter,
  Trophy, TrendingUp, Clock,
} from 'lucide-react'
import Link from 'next/link'
import type {
  AcademicTerm, TimetableEntry, TimeSlot, AcademicSession,
} from '@/lib/database.types'
import { Hint } from '@/components/hint'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_COLORS = ['bg-blue-50', 'bg-green-50', 'bg-amber-50', 'bg-purple-50', 'bg-rose-50']

interface QualityReport {
  name: string
  score: number
  max: number
  details: string
}

interface GenerationResult {
  success: boolean
  assigned_periods: number
  total_periods: number
  classes_generated: number
  conflict_count: number
  error?: string
  quality?: { overall_score: number; reports: QualityReport[] }
  diagnostics?: { class_name: string; subject_name?: string; reason: string }[]
  hints?: string[]
}

interface GenHistoryItem {
  id: string
  term_id: string
  status: string
  generated_at: string
  published_at?: string
  conflict_count: number
  algorithm_used: string
  assigned_periods: number
  total_periods: number
  quality?: { overall_score: number; reports: QualityReport[] }
  conflicts?: { class: string; subject: string; issue: string }[]
  term?: { name: string }
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'bg-red-100 border-red-300 text-red-700',
  2: 'bg-orange-100 border-orange-300 text-orange-700',
  3: 'bg-blue-100 border-blue-300 text-blue-700',
  4: 'bg-green-100 border-green-300 text-green-700',
  5: 'bg-zinc-100 border-zinc-300 text-zinc-600',
}

function getSlotLabel(slots: TimeSlot[], day: number, period: number): string {
  const slot = slots.find((s) => s.day_of_week === day && s.period_number === period)
  if (!slot) return `P${period}`
  return slot.period_label || `P${period}`
}

function getSlotTime(slots: TimeSlot[], day: number, period: number): string {
  const slot = slots.find((s) => s.day_of_week === day && s.period_number === period)
  if (!slot) return ''
  return `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`
}

function qualityColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function qualityBg(score: number): string {
  if (score >= 90) return 'bg-green-50 border-green-200'
  if (score >= 70) return 'bg-blue-50 border-blue-200'
  if (score >= 50) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export default function TimetablePage() {
  const [terms, setTerms] = useState<(AcademicTerm & { session: Pick<AcademicSession, 'name'> })[]>([])
  const [selectedTermId, setSelectedTermId] = useState('')
  const [classes, setClasses] = useState<{ id: string; name: string; arm: string }[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('')
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<GenerationResult | null>(null)
  const [genHistory, setGenHistory] = useState<GenHistoryItem[]>([])
  const [tab, setTab] = useState<'view' | 'quality' | 'history'>('view')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [teacherNames, setTeacherNames] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [termsRes, classesRes, slotsRes] = await Promise.all([
        supabase.from('academic_terms').select('*, session:session_id(name)').order('start_date', { ascending: false }),
        supabase.from('classes').select('*').order('name').order('arm'),
        supabase.from('time_slots').select('*').order('day_of_week').order('period_number'),
      ])
      if (termsRes.data) setTerms(termsRes.data as (AcademicTerm & { session: Pick<AcademicSession, 'name'> })[])
      if (classesRes.data) setClasses(classesRes.data)
      if (slotsRes.data) setSlots(slotsRes.data)

      const current = termsRes.data?.find((t) => t.is_current)
      if (current) setSelectedTermId(current.id)
      else if (termsRes.data?.length) setSelectedTermId(termsRes.data[0].id)

      // Pre-populate teacher names from staff table (in case no entries yet)
      const { data: staffList } = await supabase.from('staff').select('full_name').eq('is_active', true).order('full_name')
      if (staffList?.length) setTeacherNames(staffList.map((s) => s.full_name))

      setLoading(false)
    }
    load()
  }, [supabase])

  useEffect(() => {
    if (!selectedTermId) return
    supabase
      .from('timetable_entries')
      .select('*, class:class_id(id, name, arm), subject:subject_id(*), teacher:teacher_id(id, staff_id, full_name)')
      .eq('term_id', selectedTermId)
      .order('day_of_week')
      .order('period_number')
      .then(({ data }) => {
        setEntries((data || []) as TimetableEntry[])
        const entryNames = (data || []).map((e) => e.teacher?.full_name).filter((n): n is string => !!n)
        setTeacherNames((prev) => [...new Set([...prev, ...entryNames])].sort())
      })
  }, [selectedTermId, supabase])

  useEffect(() => {
    if (!selectedTermId) return
    supabase
      .from('timetable_generations')
      .select('*, term:term_id(name)')
      .eq('term_id', selectedTermId)
      .order('generated_at', { ascending: false })
      .then(({ data }) => setGenHistory((data || []) as unknown as GenHistoryItem[]))
  }, [selectedTermId, supabase])

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (selectedClassId && e.class_id !== selectedClassId) return false
      if (subjectFilter && !e.subject?.name.toLowerCase().includes(subjectFilter.toLowerCase())) return false
      if (selectedTeacherFilter && e.teacher?.full_name !== selectedTeacherFilter) return false
      return true
    })
  }, [entries, selectedClassId, subjectFilter, selectedTeacherFilter])

  const entriesByDay = useMemo(() =>
    DAYS.map((_, i) => filteredEntries.filter((e) => e.day_of_week === i + 1)),
    [filteredEntries]
  )

  const periodNumbers = useMemo(() =>
    [...new Set(slots.filter((s) => !s.is_break && !s.is_assembly).map((s) => s.period_number))].sort((a, b) => a - b),
    [slots]
  )

  const nonTeachingPeriods = useMemo(() =>
    slots.filter((s) => s.is_break || s.is_assembly).filter((s, i, arr) => arr.findIndex((x) => x.period_number === s.period_number && x.day_of_week === 1) === i),
    [slots]
  ).sort((a, b) => a.period_number - b.period_number)

  const latestGen = genHistory[0]

  const handleGenerate = async () => {
    if (!selectedTermId) return
    setGenerating(true)
    setGenResult(null)
    try {
      const res = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term_id: selectedTermId }),
      })
      const data = await res.json()
      setGenResult(data)
      if (data.success) {
        const { data: updated } = await supabase
          .from('timetable_entries')
          .select('*, class:class_id(id, name, arm), subject:subject_id(*), teacher:teacher_id(id, staff_id, full_name)')
          .eq('term_id', selectedTermId)
          .order('day_of_week')
          .order('period_number')
        setEntries((updated || []) as TimetableEntry[])

        const { data: newHistory } = await supabase
          .from('timetable_generations')
          .select('*, term:term_id(name)')
          .eq('term_id', selectedTermId)
          .order('generated_at', { ascending: false })
        setGenHistory((newHistory || []) as unknown as GenHistoryItem[])
      }
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async (genId: string) => {
    await supabase.from('timetable_generations').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', genId)
    setGenHistory((prev) => prev.map((g) => g.id === genId ? { ...g, status: 'published' } : g))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#001A4D]">
              <Sparkles className="h-6 w-6 inline mr-2 text-[#C9A84C]" />
              AI Timetable Generator
            </h1>
            <Hint text="Select a term, filter by class/teacher, then click Generate. The AI optimises subject distribution, schedules hard subjects (Maths/English) in morning periods, and handles double-periods for practical subjects automatically." side="right" />
            {latestGen?.status === 'published' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Published
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            Nigerian standard schedule &mdash; 8 periods/day &middot; Assembly &middot; Double-period support &middot; Quality optimisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestGen && latestGen.quality?.overall_score && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white text-sm">
              <Trophy className={`h-4 w-4 ${qualityColor(latestGen.quality.overall_score)}`} />
              <span className="font-medium">Quality: <span className={qualityColor(latestGen.quality.overall_score)}>{latestGen.quality.overall_score}%</span></span>
            </div>
          )}
          <Link href="/timetable/setup" className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors">
            <Settings className="h-4 w-4" /> Setup
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Filters</span>
          </div>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white min-w-[180px]"
          >
            <option value="">Select Term</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {(t as AcademicTerm & { session: { name: string } }).session?.name} - {t.name} {t.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white min-w-[140px]"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
            ))}
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white min-w-[160px]"
          >
            <option value="">All Teachers</option>
            {teacherNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter subject..."
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white w-36"
          />

          <div className="flex-1" />

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedTermId}
            className="inline-flex items-center gap-2 rounded-lg bg-[#001A4D] text-white px-5 py-2 text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition-colors"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating...' : 'Generate Timetable'}
          </button>
        </div>
      </div>

      {/* Quality Score Cards (shown on view tab when gen result present) */}
      {genResult?.quality && tab === 'view' && (
        <div className="bg-gradient-to-r from-[#001A4D]/5 to-[#C9A84C]/5 rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-[#001A4D]" />
            <span className="text-sm font-semibold text-[#001A4D]">Generation Quality Report</span>
            <span className="text-xs text-zinc-400 ml-auto">
              v2 algorithm &middot; {genResult.classes_generated} classes
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genResult.quality.reports.map((r: QualityReport, i: number) => (
              <div key={i} className={`rounded-lg border p-3 ${qualityBg(r.score)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-600 truncate">{r.name}</span>
                  <span className={`text-lg font-bold ${qualityColor(r.score)}`}>{r.score}%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{r.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation Result Toast */}
      {genResult && (
        <div>
          <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${
            genResult.success ? (genResult.conflict_count === 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800') : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {genResult.success && genResult.conflict_count === 0 ? <CheckCircle2 className="h-5 w-5 shrink-0" /> :
             genResult.success ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <span className="flex-1">
              {genResult.success
                ? `${genResult.assigned_periods}/${genResult.total_periods} periods across ${genResult.classes_generated} classes`
                : genResult.error || 'Generation failed'}
              {genResult.conflict_count > 0 && ` — ${genResult.conflict_count} conflict(s)`}
              {genResult.quality && ` · Overall quality: ${genResult.quality.overall_score}%`}
            </span>
            <button onClick={() => setGenResult(null)} className="text-zinc-400 hover:text-zinc-600">&times;</button>
          </div>
          {/* Diagnostics: show skipped classes/subjects */}
          {genResult.diagnostics && genResult.diagnostics.length > 0 && (
            <details className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              <summary className="cursor-pointer font-medium">
                {genResult.diagnostics.length} class(es)/subject(s) skipped — click for details
              </summary>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {genResult.diagnostics.slice(0, 30).map((d, i) => (
                  <p key={i}>
                    &bull; <strong>{d.class_name}</strong>
                    {d.subject_name ? ` / ${d.subject_name}` : ''}: {d.reason}
                  </p>
                ))}
              </div>
              {genResult.hints && (
                <div className="mt-2 border-t border-amber-200 pt-2 text-amber-700">
                  <p className="font-medium mb-1">To fix:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {genResult.hints.map((h: string, i: number) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
            </details>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit">
        <button onClick={() => setTab('view')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'view' ? 'bg-white shadow-sm text-[#001A4D]' : 'text-zinc-500 hover:text-zinc-700'}`}>
          <Calendar className="h-4 w-4" /> Timetable
        </button>
        <button onClick={() => setTab('quality')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'quality' ? 'bg-white shadow-sm text-[#001A4D]' : 'text-zinc-500 hover:text-zinc-700'}`}>
          <BarChart3 className="h-4 w-4" /> Quality
        </button>
        <button onClick={() => setTab('history')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'history' ? 'bg-white shadow-sm text-[#001A4D]' : 'text-zinc-500 hover:text-zinc-700'}`}>
          <Clock className="h-4 w-4" /> History
        </button>
      </div>

      {/* Tab: View */}
      {tab === 'view' && (
        <div className="overflow-x-auto">
          {entries.length === 0 && !loading ? (
            <div className="text-center py-16 text-zinc-400">
              {terms.length === 0 ? (
                <>
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No academic terms configured</p>
                  <p className="text-sm mt-1 max-w-md mx-auto">
                    Run migration <code>011_timetable_schema.sql</code> in Supabase and add env vars.
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No timetable generated yet</p>
                  <p className="text-sm mt-1">Select a term above and click <strong>&ldquo;Generate Timetable&rdquo;</strong></p>
                  <div className="mt-5 max-w-md mx-auto text-left bg-zinc-50 rounded-lg border border-zinc-200 p-4 text-xs text-zinc-600">
                    <p className="font-medium text-zinc-800 mb-2">Setup checklist (go to Setup):</p>
                    <ol className="space-y-1.5 list-decimal list-inside">
                      <li><strong>Subjects</strong> &mdash; Add subjects with codes, difficulty tiers</li>
                      <li><strong>Teacher Assignments</strong> &mdash; Assign at least one teacher to each subject</li>
                      <li><strong>Classes</strong> &mdash; Assign subjects to each class (JSS1A, JSS1B, etc.)</li>
                      <li><strong>Generate</strong> &mdash; Come back here and click Generate</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          ) : (
            <table className="w-full border-collapse text-xs min-w-[900px]">
              <thead>
                <tr>
                  <th className="bg-[#001A4D] text-white px-3 py-2.5 text-left sticky left-0 z-10 min-w-[100px]">Period</th>
                  {DAYS.map((day, i) => (
                    <th key={day} className={`${DAY_COLORS[i]} px-2 py-2.5 text-center min-w-[160px]`}>
                      <span className="font-semibold text-zinc-800 text-sm">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodNumbers.map((pn) => {
                  const teachingSlots = DAYS.map((_, di) => {
                    const day = di + 1
                    const cellEntries = entriesByDay[di].filter((e) => e.period_number === pn)
                    return { day, cellEntries }
                  })
                  return (
                    <tr key={pn} className="border-t border-zinc-200">
                      <td className="bg-zinc-50 px-3 py-2 font-medium text-zinc-700 sticky left-0 z-10 border-r border-zinc-200">
                        <span className="block text-sm">
                          {getSlotLabel(slots, 1, pn)}
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          {getSlotTime(slots, 1, pn)}
                        </span>
                      </td>
                      {teachingSlots.map(({ day, cellEntries }) => (
                        <td key={`${day}-${pn}`} className={`${DAY_COLORS[day - 1]} px-1.5 py-1 border-r border-zinc-100 align-top`}>
                          {cellEntries.length === 0 ? (
                            <span className="text-[9px] text-zinc-200 block text-center py-2">&mdash;</span>
                          ) : (
                            <div className="space-y-1">
                              {cellEntries.map((e) => (
                                <div key={e.id} className={`rounded border-l-2 px-1.5 py-1 shadow-sm ${
                                  e.subject?.difficulty_tier
                                    ? DIFFICULTY_COLORS[e.subject.difficulty_tier] || 'bg-white border-zinc-200'
                                    : 'bg-white border-zinc-200'
                                }`}>
                                  <p className="font-semibold text-[10px] text-[#001A4D] leading-tight truncate flex items-center gap-1">
                                    {e.subject?.code || e.subject?.name || '?'}
                                    {e.subject?.needs_double_period && (
                                      <span className="text-[7px] text-purple-500 font-normal">[2x]</span>
                                    )}
                                  </p>
                                  <p className="text-[8px] text-zinc-500 truncate">
                                    {e.teacher?.full_name?.split(' ').slice(0, 2).join(' ') || '?'}
                                  </p>
                                  <p className="text-[7px] text-zinc-400">
                                    {e.class?.name} {e.class?.arm || ''}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {/* Non-teaching periods row */}
                {nonTeachingPeriods.length > 0 && (
                  <tr className="border-t border-zinc-200">
                    <td className="bg-zinc-100 px-3 py-2 font-medium text-zinc-500 sticky left-0 z-10 border-r border-zinc-200 text-xs italic">
                      Non-teaching periods
                    </td>
                    {DAYS.map((_, di) => (
                      <td key={`non-${di}`} className="bg-zinc-50 px-2 py-2 border-r border-zinc-100">
                        <div className="flex flex-wrap gap-1">
                          {nonTeachingPeriods.map((nt) => (
                            <span key={nt.period_number} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                              nt.is_assembly ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              {nt.period_label || `P${nt.period_number}`}
                              <span className="opacity-60">{getSlotTime(slots, 1, nt.period_number)}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Quality */}
      {tab === 'quality' && (
        <div className="space-y-4">
          {latestGen?.quality ? (
            <>
              <div className="bg-gradient-to-br from-[#001A4D] to-blue-900 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Overall Quality Score</p>
                    <p className="text-5xl font-bold mt-1">{latestGen.quality.overall_score}%</p>
                  </div>
                  <div className="text-right">
                    <TrendingUp className="h-10 w-10 opacity-60" />
                    <p className="text-xs opacity-60 mt-1">constraint-sat-v2</p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-[#C9A84C] h-2 rounded-full transition-all"
                    style={{ width: `${latestGen.quality.overall_score}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                {latestGen.quality.reports.map((r: QualityReport, i: number) => (
                  <div key={i} className={`rounded-xl border p-4 ${qualityBg(r.score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm text-zinc-800">{r.name}</h3>
                      <span className={`text-2xl font-bold ${qualityColor(r.score)}`}>{r.score}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          r.score >= 90 ? 'bg-green-500' : r.score >= 70 ? 'bg-blue-500' : r.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${r.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">{r.details}</p>
                  </div>
                ))}
              </div>

              <details className="text-xs text-zinc-400">
                <summary className="cursor-pointer hover:text-zinc-600 font-medium">
                  How quality is measured
                </summary>
                <div className="mt-2 space-y-1 bg-zinc-50 rounded-lg p-3">
                  <p><strong>Subject Distribution:</strong> Subjects should be spread across different days, not clumped. E.g., if a subject needs 3 periods/week, it should ideally be on 3 different days.</p>
                  <p><strong>Hard Subjects in Morning:</strong> Mathematics, English, Sciences (difficulty tier 1-2) are best taught before lunch when students are more alert. This score reflects what percentage land in morning slots.</p>
                  <p><strong>Teacher Load Balance:</strong> A teacher&apos;s periods should be roughly equal across the 5 days. Large variance means a teacher is overloaded some days and underloaded others.</p>
                  <p><strong>Conflict-Free Rate:</strong> Percentage of required periods successfully scheduled without teacher/class/room clashes.</p>
                  <p className="text-[10px] text-zinc-400 mt-2">Overall score = average of all four metrics.</p>
                </div>
              </details>
            </>
          ) : (
            <div className="text-center py-16 text-zinc-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Generate a timetable to see quality metrics</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {genHistory.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p className="text-sm">No generations yet</p>
            </div>
          ) : (
            genHistory.map((gen) => (
              <div key={gen.id} className="bg-white rounded-lg border p-4 flex items-start gap-4">
                <div className={`rounded-full p-2 ${
                  gen.status === 'published' ? 'bg-green-100' : gen.status === 'draft' ? 'bg-amber-100' : 'bg-zinc-100'
                }`}>
                  {gen.status === 'published' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                   gen.status === 'draft' ? <AlertTriangle className="h-5 w-5 text-amber-600" /> :
                   <RefreshCw className="h-5 w-5 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm capitalize">{gen.status}</span>
                    {gen.quality?.overall_score && (
                      <span className={`text-xs font-semibold ${qualityColor(gen.quality.overall_score)}`}>
                        Quality: {gen.quality.overall_score}%
                      </span>
                    )}
                    <span className="text-xs text-zinc-400">
                      {new Date(gen.generated_at).toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      gen.conflict_count === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {gen.conflict_count === 0 ? 'No conflicts' : `${gen.conflict_count} conflicts`}
                    </span>
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                      {gen.algorithm_used}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mt-1">
                    {gen.assigned_periods}/{gen.total_periods} periods assigned
                    {gen.term?.name && ` — ${gen.term.name}`}
                  </p>
                  {gen.conflicts && Array.isArray(gen.conflicts) && gen.conflicts.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-800">
                        View {gen.conflicts.length} conflict(s)
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {gen.conflicts.slice(0, 20).map((c, i) => (
                          <p key={i} className="text-xs text-zinc-500">&bull; {c.class} &mdash; {c.subject}: {c.issue}</p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
                {gen.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(gen.id)}
                    className="shrink-0 rounded-lg bg-[#008751] text-white px-3 py-1.5 text-xs font-medium hover:bg-green-800 transition-colors"
                  >
                    Publish
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Count summary */}
      {entries.length > 0 && (
        <p className="text-xs text-zinc-400 text-right">
          {filteredEntries.length} timetable entr{filteredEntries.length === 1 ? 'y' : 'ies'}
          {selectedClassId && ` for ${classes.find((c) => c.id === selectedClassId)?.name}`}
        </p>
      )}
    </div>
  )
}
