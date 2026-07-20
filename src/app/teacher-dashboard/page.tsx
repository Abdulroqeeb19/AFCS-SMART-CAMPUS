import { AuthGuard } from '@/components/auth-guard'
import { ClassTeacherDashboard } from '@/components/class-teacher-dashboard'

export default function TeacherDashboardPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant_or_teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Class Teacher Dashboard</h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
              Take attendance and submit activity reports for your class
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
              <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
              <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
              <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
            </div>
          </div>
        </div>
        <ClassTeacherDashboard />
      </div>
    </AuthGuard>
  )
}
