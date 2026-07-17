"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Staff } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: Staff | null
  loading: boolean
  isAdmin: boolean
  isCommandant: boolean
  isAdminOrCommandant: boolean
  authenticated: boolean
  isDevMode: boolean
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>
  devSignIn: (staff: Staff) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  isCommandant: false,
  isAdminOrCommandant: false,
  authenticated: false,
  isDevMode: false,
  signIn: async () => ({}),
  devSignIn: () => {},
  signOut: async () => {},
})

export const DEV_SESSION_KEY = 'afcs_dev_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
  const router = useRouter()

  const fetchStaff = async (identifier: string) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch('/api/auth/lookup-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) return null
      const { staff } = await res.json()
      return staff as Staff | null
    } catch {
      return null
    }
  }

  const fetchStaffByEmail = async (email: string) => {
    try {
      const supabase = createClient()
      const data: Staff | null = await Promise.race([
        supabase.from('staff').select('*').ilike('email', email).eq('is_active', true).maybeSingle().then(r => r.data as Staff | null),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ])
      return data
    } catch {
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    function finish(user: Staff | null) {
      if (!mounted) return
      setUser(user)
      setLoading(false)
    }

    // Check for tester/dev session first
    try {
      const stored = localStorage.getItem(DEV_SESSION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Staff
        if (parsed.email && isDevMode) {
          setUser(parsed)
          ;(async () => {
            try {
              const supabase = createClient()
              const { data } = await supabase
                .from('staff').select('*').ilike('email', parsed.email).eq('is_active', true).maybeSingle()
              if (!mounted) return
              if (data) {
                setUser(data as Staff)
              } else {
                localStorage.removeItem(DEV_SESSION_KEY)
                setUser(null)
              }
              setLoading(false)
            } catch {
              if (mounted) setLoading(false)
            }
          })()
          return
        }
        finish(parsed)
        return
      }
    } catch {
      localStorage.removeItem(DEV_SESSION_KEY)
    }

    const safetyTimer = setTimeout(() => { if (mounted) setLoading(false) }, 15000)

    // Fall back to Supabase Auth
    let supabase
    try {
      supabase = createClient()
    } catch {
      if (mounted) setLoading(false)
      return
    }

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return
        clearTimeout(safetyTimer)
        try {
          if (session?.user?.email) {
            const staff = await fetchStaffByEmail(session.user.email)
            if (mounted) setUser(staff)
          }
        } catch {
          // staff lookup failed — proceed without user
        }
        if (mounted) setLoading(false)
      })
      .catch(() => { if (mounted) { clearTimeout(safetyTimer); setLoading(false) } })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (session?.user?.email && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        fetchStaffByEmail(session.user.email).then(staff => {
          if (mounted) setUser(staff)
        }).catch(() => {})
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null)
      }
    })

    return () => { mounted = false; clearTimeout(safetyTimer); listener?.subscription.unsubscribe() }
  }, [isDevMode])

  const role = user?.role
  const isAdmin = role === 'admin'
  const isCommandant = role === 'commandant'
  const isAdminOrCommandant = isAdmin || isCommandant
  const authenticated = !!user

  const signIn = async (identifier: string, password: string) => {
    const supabase = createClient()

    const staff = await fetchStaff(identifier)
    if (!staff) {
      return { error: 'No staff account found with that email or Staff ID.' }
    }

    try {
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email: staff.email, password }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Login request timed out. Check your network and try again.')), 30000)
        ),
      ])
      if (error) {
        if (error.message.includes('Invalid login') || error.message.includes('InvalidLoginCredentials')) {
          return { error: 'Incorrect password. Try again.' }
        }
        return { error: error.message }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('timed out')) {
        return { error: e.message }
      }
      return { error: 'Login failed. Please try again.' }
    }

    setUser(staff)
    if (staff.role === 'admin') {
      router.push('/admin')
    } else if (staff.role === 'teacher') {
      router.push('/teacher-dashboard')
    } else {
      router.push('/dashboard')
    }
    return {}
  }

  const devSignIn = (staff: Staff) => {
    localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(staff))
    setUser(staff)
    if (staff.role === 'admin') {
      router.push('/admin')
    } else if (staff.role === 'teacher') {
      router.push('/teacher-dashboard')
    } else {
      router.push('/dashboard')
    }
  }

  const signOut = async () => {
    localStorage.removeItem(DEV_SESSION_KEY)
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user, loading, isAdmin, isCommandant, isAdminOrCommandant,
        authenticated, isDevMode, signIn, devSignIn, signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
