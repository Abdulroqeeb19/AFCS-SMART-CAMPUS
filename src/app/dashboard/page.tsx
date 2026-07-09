import { DashboardContent } from './dashboard-content'
import { ErrorBoundary } from '@/components/error-boundary'
import { AiAssistant } from '@/components/ai-assistant'

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Commandant Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Unified staff & student attendance intelligence
        </p>
      </div>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
      <AiAssistant />
    </div>
  )
}
