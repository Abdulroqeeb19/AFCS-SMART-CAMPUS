'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Key, Eye, EyeOff } from 'lucide-react'

export default function LicenseLockedPage() {
  const [freeDays, setFreeDays] = useState<number | null>(null)
  const [showActivation, setShowActivation] = useState(false)
  const [masterKey, setMasterKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    fetch('/api/license')
      .then(r => r.json())
      .then(d => {
        if (d.free) setFreeDays(d.days_remaining)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setShowActivation(prev => !prev)
        setMessage(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleActivate() {
    if (!masterKey.trim()) return
    setActivating(true)
    setMessage(null)
    try {
      const res = await fetch('/api/license/master-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_key: masterKey }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'License activated successfully! Redirecting...' })
        setTimeout(() => window.location.href = '/dashboard', 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Activation failed. Invalid key.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-[var(--color-danger)]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Access Locked</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
            The free access period{freeDays !== null ? ` (${freeDays} days remaining)` : ''} has ended.
            A valid license key is required to continue using AFCS Smart Campus.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 max-w-sm mx-auto">
            Please contact the system administrator to renew your license.
          </p>
        </div>

        {showActivation && (
          <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-3 text-left animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-medium text-[var(--color-text-primary)] uppercase tracking-wider">Master Activation</p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={masterKey}
                onChange={e => setMasterKey(e.target.value)}
                placeholder="Enter master activation key"
                onKeyDown={e => { if (e.key === 'Enter') handleActivate() }}
                className="w-full text-sm px-3 py-2 pr-10 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-info)]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleActivate}
              disabled={activating || !masterKey.trim()}
              className="w-full py-2 text-sm font-medium rounded-lg bg-[var(--color-info)] text-white hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {activating ? (
                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Key className="h-3.5 w-3.5" /> Activate License</>
              )}
            </button>
            {message && (
              <p className={`text-xs ${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--color-danger)]'}`}>
                {message.text}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-[var(--color-text-muted)] italic">
          AFCS Smart Campus &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
