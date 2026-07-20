'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, XCircle, X } from 'lucide-react'

export function LicenseBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [status, setStatus] = useState<{ is_expired: boolean; days_remaining: number; tier: string | null; free: boolean } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/license')
      .then(r => r.json())
      .then(d => {
        if (d.free) {
          setStatus({ is_expired: false, days_remaining: d.days_remaining, tier: null, free: true })
        } else if (d.license_key) {
          setStatus({ is_expired: d.is_expired, days_remaining: d.days_remaining, tier: d.tier, free: false })
        } else {
          setStatus({ is_expired: true, days_remaining: 0, tier: null, free: false })
        }
      })
      .catch(() => {})
  }, [])

  if (!status || dismissed) return null

  const isExpired = status.is_expired
  const expiringSoon = !isExpired && status.days_remaining <= 30
  const isFree = status.free

  if (isFree && !expiringSoon) return null

  if (isFree && expiringSoon) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/20">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
        <p className="text-xs text-[var(--color-warning)] flex-1">Free access ends in {status.days_remaining} day{status.days_remaining !== 1 ? 's' : ''}. Contact admin to renew.</p>
        <button onClick={() => setDismissed(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (!status.tier && !isFree) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--color-danger)]/10 border-b border-[var(--color-danger)]/20">
        <XCircle className="h-3.5 w-3.5 shrink-0 text-[var(--color-danger)]" />
        <p className="text-xs text-[var(--color-danger)] flex-1">No license key found. Go to Settings to generate one.</p>
        <button onClick={() => setDismissed(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  if (isExpired) {
    router.push('/license-locked')
    return null
  }

  if (expiringSoon) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/20">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" />
        <p className="text-xs text-[var(--color-warning)] flex-1">License expires in {status.days_remaining} day{status.days_remaining !== 1 ? 's' : ''}. Renew to avoid disruption.</p>
        <button onClick={() => setDismissed(true)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return null
}
