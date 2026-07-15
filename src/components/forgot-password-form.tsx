'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import {
  Shield, Loader2, AlertCircle, ChevronLeft, Mail, CheckCircle2,
} from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email is required'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send reset email')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md border-emerald-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-xl text-emerald-700">Check Your Email</CardTitle>
          <CardDescription>
            If an account exists with <strong>{email}</strong>, a password reset link has been sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-500 text-center">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button onClick={() => { setSent(false); setLoading(false) }} className="text-[#001A4D] underline hover:no-underline">
              try again
            </button>.
          </p>
          <Button onClick={() => window.location.href = '/login'} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to login
      </Link>

      <Card className="border-[#C5D1E8] shadow-lg shadow-blue-900/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#001A4D] shadow-lg shadow-blue-900/20">
            <Shield className="h-8 w-8 text-naf-gold" />
          </div>
          <CardTitle className="text-xl text-[#001A4D]">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your school email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="School Email"
              type="email"
              placeholder="you@afcs.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="email"
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
