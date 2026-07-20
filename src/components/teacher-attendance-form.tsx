'use client'

import { CollapsibleSection } from '@/components/collapsible-section'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { QRScanner } from '@/components/qr-scanner'
import {
  Loader2, CheckCircle2, AlertCircle, QrCode, UserCheck, Search,
  GraduationCap, BookOpen, LogOut, Check, Users,
} from 'lucide-react'
import { Skeleton } from '@/components/skeleton'

interface StudentWithAttendance {
  id: string
  student_id: string
  full_name: string
  class_id: string
  today_attendance: {
    id: string
    check_in: string
    check_out: string | null
    status: string
    period: string
  } | null
}

interface TeacherClass {
  id: string
  name: string
  arm: string
  students: StudentWithAttendance[]
}

export function TeacherAttendanceForm() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'grid' | 'qr' | 'manual'>('grid')
  const [checkingId, setCheckingId] = useState<string | null>(null)
  const [manualId, setManualId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError('')
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/classes/my')
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Failed to load class data')
          return
        }
        const data = await res.json()
        setClasses(data.classes || [])
        setCheckedInCount(data.checked_in || 0)
        setTotalCount(data.total_students || 0)
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/classes/my')
      if (!res.ok) return
      const data = await res.json()
      setClasses(data.classes || [])
      setCheckedInCount(data.checked_in || 0)
      setTotalCount(data.total_students || 0)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  const doCheckIn = async (studentId: string, studentName: string) => {
    setCheckingId(studentId)
    setSuccessMsg('')
    setError('')
    try {
      const res = await fetch('/api/attendance/student/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, period: 'morning' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(`${studentName} checked in`)
        loadData()
      } else {
        if (res.status === 409) setError(`Already checked in today`)
        else setError(data.error || 'Check-in failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setCheckingId(null)
    }
  }

  const handleQRScan = (decodedText: string) => {
    const id = decodedText.trim().toUpperCase()
    const student = classes.flatMap((c) => c.students).find(
      (s) => s.student_id === id
    )
    if (student) {
      doCheckIn(id, student.full_name)
    } else {
      setError(`Student with ID ${id} not found in your class`)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualId.trim()) return
    const id = manualId.trim().toUpperCase()
    const student = classes.flatMap((c) => c.students).find(
      (s) => s.student_id === id || s.full_name.toLowerCase().includes(id.toLowerCase())
    )
    if (student) {
      await doCheckIn(id, student.full_name)
      setManualId('')
    } else {
      setError(`No student found matching "${id}" in your class`)
    }
  }

  const doBatchCheckIn = async () => {
    setError('')
    setSuccessMsg('')
    const unchecked = classes.flatMap((c) => c.students).filter((s) => !s.today_attendance)
    if (unchecked.length === 0) {
      setError('All students are already checked in')
      return
    }
    let success = 0
    let fail = 0
    for (const s of unchecked) {
      setCheckingId(s.id)
      try {
        const res = await fetch('/api/attendance/student/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: s.student_id, period: 'morning' }),
        })
        if (res.ok) success++
        else fail++
      } catch {
        fail++
      }
    }
    setCheckingId(null)
    setSuccessMsg(`${success} student${success !== 1 ? 's' : ''} checked in${fail > 0 ? `, ${fail} failed` : ''}`)
    loadData()
  }

  const allStudents = classes.flatMap((c) => c.students)
  const filtered = searchQuery
    ? allStudents.filter(
        (s) =>
          s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allStudents

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <GraduationCap className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] font-medium">No class assigned</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {error || 'You have not been assigned as a class teacher yet.'}
          </p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-4 gap-2">
            <Loader2 className="h-3 w-3" /> Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <div key={cls.id} className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-[var(--color-accent)]/10">
            <BookOpen className="h-5 w-5 text-[var(--color-accent)]/70" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {cls.name} {cls.arm}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {checkedInCount}/{totalCount} checked in today
            </p>
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex gap-1 rounded-xl bg-[var(--color-bg-muted)] p-1">
        <button
          onClick={() => setMode('grid')}
          className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'grid' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Class</span>
        </button>
        <button
          onClick={() => setMode('qr')}
          className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'qr' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">Scan Code</span>
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Find</span>
        </button>
      </div>

      {/* QR Scanner Mode */}
      {mode === 'qr' && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3 text-center">
              Scan student QR code or barcode to mark attendance
            </p>
            <QRScanner onScan={handleQRScan} onError={(msg) => setError(msg)} />
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Mode */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            id="manual-student-id"
            placeholder="Enter Student ID or name..."
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            autoFocus
            autoComplete="off"
          />
          <Button type="submit" variant="secondary" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Search within grid */}
      {mode === 'grid' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search students in your class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--color-border-hover)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)] focus:ring-offset-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-secondary)]">
              {allStudents.length} student{allStudents.length !== 1 ? 's' : ''}
              {searchQuery && ` (${filtered.length} matching)`}
            </p>
            <Button
              onClick={doBatchCheckIn}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              disabled={checkingId !== null}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Check In All
            </Button>
          </div>

          <CollapsibleSection
            items={filtered}
            defaultVisible={6}
            keyExtractor={(s) => s.student_id || s.id}
            renderItem={(student) => {
              const isCheckedIn = !!student.today_attendance
              const isChecking = checkingId === student.id
              const status = student.today_attendance?.status
              const period = student.today_attendance?.period
              return (
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isCheckedIn
                      ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
                      : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-info)]/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {isCheckedIn && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)] inline mr-1.5 -mt-0.5" />}
                      {student.full_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{student.student_id}</p>
                    {isCheckedIn && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge
                          variant={status === 'late' ? 'warning' : 'success'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {status}
                        </Badge>
                        <Badge variant="info" className="text-[10px] px-1.5 py-0 capitalize">
                          {period}
                        </Badge>
                        {student.today_attendance?.check_out && (
                          <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                            <LogOut className="h-2.5 w-2.5" /> Done
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isCheckedIn && (
                    <Button
                      onClick={() => doCheckIn(student.student_id, student.full_name)}
                      size="sm"
                      className="ml-2 shrink-0 gap-1"
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">In</span>
                    </Button>
                  )}
                </div>
              )
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          />

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Users className="h-10 w-10 mx-auto mb-2 stroke-1" />
              <p className="text-sm">No students match your search</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
