'use client'

import { AuthGuard } from '@/components/auth-guard'
import { StudentCheckoutForm } from '@/components/student-checkout-form'

export default function StudentCheckoutPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant_or_teacher">
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Student Check-Out</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
            Record student departure from class
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
        <StudentCheckoutForm />
      </div>
    </AuthGuard>
  )
}
