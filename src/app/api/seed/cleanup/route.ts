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

  // Delete attendance records for test students
  const { data: testStudents } = await adminSupabase
    .from('students')
    .select('id, student_id, full_name')
    .in('student_id', [
      'STU-0001','STU-0002','STU-0003','STU-0004','STU-0005',
      'STU-0006','STU-0007','STU-0008','STU-0009','STU-0010',
      'STU-0011','STU-0012','STU-0013','STU-0014','STU-0015',
      'STU-0016','STU-0017','STU-0018','STU-0019','STU-0020',
    ])

  if (testStudents && testStudents.length > 0) {
    const ids = testStudents.map(s => s.id)

    const { error: delAtt, count: attCount } = await adminSupabase
      .from('student_attendance')
      .delete({ count: 'exact' })
      .in('student_id', ids)

    if (delAtt) {
      results.push(`FAIL delete attendance: ${delAtt.message}`)
    } else {
      results.push(`OK deleted ${attCount ?? 0} attendance records`)
    }

    const { error: delStud, count: studCount } = await adminSupabase
      .from('students')
      .delete({ count: 'exact' })
      .in('id', ids)

    if (delStud) {
      results.push(`FAIL delete students: ${delStud.message}`)
    } else {
      results.push(`OK deleted ${studCount ?? 0} test students`)
    }
  } else {
    results.push('No test students found to delete')
  }

  return NextResponse.json({ results })
}
