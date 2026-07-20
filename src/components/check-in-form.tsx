'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { QRScanner } from './qr-scanner'
import {
  ClipboardCheck, Loader2, CheckCircle2, AlertCircle, QrCode,
  User, Building2, Shield, LogOut, Scan,
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

type Mode = 'manual' | 'qr'

interface LookupResult {
  type: 'staff'
  id: string
  staff_id: string
  full_name: string
  avatar_url: string | null
  role: string
  department: { name: string } | null
  is_active: boolean
  today_attendance: {
    id: string
    check_in: string
    check_out: string | null
    status: string
  } | null
}

export function CheckInForm() {
  const [mode, setMode] = useState<Mode>('manual')
  const [staffId, setStaffId] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [person, setPerson] = useState<LookupResult | null>(null)
  const [scanId, setScanId] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    status?: string
    time?: string
    isCheckOut?: boolean
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
        setError(data.error || 'Person not found')
        return
      }
      const data = await res.json()
      if (data.type !== 'staff') {
        setError('This ID belongs to a student. Use the Student Check-In page.')
        return
      }
      setPerson(data)
      setStaffId(identifier.toUpperCase())
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLookupLoading(false)
      setScanId((c) => c + 1)
    }
  }

  const handleQRScan = async (decodedText: string) => {
    const id = decodedText.trim().toUpperCase()
    setStaffId(id)
    setError('')
    setResult(null)
    setPerson(null)
    setLookupLoading(true)
    try {
      const res = await fetch(`/api/checkin/lookup?identifier=${encodeURIComponent(id)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Staff not found')
        return
      }
      const data = await res.json()
      if (data.type !== 'staff') {
        setError('This ID belongs to a student.')
        return
      }
      if (data.is_active === false) {
        setError('This staff account is not active.')
        return
      }
      if (data.today_attendance?.check_in && !data.today_attendance?.check_out) {
        setPerson(data)
        setLoading(true)
        const coRes = await fetch('/api/attendance/check-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff_id: id }),
        })
        const coData = await coRes.json()
        if (coRes.ok) {
          setResult({
            success: true,
            message: coData.message,
            isCheckOut: true,
            time: coData.check_out,
          })
        } else {
          setError(coData.error || 'Check-out failed')
        }
        return
      }
      if (data.today_attendance?.check_out) {
        setError('Already checked out today')
        return
      }
      setLoading(true)
      const ciRes = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: id }),
      })
      const ciData = await ciRes.json()
      if (!ciRes.ok) {
        if (ciRes.status === 409) {
          setResult({
            success: true,
            message: ciData.error || 'Already checked in',
            time: ciData.check_in,
            isCheckOut: true,
          })
        } else {
          setError(ciData.error || 'Check-in failed')
        }
        return
      }
      setResult({
        success: true,
        message: ciData.message,
        status: ciData.status,
        time: ciData.check_in,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setLookupLoading(false)
    }
  }

  async function handleCheckIn(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    setResult(null)
    if (!staffId.trim()) {
      setError('Please enter or scan a Staff ID')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setResult({
            success: true,
            message: data.error || 'Already checked in',
            time: data.check_in,
            isCheckOut: true,
          })
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
      })
      setPerson(null)
      setStaffId('')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Check-out failed')
        return
      }
      setResult({
        success: true,
        message: data.message,
        isCheckOut: true,
        time: data.check_out,
      })
      setPerson(null)
      setStaffId('')
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
    setStaffId('')
    setScanId((c) => c + 1)
  }

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId.trim()) {
      setError('Please enter a Staff ID')
      return
    }
    await lookupPerson(staffId.trim())
  }

  if (result?.success) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${result.isCheckOut ? 'bg-[var(--color-info)]/20' : 'bg-[var(--color-success)]/20'}`}>
            {result.isCheckOut ? <LogOut className="h-8 w-8 text-[var(--color-info)]" /> : <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />}
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">{result.message}</h2>
          {result.time && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {!result.isCheckOut && (
                <Badge variant={result.status === 'late' ? 'warning' : 'success'} className="text-sm px-3 py-1">
                  {result.status === 'late' ? 'Late Arrival' : 'On Time'}
                </Badge>
              )}
              <span className="text-lg font-medium text-[var(--color-text-secondary)]">
                {formatTime(result.time)}
              </span>
            </div>
          )}
          <Button onClick={handleRetry} variant="outline" className="mt-6">
            {result.isCheckOut ? 'Check In Next Person' : 'Check In Another Person'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-info)]/20">
          <ClipboardCheck className="h-7 w-7 text-[var(--color-info)]" />
        </div>
        <CardTitle>Staff Check-In</CardTitle>
        <CardDescription>
          Scan the QR code or barcode on their ID card or enter the Staff ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 rounded-xl bg-[var(--color-bg-muted)] p-1">
          <button
            onClick={() => { setMode('manual'); setPerson(null); setError(''); setScanId((c) => c + 1) }}
            className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'manual' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Manual
          </button>
          <button
            onClick={() => { setMode('qr'); setPerson(null); setError(''); setScanId((c) => c + 1) }}
            className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'qr' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]'
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
              id="staff-id"
              label="Staff ID"
              placeholder="e.g. AFC-0012"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              error={error}
              disabled={loading || lookupLoading}
              autoFocus
              autoComplete="off"
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
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Looking up person...
          </div>
        )}

        {person && !lookupLoading && (
          <Card className="border-[var(--color-info)]/30 bg-[var(--color-info)]/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[var(--color-info)]/30 flex items-center justify-center overflow-hidden shrink-0">
                  {person.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-[var(--color-info)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] text-lg">{person.full_name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{person.staff_id}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="info" className="text-[10px] capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                      {person.role}
                    </Badge>
                    {person.department && (
                      <Badge variant="default" className="text-[10px]">
                        <Building2 className="h-3 w-3 mr-1" />
                        {person.department.name}
                      </Badge>
                    )}
                    {person.today_attendance?.check_in && !person.today_attendance?.check_out && (
                      <Badge variant="warning" className="text-[10px]">
                        Checked in at {formatTime(person.today_attendance.check_in)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {person.today_attendance?.check_in && !person.today_attendance?.check_out ? (
                  <Button
                    onClick={handleCheckOut}
                    className="flex-1 h-11 gap-2"
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Check Out
                  </Button>
                ) : person.today_attendance?.check_out ? (
                  <div className="flex-1 text-center py-2 text-sm text-[var(--color-text-muted)]">
                    Already checked out today
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
                      <ClipboardCheck className="h-4 w-4" />
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
          <div className="flex items-start gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-[var(--color-danger)] mt-0.5 shrink-0" />
            <span className="text-[var(--color-danger)]">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
