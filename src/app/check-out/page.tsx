import { CheckOutForm } from '@/components/check-out-form'
import { TodayBanner } from '@/components/today-banner'

export default function CheckOutPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Check Out</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">Record your departure for the day</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
        <TodayBanner />
      </div>
      <CheckOutForm />
    </div>
  )
}
