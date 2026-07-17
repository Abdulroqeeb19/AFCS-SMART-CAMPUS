'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { QRScanner } from './qr-scanner'
import {
  LogOut, Loader2, CheckCircle2, AlertCircle, QrCode,
  User, BookOpen, Scan, Clock, Calendar,
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

type Mode = 'manual' | 'qr'

interface LookupResult {
  type: 'student'
  id: string
  student_id: string
  full_name: string
  class: { name: string; arm: string } | null
  is_active: boolean
  today_attendance: {
    id: string
    check_in: string
    check_out: string | null
    status: string
    period: string
  } | null
}

function calcDuration(checkIn: string, checkOut: string): string {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours === 0) return `${mins} min`
  return `${hours}h ${mins}m`
}

export function StudentCheckoutForm() {
  const [mode, setMode] = useState<Mode>('manual')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [person, setPerson] = useState<LookupResult | null>(null)
  const [scanId, setScanId] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    checkIn?: string
    checkOut?: string
    studentName?: string
    class?: { name: string; arm: string }
    period?: string
  } | null>(null)
  const [error, setError] = useState('')

  const lookupPerson = async (identifier: string) => {
    setError('')
    setResult(null)
    setPerson(null)
    setLookupLoading(true)
    try {
      const res = await fetch(`/api/checkin/lookup?identifier=${encodeURIComponent(identifier)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Student not found')
        return
      }
      const data = await res.json()
      if (data.type !== 'student') {
        setError('This ID belongs to a staff member. Use the Staff Check-Out page.')
        return
      }
      setPerson(data)
      setStudentId(identifier.toUpperCase())
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLookupLoading(false)
      setScanId((c) => c + 1)
    }
  }

  const handleQRScan = async (decodedText: string) => {
    const id = decodedText.trim().toUpperCase()
    setStudentId(id)
    setError('')
    setResult(null)
    setPerson(null)
    setLookupLoading(true)
    try {
      const res = await fetch(`/api/checkin/lookup?identifier=${encodeURIComponent(id)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Student not found')
        return
      }
      const data = await res.json()
      if (data.type !== 'student') {
        setError('This ID belongs to a staff member.')
        return
      }
      if (!data.today_attendance?.check_in) {
        setError('No check-in record for today. Please check in first.')
        return
      }
      if (data.today_attendance?.check_out) {
        setError(`Already checked out (${data.today_attendance.period})`)
        return
      }
      setPerson(data)
      setLoading(true)
      const period = data.today_attendance.period
      const coRes = await fetch('/api/attendance/student/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id, period }),
      })
      const coData = await coRes.json()
      if (!coRes.ok) {
        setError(coData.error || 'Check-out failed')
        return
      }
      setResult({
        success: true,
        message: coData.message,
        checkIn: coData.check_in,
        checkOut: coData.check_out,
        studentName: data.full_name,
        class: coData.class,
        period: coData.period,
      })
      setPerson(null)
      setStudentId('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setLookupLoading(false)
    }
  }

  async function doCheckOut() {
    setError('')
    setLoading(true)
    try {
      const period = person?.today_attendance?.period
      const res = await fetch('/api/attendance/student/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId.trim(), period }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Check-out failed')
        return
      }
      setResult({
        success: true,
        message: data.message,
        checkIn: data.check_in,
        checkOut: data.check_out,
        studentName: person?.full_name,
        class: data.class,
        period: data.period,
      })
      setPerson(null)
      setStudentId('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) {
      setError('Please enter a Student ID')
      return
    }
    await lookupPerson(studentId.trim())
  }

  const handleRetry = () => {
    setResult(null)
    setError('')
    setPerson(null)
    setStudentId('')
    setScanId((c) => c + 1)
  }

  if (result?.success) {
    const duration = result.checkIn && result.checkOut
      ? calcDuration(result.checkIn, result.checkOut)
      : null

    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-1">{result.message}</h2>
          {result.studentName && (
            <p className="text-sm text-zinc-500">{result.studentName}</p>
          )}
          {result.class && (
            <p className="text-sm text-zinc-400 mb-2">
              Class {result.class.name} {result.class.arm}
            </p>
          )}

          <div className="flex items-center justify-center gap-6 mt-4">
            {result.checkIn && (
              <div className="text-center">
                <p className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1 justify-center">
                  <Calendar className="h-3 w-3" /> Check In
                </p>
                <p className="text-lg font-semibold text-zinc-700 mt-0.5">{formatTime(result.checkIn)}</p>
              </div>
            )}
            {result.checkOut && (
              <div className="text-center">
                <p className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1 justify-center">
                  <Calendar className="h-3 w-3" /> Check Out
                </p>
                <p className="text-lg font-semibold text-zinc-700 mt-0.5">{formatTime(result.checkOut)}</p>
              </div>
            )}
          </div>

          {result.period && (
            <p className="text-xs text-zinc-400 mt-2 capitalize">{result.period} session</p>
          )}

          {duration && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
              <Clock className="h-4 w-4" />
              Session duration: {duration}
            </div>
          )}

          <Button onClick={handleRetry} variant="outline" className="mt-6">
            Check Out Next Student
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <LogOut className="h-7 w-7 text-amber-600" />
        </div>
        <CardTitle>Student Check-Out</CardTitle>
        <CardDescription>
          Scan the QR code or barcode on their ID card or enter the Student ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
          <button
            onClick={() => { setMode('manual'); setPerson(null); setError(''); setScanId((c) => c + 1) }}
            className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'manual' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <LogOut className="h-4 w-4" />
            Manual
          </button>
          <button
            onClick={() => { setMode('qr'); setPerson(null); setError(''); setScanId((c) => c + 1) }}
            className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'qr' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Scan Code
          </button>
        </div>

        {mode === 'qr' && (
          <QRScanner onScan={handleQRScan} onError={(msg) => setError(msg)} disabled={!!person} resetKey={scanId} />
        )}

        {mode === 'manual' && (
          <form onSubmit={handleManualLookup} className="space-y-4">
            <Input
              id="student-id-out"
              label="Student ID"
              placeholder="e.g. STU-0001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              error={error}
              disabled={loading || lookupLoading}
              autoFocus
              autoComplete="off"
            />
            <Button type="submit" className="w-full h-12 text-base" variant="secondary" disabled={loading || lookupLoading}>
              {lookupLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <User className="h-5 w-5 mr-2" />
              )}
              {lookupLoading ? 'Looking up...' : 'Look Up'}
            </Button>
          </form>
        )}

        {lookupLoading && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Looking up student...
          </div>
        )}

        {person && !lookupLoading && (
          <Card className="border-2 border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                  <User className="h-8 w-8 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 text-lg">{person.full_name}</p>
                  <p className="text-sm text-zinc-500">{person.student_id}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {person.class && (
                      <Badge variant="info" className="text-[10px]">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {person.class.name} {person.class.arm}
                      </Badge>
                    )}
                    {person.today_attendance?.check_in ? (
                      <Badge variant="warning" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1" />
                        In since {formatTime(person.today_attendance.check_in)}
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="text-[10px]">
                        Not checked in today
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {person.today_attendance?.check_in && !person.today_attendance?.check_out ? (
                  <Button
                    onClick={doCheckOut}
                    className="flex-1 h-11 gap-2"
                    variant="secondary"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Confirm Check-Out
                  </Button>
                ) : person.today_attendance?.check_out ? (
                  <div className="flex-1 text-center py-2 text-sm text-zinc-400">
                    Already checked out ({person.today_attendance.period})
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                      No check-in record for today. Please check in first.
                    </div>
                  </div>
                )}
                <Button onClick={handleRetry} variant="ghost" size="sm" className="shrink-0">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
