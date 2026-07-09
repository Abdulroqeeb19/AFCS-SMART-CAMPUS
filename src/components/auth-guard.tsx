'use client'

import { useAuth } from '@/contexts/auth-context'
import { Shield, Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'commandant' | 'admin_or_commandant' | 'admin_or_commandant_or_teacher' | 'teacher'
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { user, loading, isAdmin, isCommandant } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return (
      fallback ?? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-16 w-16 text-zinc-300 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-600">Authentication Required</h2>
          <p className="text-zinc-400 mt-1">Please sign in to access this page</p>
        </div>
      )
    )
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-600">Access Denied</h2>
        <p className="text-zinc-400 mt-1">This area is restricted to Administrators</p>
      </div>
    )
  }

  if (requiredRole === 'commandant' && !isCommandant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-600">Access Denied</h2>
        <p className="text-zinc-400 mt-1">This area is restricted to the Commandant</p>
      </div>
    )
  }

  if (requiredRole === 'admin_or_commandant' && !(isAdmin || isCommandant)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-600">Access Denied</h2>
        <p className="text-zinc-400 mt-1">This area is restricted to Administrators and the Commandant</p>
      </div>
    )
  }

  if (requiredRole === 'admin_or_commandant_or_teacher' && !(isAdmin || isCommandant || user?.role === 'teacher')) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-600">Access Denied</h2>
        <p className="text-zinc-400 mt-1">You do not have permission to access this page</p>
      </div>
    )
  }

  if (requiredRole === 'teacher' && user.role !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-600">Access Denied</h2>
        <p className="text-zinc-400 mt-1">This area is restricted to Teachers</p>
      </div>
    )
  }

  return <>{children}</>
}
