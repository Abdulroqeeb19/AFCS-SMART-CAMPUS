'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  FileText, Loader2, CheckCircle2, AlertCircle, ClipboardCheck,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ClassInfo {
  id: string
  name: string
  arm: string
}

interface StudentActivityReport {
  id: string
  class_id: string
  activities_done: string
  challenges: string | null
  notes: string | null
  date: string
  submitted_at: string
}

export function StudentActivityReportForm() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [activities, setActivities] = useState('')
  const [challenges, setChallenges] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [existingReport, setExistingReport] = useState<StudentActivityReport | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/classes/my')
      .then((r) => r.ok ? r.json() : { classes: [] })
      .then((data) => {
        const cl = (data.classes || []).map((c: ClassInfo) => ({ id: c.id, name: c.name, arm: c.arm }))
        setClasses(cl)
        if (cl.length > 0) setSelectedClassId(cl[0].id)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true)
    fetch(`/api/reports/student-activity?class_id=${selectedClassId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: StudentActivityReport[]) => {
        const today = new Date().toISOString().split('T')[0]
        const todayReport = data.find(
          (r) => r.date === today && r.class_id === selectedClassId
        )
        if (todayReport) {
          setExistingReport(todayReport)
          setActivities(todayReport.activities_done || '')
          setChallenges(todayReport.challenges || '')
          setNotes(todayReport.notes || '')
        } else {
          setExistingReport(null)
          setActivities('')
          setChallenges('')
          setNotes('')
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [selectedClassId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!activities.trim()) return
    if (!selectedClassId) return

    setLoading(true)
    try {
      const res = await fetch('/api/reports/student-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          activities_done: activities.trim(),
          challenges: challenges.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Submission failed' })
        return
      }
      setResult({ success: true, message: existingReport ? 'Report updated successfully' : 'Report submitted successfully' })
      setExistingReport(data)
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (fetching && classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (classes.length === 0) return null

  if (result?.success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-zinc-900">{result.message}</h2>
          <p className="text-sm text-zinc-500 mt-1">{formatDate(new Date())}</p>
          <Button onClick={() => setResult(null)} variant="outline" className="mt-6">
            Submit Another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <ClipboardCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <CardTitle>Student Activities Report</CardTitle>
            <CardDescription>Report on today&apos;s class activities and lessons</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {classes.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="sa-activities" className="text-sm font-medium text-zinc-700">
              Activities Done <span className="text-red-500">*</span>
            </label>
            <textarea
              id="sa-activities"
              rows={4}
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="Describe the lessons taught, activities conducted, and topics covered today"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 resize-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sa-challenges" className="text-sm font-medium text-zinc-700">
              Challenges
            </label>
            <textarea
              id="sa-challenges"
              rows={3}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Any challenges faced during lessons (e.g. student absences, lack of materials)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 resize-none"
              disabled={loading}
            />
          </div>

          <Input
            id="sa-notes"
            label="Additional Notes"
            placeholder="Any other observations or remarks"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />

          {result && !result.success && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <span className="text-red-700">{result.message}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" className="h-12 flex-1" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FileText className="h-5 w-5 mr-2" />}
              {loading ? 'Saving...' : existingReport ? 'Update Report' : 'Submit Report'}
            </Button>
            {existingReport && (
              <p className="text-xs text-zinc-400">
                Submitted at {new Date(existingReport.submitted_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
