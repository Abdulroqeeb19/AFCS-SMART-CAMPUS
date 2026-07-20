'use client'

import { CollapsibleSection } from '@/components/collapsible-section'
import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { TimetableSkeleton } from '@/components/skeleton'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_COLORS = ['bg-[var(--color-info)]/10', 'bg-[var(--color-success)]/10', 'bg-[var(--color-warning)]/10', 'bg-[var(--color-accent)]/10', 'bg-[var(--color-danger)]/10']

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
  1: 'bg-[var(--color-danger)]/20 border-[var(--color-danger)]/40 text-[var(--color-danger)]',
  2: 'bg-[var(--color-warning)]/20 border-[var(--color-warning)]/30 text-[var(--color-warning)]/70',
  3: 'bg-[var(--color-info)]/20 border-[var(--color-info)]/40 text-[var(--color-info)]',
  4: 'bg-[var(--color-success)]/20 border-[var(--color-success)]/40 text-[var(--color-success)]',
  5: 'bg-[var(--color-bg-muted)] border-[var(--color-border-hover)] text-[var(--color-text-secondary)]',
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
  if (score >= 90) return 'text-[var(--color-success)]'
  if (score >= 70) return 'text-[var(--color-info)]'
  if (score >= 50) return 'text-[var(--color-warning)]'
  return 'text-[var(--color-danger)]'
}

