'use client'

import { AuthGuard } from '@/components/auth-guard'
import { StudentCheckoutForm } from '@/components/student-checkout-form'

export default function StudentCheckoutPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant_or_teacher">
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">Student Check-Out</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Record student departure from class
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
            <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
            <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
            <span className="h-1 w-8 rounded-full bg-[#008751]" />
          </div>
        </div>
        <StudentCheckoutForm />
      </div>
    </AuthGuard>
  )
}
