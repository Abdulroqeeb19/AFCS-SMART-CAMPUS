import { ReportsContent } from './reports-content'

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reports Center</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">Task assignment reports, attendance logs, and daily summaries for auditing</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
          <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
          <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
          <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
        </div>
      </div>
      <ReportsContent />
    </div>
  )
}
