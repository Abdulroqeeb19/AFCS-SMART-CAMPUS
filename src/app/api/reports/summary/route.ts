import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data: summary } = await supabase
    .from('report_summaries')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (summary) {
    return NextResponse.json(summary)
  }

  // Generate a simple summary from available data
  const today = new Date().toISOString().split('T')[0]

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('*, staff:staff_id(full_name)')
    .eq('date', today)

  const { data: attendance } = await supabase
    .from('staff_attendance')
    .select('status')
    .eq('date', today)

  const present = attendance?.filter((a) => a.status !== 'absent').length || 0
  const total = attendance?.length || 0

  return NextResponse.json({
    id: null,
    date: today,
    summary: reports?.length
      ? `${reports.length} staff submitted reports today. ${present}/${total} staff present.`
      : 'No reports submitted yet today.',
    ai_insights: {
      reports_submitted: reports?.length || 0,
      staff_present: present,
      total_staff: total,
    },
    generated_at: new Date().toISOString(),
  })
}
