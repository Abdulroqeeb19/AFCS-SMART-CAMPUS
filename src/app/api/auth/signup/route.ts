import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName, staffId, role } = body

    if (!email || !password || !fullName || !staffId || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!['commandant', 'admin', 'teacher'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Only commandant, admin, and teacher can sign up.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: existingEmail } = await supabase.from('staff').select('id').eq('email', email).single()
    if (existingEmail) {
      return NextResponse.json({ error: 'A staff account with this email already exists' }, { status: 409 })
    }

    const { data: existingId } = await supabase.from('staff').select('id').eq('staff_id', staffId).single()
    if (existingId) {
      return NextResponse.json({ error: 'Staff ID already taken' }, { status: 409 })
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    const { data: staffData, error: staffError } = await supabase.from('staff').insert({
      staff_id: staffId,
      full_name: fullName,
      email,
      role,
      is_active: true,
    }).select().single()

    if (staffError) {
      return NextResponse.json({ error: staffError.message + ' — Auth user was created but staff record failed. Contact an administrator.' }, { status: 500 })
    }

    const session = authData.session
    return NextResponse.json({
      success: true,
      user: authData.user,
      staff: staffData,
      autoSignedIn: !!session,
    }, { status: 201 })

  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal server error' }, { status: 500 })
  }
}
