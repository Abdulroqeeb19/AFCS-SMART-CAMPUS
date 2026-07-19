import { AuthGuard } from '@/components/auth-guard'
import { ClassTeacherDashboard } from '@/components/class-teacher-dashboard'

export default function TeacherDashboardPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant_or_teacher">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#001A4D]">Class Teacher Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Take attendance and submit activity reports for your class
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
              <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
              <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
              <span className="h-1 w-8 rounded-full bg-[#008751]" />
            </div>
          </div>
        </div>
        <ClassTeacherDashboard />
      </div>
    </AuthGuard>
  )
}
