import { AuthGuard } from '@/components/auth-guard'
import { StudentsList } from './students-list'

export default function StudentsPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">Student Management</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            View, add, edit, and manage student records
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
            <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
            <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
            <span className="h-1 w-8 rounded-full bg-[#008751]" />
          </div>
        </div>
        <StudentsList />
      </div>
    </AuthGuard>
  )
}
