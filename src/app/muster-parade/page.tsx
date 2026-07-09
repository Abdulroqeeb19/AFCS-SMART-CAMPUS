import { MusterContent } from './muster-content'
import { TodayBanner } from '@/components/today-banner'

export default function MusterParadePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">Muster Parade</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Daily parade briefings, task tracking & acknowledgement</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
            <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
            <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
            <span className="h-1 w-8 rounded-full bg-[#008751]" />
          </div>
        </div>
        <TodayBanner />
      </div>
      <MusterContent />
    </div>
  )
}
