import { CheckOutForm } from '@/components/check-out-form'
import { TodayBanner } from '@/components/today-banner'

export default function CheckOutPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">Check Out</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Record your departure for the day</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
            <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
            <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
            <span className="h-1 w-8 rounded-full bg-[#008751]" />
          </div>
        </div>
        <TodayBanner />
      </div>
      <CheckOutForm />
    </div>
  )
}
