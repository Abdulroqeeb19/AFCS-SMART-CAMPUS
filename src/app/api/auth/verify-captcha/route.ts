import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token required' }, { status: 400 })
  }

  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    // No secret configured — bypass verification in dev mode
    return NextResponse.json({ success: true, bypass: true })
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })

    const data = await res.json()

    return NextResponse.json({
      success: data.success,
      error: data['error-codes']?.[0],
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Verification service unavailable' }, { status: 503 })
  }
}
