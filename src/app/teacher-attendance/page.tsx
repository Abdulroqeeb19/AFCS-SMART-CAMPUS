'use client'

import { AuthGuard } from '@/components/auth-guard'
import { TeacherAttendanceForm } from '@/components/teacher-attendance-form'
import { TodayBanner } from '@/components/today-banner'

export default function TeacherAttendancePage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant_or_teacher">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Class Attendance</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
            Take attendance for your assigned class
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
        <TodayBanner />
        <TeacherAttendanceForm />
      </div>
    </AuthGuard>
  )
}
