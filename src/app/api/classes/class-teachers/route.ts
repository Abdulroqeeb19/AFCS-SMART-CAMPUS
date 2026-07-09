import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('classes')
    .select('class_teacher_id')
    .not('class_teacher_id', 'is', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = [...new Set(data.map((r) => r.class_teacher_id))]
  return NextResponse.json(ids)
}