function qualityBg(score: number): string {
  if (score >= 90) return 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
  if (score >= 70) return 'bg-[var(--color-info)]/10 border-[var(--color-info)]/30'
  if (score >= 50) return 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
  return 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30'
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

  const teachingPeriodExists = useCallback((day: number, period: number) =>
    slots.some((s) => s.day_of_week === day && s.period_number === period && !s.is_break && !s.is_assembly),
    [slots]
  )

  const nonTeachingPeriods = useMemo(() =>
    [...new Set(slots.filter((s) => s.is_break || s.is_assembly).map((s) => s.period_number))].sort((a, b) => a - b),
    [slots]
  )

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
    return <TimetableSkeleton />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-bg-sidebar)]">
              <Sparkles className="h-6 w-6 inline mr-2 text-[var(--color-accent)]" />
              AI Timetable Generator
            </h1>
            <Hint text="Select a term, filter by class/teacher, then click Generate. The AI optimises subject distribution, schedules hard subjects (Maths/English) in morning periods, and handles double-periods for practical subjects automatically." side="right" />
            {latestGen?.status === 'published' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success)]/20 text-[var(--color-success)]">
                <CheckCircle2 className="h-3 w-3" /> Published
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Nigerian standard schedule &mdash; 8 periods/day &middot; Assembly &middot; Mon&ndash;Thu 40min &middot; Fri 30min (closes 13:00) &middot; Quality optimisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestGen && latestGen.quality?.overall_score && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-[var(--color-bg-card)] text-sm">
              <Trophy className={`h-4 w-4 ${qualityColor(latestGen.quality.overall_score)}`} />
              <span className="font-medium">Quality: <span className={qualityColor(latestGen.quality.overall_score)}>{latestGen.quality.overall_score}%</span></span>
            </div>
          )}
          <Link href="/timetable/setup" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-hover)] bg-[var(--color-bg-card)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
            <Settings className="h-4 w-4" /> Setup
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Filters</span>
          </div>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)] min-w-[180px]"
            aria-label="Select academic term"
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
            className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)] min-w-[140px]"
            aria-label="Filter by class"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
            ))}
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)] min-w-[160px]"
            aria-label="Filter by teacher"
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
            className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)] w-36"
            aria-label="Filter by subject name"
          />

          <div className="flex-1" />

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedTermId}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-5 py-2 text-sm font-medium hover:bg-[var(--color-bg-sidebar)] disabled:opacity-50 transition-colors"
            aria-label={generating ? 'Generating timetable...' : 'Generate timetable'}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating...' : 'Generate Timetable'}
          </button>
        </div>
      </div>

      {/* Quality Score Cards (shown on view tab when gen result present) */}
      {genResult?.quality && tab === 'view' && (
        <div className="bg-gradient-to-r from-[#001A4D]/5 to-[#C9A84C]/5 rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-[var(--color-bg-sidebar)]" />
            <span className="text-sm font-semibold text-[var(--color-bg-sidebar)]">Generation Quality Report</span>
            <span className="text-xs text-[var(--color-text-muted)] ml-auto">
              v2 algorithm &middot; {genResult.classes_generated} classes
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genResult.quality.reports.map((r: QualityReport, i: number) => (
              <div key={i} className={`rounded-lg border p-3 ${qualityBg(r.score)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] truncate">{r.name}</span>
                  <span className={`text-lg font-bold ${qualityColor(r.score)}`}>{r.score}%</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 leading-tight">{r.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation Result Toast */}
      {genResult && (
        <div>
          <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${
            genResult.success ? (genResult.conflict_count === 0 ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30 text-[var(--color-warning)]') : 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]'
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
            <button onClick={() => setGenResult(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">&times;</button>
          </div>
          {/* Diagnostics: show skipped classes/subjects */}
          {genResult.diagnostics && genResult.diagnostics.length > 0 && (
            <details className="mt-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-2 text-xs text-[var(--color-warning)]">
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
                <div className="mt-2 border-t border-[var(--color-warning)]/30 pt-2 text-[var(--color-warning)]">
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
      <div className="flex gap-1 rounded-lg bg-[var(--color-bg-muted)] p-1 w-fit">
        <button onClick={() => setTab('view')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'view' ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-bg-sidebar)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
          <Calendar className="h-4 w-4" /> Timetable
        </button>
        <button onClick={() => setTab('quality')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'quality' ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-bg-sidebar)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
          <BarChart3 className="h-4 w-4" /> Quality
        </button>
        <button onClick={() => setTab('history')} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'history' ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-bg-sidebar)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
          <Clock className="h-4 w-4" /> History
        </button>
      </div>

      {/* Tab: View */}
      {tab === 'view' && (
        <div className="overflow-x-auto">
          {entries.length === 0 && !loading ? (
            <div className="text-center py-16 text-[var(--color-text-muted)]">
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
                  <div className="mt-5 max-w-md mx-auto text-left bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] p-4 text-xs text-[var(--color-text-secondary)]">
                    <p className="font-medium text-[var(--color-text-primary)] mb-2">Setup checklist (go to Setup):</p>
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
                  <th className="bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-3 py-2.5 text-left sticky left-0 z-10 min-w-[100px]">Period</th>
                  {DAYS.map((day, i) => (
                    <th key={day} className={`${DAY_COLORS[i]} px-2 py-2.5 text-center min-w-[160px]`}>
                      <span className="font-semibold text-[var(--color-text-primary)] text-sm">{day}</span>
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
                    <tr key={pn} className="border-t border-[var(--color-border)]">
                      <td className="bg-[var(--color-bg-secondary)] px-3 py-2 font-medium text-[var(--color-text-primary)] sticky left-0 z-10 border-r border-[var(--color-border)]">
                        <span className="block text-sm">
                          {getSlotLabel(slots, 1, pn)}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] block">
                          {getSlotTime(slots, 1, pn)}
                        </span>
                        {getSlotTime(slots, 5, pn) && getSlotTime(slots, 5, pn) !== getSlotTime(slots, 1, pn) && (
                          <span className="text-[8px] text-[var(--color-danger)]/70 block">
                            Fri: {getSlotTime(slots, 5, pn)}
                          </span>
                        )}
                      </td>
                      {teachingSlots.map(({ day, cellEntries }) => {
                        const slotExists = teachingPeriodExists(day, pn)
                        return (
                        <td key={`${day}-${pn}`} className={`${DAY_COLORS[day - 1]} px-1.5 py-1 border-r border-[var(--color-border)] align-top`}>
                          {!slotExists ? (
                            <span className="text-[8px] text-[var(--color-text-sidebar)] block text-center py-2 italic">N/A</span>
                          ) : cellEntries.length === 0 ? (
                            <span className="text-[9px] text-[var(--color-text-sidebar-muted)] block text-center py-2">&mdash;</span>
                          ) : (
                            <div className="space-y-1">
                              {cellEntries.map((e) => (
                                <div key={e.id} className={`rounded border-l-2 px-1.5 py-1 shadow-sm ${
                                  e.subject?.difficulty_tier
                                    ? DIFFICULTY_COLORS[e.subject.difficulty_tier] || 'bg-[var(--color-bg-card)] border-[var(--color-border)]'
                                    : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'
                                }`}>
                                  <p className="font-semibold text-[10px] text-[var(--color-bg-sidebar)] leading-tight truncate flex items-center gap-1">
                                    {e.subject?.code || e.subject?.name || '?'}
                                    {e.subject?.needs_double_period && (
                                      <span className="text-[7px] text-[var(--color-accent)]/70 font-normal">[2x]</span>
                                    )}
                                  </p>
                                  <p className="text-[8px] text-[var(--color-text-secondary)] truncate">
                                    {e.teacher?.full_name?.split(' ').slice(0, 2).join(' ') || '?'}
                                  </p>
                                  <p className="text-[7px] text-[var(--color-text-muted)]">
                                    {e.class?.name} {e.class?.arm || ''}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    </tr>
                  )
                })}
                {/* Non-teaching periods row */}
                {nonTeachingPeriods.length > 0 && (
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="bg-[var(--color-bg-muted)] px-3 py-2 font-medium text-[var(--color-text-secondary)] sticky left-0 z-10 border-r border-[var(--color-border)] text-xs italic">
                      Non-teaching periods
                    </td>
                    {DAYS.map((_, di) => {
                      const dayOfWeek = di + 1
                      const dayNonTeaching = slots.filter((s) => s.day_of_week === dayOfWeek && (s.is_break || s.is_assembly)).sort((a, b) => a.period_number - b.period_number)
                      return (
                        <td key={`non-${di}`} className="bg-[var(--color-bg-secondary)] px-2 py-2 border-r border-[var(--color-border)]">
                          {dayNonTeaching.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {dayNonTeaching.map((nt) => (
                                <span key={nt.period_number} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                  nt.is_assembly ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]' : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'
                                }`}>
                                  {nt.period_label || `P${nt.period_number}`}
                                  <span className="opacity-60">{getSlotTime(slots, dayOfWeek, nt.period_number)}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] text-[var(--color-text-sidebar-muted)]">&mdash;</span>
                          )}
                        </td>
                      )
                    })}
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
              <div className="bg-gradient-to-br from-[#001A4D] to-blue-900 rounded-xl p-6 text-[var(--color-text-sidebar)]">
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
                <div className="mt-4 w-full bg-[var(--color-bg-card)]/20 rounded-full h-2">
                  <div
                    className="bg-[var(--color-accent)] h-2 rounded-full transition-all"
                    style={{ width: `${latestGen.quality.overall_score}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                {latestGen.quality.reports.map((r: QualityReport, i: number) => (
                  <div key={i} className={`rounded-xl border p-4 ${qualityBg(r.score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm text-[var(--color-text-primary)]">{r.name}</h3>
                      <span className={`text-2xl font-bold ${qualityColor(r.score)}`}>{r.score}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-muted)] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          r.score >= 90 ? 'bg-[var(--color-success)]/100' : r.score >= 70 ? 'bg-[var(--color-info)]/100' : r.score >= 50 ? 'bg-[var(--color-warning)]/100' : 'bg-[var(--color-danger)]/100'
                        }`}
                        style={{ width: `${r.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2">{r.details}</p>
                  </div>
                ))}
              </div>

              <details className="text-xs text-[var(--color-text-muted)]">
                <summary className="cursor-pointer hover:text-[var(--color-text-secondary)] font-medium">
                  How quality is measured
                </summary>
                <div className="mt-2 space-y-1 bg-[var(--color-bg-secondary)] rounded-lg p-3">
                  <p><strong>Subject Distribution:</strong> Subjects should be spread across different days, not clumped. E.g., if a subject needs 3 periods/week, it should ideally be on 3 different days.</p>
                  <p><strong>Hard Subjects in Morning:</strong> Mathematics, English, Sciences (difficulty tier 1-2) are best taught before lunch when students are more alert. This score reflects what percentage land in morning slots.</p>
                  <p><strong>Teacher Load Balance:</strong> A teacher&apos;s periods should be roughly equal across the 5 days. Large variance means a teacher is overloaded some days and underloaded others.</p>
                  <p><strong>Conflict-Free Rate:</strong> Percentage of required periods successfully scheduled without teacher/class/room clashes.</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Overall score = average of all four metrics.</p>
                </div>
              </details>
            </>
          ) : (
            <div className="text-center py-16 text-[var(--color-text-muted)]">
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
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <p className="text-sm">No generations yet</p>
            </div>
          ) : (
            <CollapsibleSection
              items={genHistory}
              keyExtractor={(gen) => gen.id}
              defaultVisible={5}
              className="space-y-3"
              renderItem={(gen) => (
                <div className="bg-[var(--color-bg-card)] rounded-lg border p-4 flex items-start gap-4">
                  <div className={`rounded-full p-2 ${
                    gen.status === 'published' ? 'bg-[var(--color-success)]/20' : gen.status === 'draft' ? 'bg-[var(--color-warning)]/20' : 'bg-[var(--color-bg-muted)]'
                  }`}>
                    {gen.status === 'published' ? <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" /> :
                     gen.status === 'draft' ? <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" /> :
                     <RefreshCw className="h-5 w-5 text-[var(--color-text-muted)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm capitalize">{gen.status}</span>
                      {gen.quality?.overall_score && (
                        <span className={`text-xs font-semibold ${qualityColor(gen.quality.overall_score)}`}>
                          Quality: {gen.quality.overall_score}%
                        </span>
                      )}
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(gen.generated_at).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        gen.conflict_count === 0 ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                      }`}>
                        {gen.conflict_count === 0 ? 'No conflicts' : `${gen.conflict_count} conflicts`}
                      </span>
                      <span className="text-xs bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full">
                        {gen.algorithm_used}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {gen.assigned_periods}/{gen.total_periods} periods assigned
                      {gen.term?.name && ` — ${gen.term.name}`}
                    </p>
                    {gen.conflicts && Array.isArray(gen.conflicts) && gen.conflicts.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-[var(--color-warning)] cursor-pointer hover:text-[var(--color-warning)]">
                          View {gen.conflicts.length} conflict(s)
                        </summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {gen.conflicts.slice(0, 20).map((c, i) => (
                            <p key={i} className="text-xs text-[var(--color-text-secondary)]">&bull; {c.class} &mdash; {c.subject}: {c.issue}</p>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  {gen.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(gen.id)}
                      className="shrink-0 rounded-lg bg-[var(--color-success)] text-[var(--color-text-sidebar)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-success)]/90 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* Count summary */}
      {entries.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          {filteredEntries.length} timetable entr{filteredEntries.length === 1 ? 'y' : 'ies'}
          {selectedClassId && ` for ${classes.find((c) => c.id === selectedClassId)?.name}`}
        </p>
      )}
    </div>
  )
}
