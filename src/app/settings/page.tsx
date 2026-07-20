import { AuthGuard } from '@/components/auth-guard'
import { SettingsForm } from './settings-form'
import { TelegramSetup } from '@/components/telegram-setup'

export default function SettingsPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">System Settings</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
            Configure attendance rules and system parameters
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--color-success)]" />
          </div>
        </div>
        <TelegramSetup />
        <SettingsForm />
      </div>
    </AuthGuard>
  )
}
