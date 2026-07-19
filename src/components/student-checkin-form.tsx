'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { QRScanner } from './qr-scanner'
import {
  UserCheck, Loader2, CheckCircle2, AlertCircle, GraduationCap,
  QrCode, User, BookOpen, Scan,
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
    status: string
    period: string
  } | null
}

export function StudentCheckinForm() {
  const [mode, setMode] = useState<Mode>('manual')
  const [studentId, setStudentId] = useState('')
  const [period, setPeriod] = useState('morning')
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [person, setPerson] = useState<LookupResult | null>(null)
  const [scanId, setScanId] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    status?: string
    time?: string
    class?: { name: string; arm: string }
  } | null>(null)
  const [error, setError] = useState('')

  const lookupPerson = async (identifier: string) => {
    setError('')
    setResult(null)
    setPerson(null)
    setLookupLoading(true)
    try {
      const id = identifier.toUpperCase()
      const res = await fetch(`/api/checkin/lookup?identifier=${encodeURIComponent(id)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Student not found')
        return
      }
      const data = await res.json()
      if (data.type !== 'student') {
        setError('This ID belongs to a staff member. Use the Staff Check-In page.')
        return
      }
      setPerson(data)
      setStudentId(id)
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
      if (data.is_active === false) {
        setError('This student account is not active.')
        return
      }
      if (data.today_attendance) {
        setError(`Already checked in for ${data.today_attendance.period} period`)
        return
      }
      setLoading(true)
      const ciRes = await fetch('/api/attendance/student/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id, period }),
      })
      const ciData = await ciRes.json()
      if (!ciRes.ok) {
        setError(ciData.error || 'Check-in failed')
        return
      }
      setResult({
        success: true,
        message: ciData.message,
        status: ciData.status,
        time: ciData.check_in,
        class: ciData.class,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setLookupLoading(false)
    }
  }

  async function handleCheckIn() {
    setError('')
    setResult(null)
    if (!studentId.trim()) {
      setError('Please enter or scan a Student ID')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/attendance/student/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId.trim(), period }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setError(`Already checked in for ${period} period`)
        } else {
          setError(data.error || 'Check-in failed')
        }
        return
      }
      setResult({
        success: true,
        message: data.message,
        status: data.status,
        time: data.check_in,
        class: data.class,
      })
      setPerson(null)
      setStudentId('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setError('')
    setPerson(null)
    setStudentId('')
    setScanId((c) => c + 1)
  }

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) {
      setError('Please enter a Student ID')
      return
    }
    await lookupPerson(studentId.trim())
  }

  if (result?.success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-1">{result.message}</h2>
          {result.class && (
            <p className="text-sm text-zinc-500 mb-3">
              Class {result.class.name} {result.class.arm}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={result.status === 'late' ? 'warning' : 'success'} className="text-sm px-3 py-1">
              {result.status === 'late' ? 'Late' : 'Present'}
            </Badge>
            <span className="text-zinc-400">|</span>
            <span className="text-lg font-medium text-zinc-600">
              {result.time ? formatTime(result.time) : ''}
            </span>
          </div>
          <Button onClick={handleRetry} variant="outline" className="mt-6">
            Check In Another Student
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
          <GraduationCap className="h-7 w-7 text-violet-600" />
        </div>
        <CardTitle>Student Check-In</CardTitle>
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
            <UserCheck className="h-4 w-4" />
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
              id="student-id"
              label="Student ID"
              placeholder="e.g. STU-0001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              error={error}
              disabled={loading || lookupLoading}
              autoFocus
              autoComplete="off"
            />
            <Select
              id="period"
              label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={[
                { value: 'morning', label: 'Morning Session' },
                { value: 'afternoon', label: 'Afternoon Session' },
              ]}
            />
            <Button type="submit" className="w-full h-12 text-base" disabled={loading || lookupLoading}>
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
          <Card className="border-2 border-violet-200 bg-violet-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-violet-200 flex items-center justify-center overflow-hidden shrink-0">
                  <User className="h-8 w-8 text-violet-500" />
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
                    {person.today_attendance && (
                      <Badge variant="warning" className="text-[10px]">
                        Checked in ({person.today_attendance.period})
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {person.today_attendance ? (
                  <div className="flex-1 text-center py-2 text-sm text-zinc-400">
                    Already checked in for {person.today_attendance.period} period
                  </div>
                ) : (
                  <Button
                    onClick={handleCheckIn}
                    className="flex-1 h-11 gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    Confirm Check-In
                  </Button>
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
