'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function DailyReportForm() {
  const { user } = useAuth()
  const [staffId, setStaffId] = useState(user?.staff_id || '')
  const [activities, setActivities] = useState('')
  const [challenges, setChallenges] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

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
        headers: { 'Content-Type': 'application/json' },
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
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-zinc-900">{result.message}</h2>
          <p className="text-sm text-zinc-500 mt-1">{formatDate(new Date())}</p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>End-of-Day Report</CardTitle>
            <CardDescription>Record your daily activities and observations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="report-staff"
            label="Staff ID"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={loading || !!user}
            placeholder="Your staff ID"
          />

          <div className="space-y-1.5">
            <label htmlFor="activities" className="text-sm font-medium text-zinc-700">
              Activities Done <span className="text-red-500">*</span>
            </label>
            <textarea
              id="activities"
              rows={4}
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="Describe what you did today (lessons taught, tasks completed, etc.)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 resize-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="challenges" className="text-sm font-medium text-zinc-700">
              Challenges Faced
            </label>
            <textarea
              id="challenges"
              rows={3}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Any challenges or issues encountered"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 resize-none"
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
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FileText className="h-5 w-5 mr-2" />}
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
