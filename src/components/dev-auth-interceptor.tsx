"use client";

import { useEffect } from 'react'
import { DEV_SESSION_KEY } from '@/contexts/auth-context'

export function DevAuthInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return

    const originalFetch = window.fetch.bind(window)
    window.fetch = (input, init = {}) => {
      try {
        const raw = localStorage.getItem(DEV_SESSION_KEY)
        if (raw) {
          const staff = JSON.parse(raw)
          if (staff?.email) {
            const headers = new Headers(init.headers)
            headers.set('x-auth-email', staff.email)
            init.headers = headers
          }
        }
      } catch {}
      return originalFetch(input, init)
    }
    return () => { window.fetch = originalFetch }
  }, [])

  return null
}
