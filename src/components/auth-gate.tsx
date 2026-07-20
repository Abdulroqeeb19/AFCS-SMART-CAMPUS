'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (loading) return

    if (!authenticated && !isPublic) {
      router.replace('/login')
      return
    }

    if (authenticated && isPublic) {
      const target =
        user?.role === 'admin'
          ? '/admin'
          : user?.role === 'teacher'
            ? '/teacher-dashboard'
            : '/dashboard'
      if (pathname !== target) {
        router.replace(target)
      }
    }
  }, [authenticated, loading, isPublic, router, pathname, user?.role])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-muted)]" />
      </div>
    )
  }

  if (!authenticated && !isPublic) return null
  if (authenticated && isPublic) return null

  return <>{children}</>
}
