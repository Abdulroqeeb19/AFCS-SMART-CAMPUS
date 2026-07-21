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
      <Card className="border-[var(--color-border-light)] shadow-lg shadow-black/5">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-sidebar)] shadow-lg shadow-black/10">
            <Shield className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <CardTitle className="text-xl text-[var(--color-text-primary)]">
            AFCS Smart Campus
          </CardTitle>
          <CardDescription>
            Air Force Comprehensive School
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-1.5 w-6 rounded-full bg-[var(--color-bg-sidebar)]" />
            <span className="h-1.5 w-6 rounded-full bg-[var(--color-accent)]" />
            <span className="h-1.5 w-6 rounded-full bg-[var(--color-danger)]" />
            <span className="h-1.5 w-6 rounded-full bg-[var(--color-success)]" />
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
                className="absolute right-3 top-[38px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-[var(--color-danger)] mt-0.5 shrink-0" />
                <span className="text-[var(--color-danger)]">{error}</span>
              </div>
            )}

            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-xs text-[var(--color-text-muted)] text-center mt-4">
            Use your school-registered email or Staff ID.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-[var(--color-accent)]/40 bg-[var(--color-accent-light)]/10 px-5 py-3.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)]/20 hover:border-[var(--color-accent)]/60 transition-all"
        >
          <Shield className="h-4 w-4 text-[var(--color-accent)]" />
          <span>New Commandant or Admin? <strong>Create Account</strong></span>
          <ChevronRight className="h-4 w-4 text-[var(--color-accent)]" />
        </Link>
      </div>
    </div>
  )
}
