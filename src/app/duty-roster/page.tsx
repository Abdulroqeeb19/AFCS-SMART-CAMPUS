import { RosterContent } from './roster-content'
import { TodayBanner } from '@/components/today-banner'

export default function DutyRosterPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Duty Roster</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">Manage and track staff duty assignments</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
        <TodayBanner />
      </div>
      <RosterContent />
    </div>
  )
}
