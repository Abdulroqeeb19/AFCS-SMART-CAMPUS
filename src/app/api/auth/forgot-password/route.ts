import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limit = await rateLimit(`forgot-password:${ip}`, 3, 300)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const body = await request.json()
  const { email } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host')
    || request.headers.get('host')
    || process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '')
    || 'localhost:3000'

  const redirectTo = `${proto}://${host}/reset-password`

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  })

  if (error) {
    console.error('Password reset error:', error.message)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
