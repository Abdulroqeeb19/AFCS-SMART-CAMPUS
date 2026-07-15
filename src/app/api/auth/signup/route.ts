import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { verifyCaptcha } from '../captcha/route'

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(`signup-get:${ip}`, 10, 60)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase.from('staff').select('id', { count: 'exact', head: true }).eq('role', 'commandant')
  return NextResponse.json({ commandantExists: (count ?? 0) > 0 })
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(`signup:${ip}`, 5, 300)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { email, password, fullName, staffId, role, captchaToken, captchaNonce, captchaAnswer } = body

    if (!email || !password || !fullName || !staffId || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!['commandant', 'admin', 'teacher'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    const pwError = validatePassword(password)
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 })
    }

    if (!captchaToken || !captchaNonce || !captchaAnswer || !verifyCaptcha(captchaToken, captchaNonce, captchaAnswer)) {
      return NextResponse.json({ error: 'Captcha verification failed. Please refresh and try again.' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminClient()

    // Commandant is restricted to the first signup only (with constraint-level protection)
    if (role === 'commandant') {
      const { count } = await adminSupabase.from('staff').select('id', { count: 'exact', head: true }).eq('role', 'commandant')
      if (count && count > 0) {
        return NextResponse.json({ error: 'A commandant already exists. Only one commandant account is allowed.' }, { status: 403 })
      }
    }

    // Use generic error messages to prevent enumeration
    const { data: existing, error: lookupError } = await adminSupabase
      .from('staff')
      .select('id')
      .or(`email.ilike.${email},staff_id.ilike.${staffId}`)
      .maybeSingle()

    if (lookupError) {
      console.error('Signup lookup error:', lookupError.message)
      return NextResponse.json({ error: 'Registration service unavailable' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: 'An account with this email or staff ID already exists' }, { status: 409 })
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      return NextResponse.json({ error: 'Account creation failed. Please try again.' }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Account creation failed' }, { status: 500 })
    }

    const { error: staffError } = await adminSupabase.from('staff').insert({
      staff_id: staffId,
      full_name: fullName,
      email,
      role,
      is_active: true,
    }).select().single()

    if (staffError) {
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return NextResponse.json({ error: 'Failed to create staff record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      autoSignedIn: !!authData.session,
    }, { status: 201 })

  } catch {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
