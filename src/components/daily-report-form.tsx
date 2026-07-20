'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { FileText, Loader2, CheckCircle2, AlertCircle, Calendar, Bell } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function DailyReportForm() {
  const { user } = useAuth()
  const [staffId, setStaffId] = useState('')
  const [dutyStaff, setDutyStaff] = useState<{ id: string; staff_id: string; full_name: string } | null>(null)
  const [dutyLoading, setDutyLoading] = useState(true)
  const [notOnDuty, setNotOnDuty] = useState(false)
  const [activities, setActivities] = useState('')
  const [challenges, setChallenges] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  const authHeaders: Record<string, string> = user?.email
    ? { 'Content-Type': 'application/json', 'x-auth-email': user.email }
    : { 'Content-Type': 'application/json' }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/duty/week')
        if (res.ok) {
          const data = await res.json()
          if (data.today?.staff) {
            setDutyStaff(data.today.staff)
            setStaffId(data.today.staff.staff_id)
            setNotOnDuty(false)
          } else {
            setDutyStaff(null)
            setStaffId(user?.staff_id || '')
            setNotOnDuty(true)
          }
        }
      } catch {}
      setDutyLoading(false)
    })()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!activities.trim()) { setError('Please describe your activities'); return }
    if (!staffId.trim()) { setError('Staff ID is required'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          staff_id: staffId.trim(),
          activities_done: activities.trim(),
          challenges: challenges.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submission failed'); return }
      setResult({ success: true, message: 'Report submitted successfully' })
      setActivities(''); setChallenges(''); setNotes('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result?.success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-[var(--color-success)] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{result.message}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{formatDate(new Date())}</p>
          <Button onClick={() => setResult(null)} variant="outline" className="mt-6">
            Submit Another Report
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-info)]/20">
            <FileText className="h-5 w-5 text-[var(--color-info)]" />
          </div>
          <div>
            <CardTitle>End-of-Day Report</CardTitle>
            <CardDescription>Record your daily activities and observations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dutyLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-muted)]" />
          </div>
        ) : (
          <>
            {dutyStaff && (
              <div className="mb-4 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 p-3 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[var(--color-success)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-success)]">
                    Today&apos;s Duty Staff: {dutyStaff.full_name}
                  </p>
                  <p className="text-xs text-[var(--color-success)]">
                    Staff ID: {dutyStaff.staff_id}
                  </p>
                </div>
                <Badge variant="success" className="shrink-0">Active</Badge>
              </div>
            )}
            {notOnDuty && (
              <div className="mb-4 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 p-3 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--color-warning)] shrink-0" />
                <p className="text-sm text-[var(--color-warning)]">
                  No staff assigned for today&apos;s duty report. Contact the administration.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="report-staff"
                label="Staff ID"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                disabled={loading || !!dutyStaff}
                placeholder="Your staff ID"
              />

              <div className="space-y-1.5">
                <label htmlFor="activities" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Activities Done <span className="text-[var(--color-danger)]">*</span>
                </label>
                <textarea
                  id="activities"
                  rows={4}
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="Describe what you did today (lessons taught, tasks completed, etc.)"
                  className="w-full rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)] focus:ring-offset-1 disabled:opacity-50 resize-none"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="challenges" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Challenges Faced
                </label>
                <textarea
                  id="challenges"
                  rows={3}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Any challenges or issues encountered"
                  className="w-full rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)] focus:ring-offset-1 disabled:opacity-50 resize-none"
                  disabled={loading}
                />
              </div>

              <Input
                id="report-notes"
                label="Additional Notes"
                placeholder="Any other observations"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-[var(--color-danger)] mt-0.5 shrink-0" />
                  <span className="text-[var(--color-danger)]">{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FileText className="h-5 w-5 mr-2" />}
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
