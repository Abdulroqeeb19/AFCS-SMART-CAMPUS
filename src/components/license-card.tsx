'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, AlertTriangle, XCircle, Calendar, Key, ExternalLink } from 'lucide-react'

interface LicenseInfo {
  license_key: string | null
  tier: string | null
  school_name: string
  issued_at: string | null
  expires_at: string | null
  is_active: boolean
  features: string[]
  days_remaining: number
  is_expired: boolean
}

const TIER_BADGES: Record<string, { label: string; color: string }> = {
  essential: { label: 'Essential', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  professional: { label: 'Professional', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

export function LicenseCard() {
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [genTier, setGenTier] = useState('professional')
  const [genSchool, setGenSchool] = useState('')
  const [genYears, setGenYears] = useState(1)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/license')
      .then(r => r.json())
      .then(d => { setLicense(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const generateLicense = async () => {
    setMessage('')
    const res = await fetch('/api/license/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: genTier, school_name: genSchool || 'Air Force Comprehensive School', duration_years: genYears }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(typeof data.error === 'string' ? data.error : 'Failed to generate')
      return
    }
    setLicense(data)
    setMessage(`License generated! Key: ${data.license_key}`)
    setShowGenerate(false)
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 animate-pulse">
        <div className="h-5 w-40 bg-[var(--color-bg-muted)] rounded" />
      </div>
    )
  }

  const tierInfo = license?.tier ? TIER_BADGES[license.tier] || TIER_BADGES.essential : null
  const isExpired = license?.is_expired
  const expiringSoon = license && license.days_remaining > 0 && license.days_remaining <= 30

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--color-accent)]" />
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">License</h3>
          </div>
          {license?.license_key && (
            <button
              onClick={() => setShowGenerate(!showGenerate)}
              className="text-xs text-[var(--color-info)] hover:underline"
            >
              {showGenerate ? 'Cancel' : 'Generate New'}
            </button>
          )}
        </div>

        {!license?.license_key ? (
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-[var(--color-danger)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No License Found</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Generate a license key to enable all features</p>
            {!showGenerate ? (
              <button
                onClick={() => setShowGenerate(true)}
                className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-info)] text-white hover:brightness-90"
              >
                Generate License
              </button>
            ) : (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2 text-left">
                <select
                  value={genTier}
                  onChange={e => setGenTier(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-primary)]"
                >
                  <option value="essential">Essential</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <input
                  value={genSchool}
                  onChange={e => setGenSchool(e.target.value)}
                  placeholder="School name"
                  className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-primary)]"
                />
                <select
                  value={genYears}
                  onChange={e => setGenYears(Number(e.target.value))}
                  className="w-full text-xs px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-primary)]"
                >
                  {[1, 2, 3, 5].map(y => (
                    <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <button
                  onClick={generateLicense}
                  className="w-full py-1.5 text-xs font-medium rounded-lg bg-[var(--color-info)] text-white hover:brightness-90"
                >
                  <Key className="h-3 w-3 inline mr-1" /> Generate License Key
                </button>
                {message && (
                  <p className="text-xs text-[var(--color-text-secondary)] break-all">{message}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Status</span>
                {isExpired ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-danger)]">
                    <XCircle className="h-3 w-3" /> Expired
                  </span>
                ) : expiringSoon ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-warning)]">
                    <AlertTriangle className="h-3 w-3" /> Expiring in {license.days_remaining}d
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
                    <CheckCircle className="h-3 w-3" /> Active ({license.days_remaining} days left)
                  </span>
                )}
              </div>

              {license.tier && tierInfo && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Tier</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierInfo.color}`}>{tierInfo.label}</span>
                </div>
              )}

              {license.school_name && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">School</span>
                  <span className="text-xs text-[var(--color-text-primary)]">{license.school_name}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">License Key</span>
                <code className="text-[10px] font-mono text-[var(--color-text-primary)] bg-[var(--color-bg-muted)] px-1.5 py-0.5 rounded">
                  {license.license_key?.substring(0, 16)}...
                </code>
              </div>

              {license.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Expires</span>
                  <span className="text-xs text-[var(--color-text-primary)]">
                    {new Date(license.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              {license.features.length > 0 && (
                <div className="pt-2 border-t border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-text-muted)] block mb-1.5">Included Features</span>
                  <div className="flex flex-wrap gap-1">
                    {license.features.map(f => (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] capitalize">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isExpired && (
              <div className="mt-3 p-2 rounded bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <p className="text-xs text-[var(--color-danger)] text-center">
                  License expired. Some features may be restricted.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
