import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth-utils'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase, request)
  if (!admin) return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })

  const adminSupabase = createAdminClient()
  const results: string[] = []

  // Create JS3 classes
  const js3Classes = [
    { name: 'JS3', arm: 'A' },
    { name: 'JS3', arm: 'B' },
    { name: 'JS3', arm: 'C' },
  ]

  for (const cls of js3Classes) {
    const { error } = await adminSupabase
      .from('classes')
      .upsert(cls, { onConflict: 'name,arm', ignoreDuplicates: true })
    if (error) {
      results.push(`FAIL class ${cls.name} ${cls.arm}: ${error.message}`)
    } else {
      results.push(`OK class ${cls.name} ${cls.arm}`)
    }
  }

  // 5 sample students
  const students = [
    { student_id: 'STU-0021', full_name: 'Ogunbiyi Tolani', class_name: 'JS3', class_arm: 'A', parent_name: 'Mr. Ogunbiyi', parent_phone: '+2348012345721' },
    { student_id: 'STU-0022', full_name: 'Ezechi Nneka', class_name: 'JS3', class_arm: 'A', parent_name: 'Dr. Ezechi', parent_phone: '+2348012345722' },
    { student_id: 'STU-0023', full_name: 'Abdulsalam Ibrahim', class_name: 'JS3', class_arm: 'A', parent_name: 'Alh. Abdulsalam', parent_phone: '+2348012345723' },
    { student_id: 'STU-0024', full_name: 'Afolabi Yetunde', class_name: 'JS3', class_arm: 'B', parent_name: 'Mrs. Afolabi', parent_phone: '+2348012345724' },
    { student_id: 'STU-0025', full_name: 'Okoro Emmanuel', class_name: 'JS3', class_arm: 'B', parent_name: 'Chief Okoro', parent_phone: '+2348012345725' },
  ]

  for (const s of students) {
    const { data: cls } = await adminSupabase
      .from('classes')
      .select('id')
      .eq('name', s.class_name)
      .eq('arm', s.class_arm)
      .single()

    if (!cls) {
      results.push(`FAIL student ${s.student_id}: class ${s.class_name} ${s.class_arm} not found`)
      continue
    }

    const { error } = await adminSupabase
      .from('students')
      .upsert({
        student_id: s.student_id,
        full_name: s.full_name,
        class_id: cls.id,
        parent_name: s.parent_name,
        parent_phone: s.parent_phone,
        is_active: true,
      }, { onConflict: 'student_id', ignoreDuplicates: true })

    if (error) {
      results.push(`FAIL student ${s.student_id}: ${error.message}`)
    } else {
      results.push(`OK student ${s.student_id} (${s.full_name})`)
    }
  }

  return NextResponse.json({ results })
}
