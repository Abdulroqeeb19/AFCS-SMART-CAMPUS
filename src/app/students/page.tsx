import { AuthGuard } from '@/components/auth-guard'
import { StudentsList } from './students-list'

export default function StudentsPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Student Management</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
            View, add, edit, and manage student records
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
        <StudentsList />
      </div>
    </AuthGuard>
  )
}
