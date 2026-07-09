import { AuthGuard } from '@/components/auth-guard'
import { SettingsForm } from './settings-form'
import { TelegramSetup } from '@/components/telegram-setup'

export default function SettingsPage() {
  return (
    <AuthGuard requiredRole="admin_or_commandant">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">System Settings</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Configure attendance rules and system parameters
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
            <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
            <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
            <span className="h-1 w-8 rounded-full bg-[#008751]" />
          </div>
        </div>
        <TelegramSetup />
        <SettingsForm />
      </div>
    </AuthGuard>
  )
}
