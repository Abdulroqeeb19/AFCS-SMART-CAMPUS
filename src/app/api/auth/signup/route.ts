import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'node:crypto'

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || process.env.NEXTAUTH_SECRET || 'afcs-math-captcha-fallback'

function verifyMathCaptcha(token: string, answer: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', CAPTCHA_SECRET).update(answer.trim()).digest('hex')
    return expected === token
  } catch {
    return false
  }
}

export async function GET() {
  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase.from('staff').select('id', { count: 'exact', head: true }).eq('role', 'commandant')
  return NextResponse.json({ commandantExists: (count ?? 0) > 0 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName, staffId, role, captchaToken, captchaAnswer } = body

    if (!email || !password || !fullName || !staffId || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!['commandant', 'admin', 'teacher'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Verify math captcha
    if (!captchaToken || !captchaAnswer || !verifyMathCaptcha(captchaToken, captchaAnswer)) {
      return NextResponse.json({ error: 'Captcha verification failed — please refresh and try again' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    // Commandant is restricted to the first signup only
    if (role === 'commandant') {
      const { count } = await adminSupabase.from('staff').select('id', { count: 'exact', head: true }).eq('role', 'commandant')
      if (count && count > 0) {
        return NextResponse.json({ error: 'A commandant already exists. Only one commandant account is allowed.' }, { status: 403 })
      }
    }

    const { data: existingEmail } = await supabase.from('staff').select('id').ilike('email', email).maybeSingle()
    if (existingEmail) {
      return NextResponse.json({ error: 'A staff account with this email already exists' }, { status: 409 })
    }

    const { data: existingId } = await supabase.from('staff').select('id').ilike('staff_id', staffId).maybeSingle()
    if (existingId) {
      return NextResponse.json({ error: 'Staff ID already taken' }, { status: 409 })
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    const { data: staffData, error: staffError } = await adminSupabase.from('staff').insert({
      staff_id: staffId,
      full_name: fullName,
      email,
      role,
      is_active: true,
    }).select().single()

    if (staffError) {
      // Clean up orphan auth user
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return NextResponse.json({ error: 'Failed to create staff record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      autoSignedIn: !!authData.session,
    }, { status: 201 })

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
