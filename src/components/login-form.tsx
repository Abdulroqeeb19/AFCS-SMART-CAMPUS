'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import Link from 'next/link'
import {
  Shield, Loader2, AlertCircle, Eye, EyeOff, LogIn, ChevronRight,
} from 'lucide-react'

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Email or Staff ID is required'); return }
    if (!password.trim()) { setError('Password is required'); return }

    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <Card className="border-[#C5D1E8] shadow-lg shadow-blue-900/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#001A4D] shadow-lg shadow-blue-900/20">
            <Shield className="h-8 w-8 text-naf-gold" />
          </div>
          <CardTitle className="text-xl text-[#001A4D]">
            AFCS Smart Campus
          </CardTitle>
          <CardDescription>
            Air Force Comprehensive School, Igbara-Oke
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-1.5 w-6 rounded-full bg-[#001A4D]" />
            <span className="h-1.5 w-6 rounded-full bg-[#C9A84C]" />
            <span className="h-1.5 w-6 rounded-full bg-[#E03C31]" />
            <span className="h-1.5 w-6 rounded-full bg-[#008751]" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email or Staff ID"
              type="text"
              placeholder="you@afcs.edu.ng or AFC/001"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              autoComplete="username"
            />

            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-xs text-zinc-400 text-center mt-4">
            Use your school-registered email or Staff ID.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[#C9A84C]/40 bg-[#E8D48B]/10 px-5 py-3.5 text-sm font-medium text-[#001A4D] hover:bg-[#E8D48B]/20 hover:border-[#C9A84C]/60 transition-all"
        >
          <Shield className="h-4 w-4 text-naf-gold" />
          <span>New Commandant or Admin? <strong>Create Account</strong></span>
          <ChevronRight className="h-4 w-4 text-naf-gold" />
        </Link>
      </div>
    </div>
  )
}
