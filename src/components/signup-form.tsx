'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import {
  Shield, Loader2, AlertCircle, Eye, EyeOff, UserPlus, ChevronLeft, Crown, Calculator,
} from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [staffId, setStaffId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'commandant' | 'admin' | 'teacher'>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaNonce, setCaptchaNonce] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [commandantTaken, setCommandantTaken] = useState(false)
  const [checkingCommandant, setCheckingCommandant] = useState(true)

  function fetchCaptcha() {
    fetch('/api/auth/captcha').then(r => r.json()).then(data => {
      setCaptchaQuestion(data.question)
      setCaptchaToken(data.token)
      setCaptchaNonce(data.nonce)
      setCaptchaAnswer('')
    }).catch(() => {})
  }

  useEffect(() => {
    fetchCaptcha()
    fetch('/api/auth/signup').then(r => r.json()).then(data => {
      setCommandantTaken(data.commandantExists)
      if (data.commandantExists && role === 'commandant') setRole('admin')
    }).catch(() => {}).finally(() => setCheckingCommandant(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Full name is required'); return }
    if (!staffId.trim()) { setError('Staff ID is required'); return }
    if (!email.trim()) { setError('Email is required'); return }
    if (!password.trim()) { setError('Password is required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, staffId, role, captchaToken, captchaNonce, captchaAnswer }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      if (data.autoSignedIn) {
        router.push('/login?registered=true')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-emerald-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-xl text-emerald-700">Account Created</CardTitle>
          <CardDescription>
            Your {role === 'teacher' ? 'Class Teacher' : role === 'commandant' ? 'Commandant' : 'Admin'} account has been registered. Check your email to confirm your account before signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-600 text-center">
            <strong>{fullName}</strong><br />
            <span className="text-zinc-400">{staffId} · {role === 'teacher' ? 'Class Teacher' : role === 'commandant' ? 'Commandant' : 'Admin'}</span><br />
            <span className="text-zinc-400">{email}</span>
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Go to Login
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
            <UserPlus className="h-8 w-8 text-naf-gold" />
          </div>
          <CardTitle className="text-xl text-[#001A4D]">
            Create Account
          </CardTitle>
          <CardDescription>
            Register as Commandant, Admin or Class Teacher for AFCS Smart Campus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="fullName" label="Full Name" type="text"
              placeholder="Squadron Leader John Doe"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              autoFocus
            />

            <Input
              id="staffId" label="Staff ID" type="text"
              placeholder="AFC/001"
              value={staffId} onChange={(e) => setStaffId(e.target.value)}
              disabled={loading}
            />

            <Input
              id="email" label="School Email" type="email"
              placeholder="you@afcs.edu.ng"
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                id="password" label="Password" type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              id="confirmPassword" label="Confirm Password" type="password"
              placeholder="Repeat your password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => !commandantTaken && setRole('commandant')}
                  disabled={commandantTaken || checkingCommandant}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    commandantTaken && role !== 'commandant'
                      ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed line-through'
                      : role === 'commandant'
                      ? 'border-[#C9A84C] bg-amber-50 text-[#001A4D]'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                  }`}
                  title={commandantTaken ? 'A commandant already exists' : ''}
                >
                  <span className="inline-flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5" />
                    Commandant
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    role === 'admin'
                      ? 'border-[#C9A84C] bg-amber-50 text-[#001A4D]'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    role === 'teacher'
                      ? 'border-violet-500 bg-violet-50 text-violet-900'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  Class Teacher
                </button>
              </div>
              {commandantTaken && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <Crown className="h-3 w-3" /> Commandant already registered — role is no longer available
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-zinc-400" />
                Security Check
              </label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600 font-mono select-none">
                  {captchaQuestion || 'Loading...'}
                </div>
                <Input
                  id="captchaAnswer" type="text" placeholder="?"
                  value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)}
                  disabled={loading || !captchaQuestion}
                  className="w-20 text-center font-mono text-lg"
                />
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={loading}
                  className="rounded-lg border border-zinc-200 px-2.5 text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-colors disabled:opacity-50"
                  title="New question"
                >
                  ↻
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
