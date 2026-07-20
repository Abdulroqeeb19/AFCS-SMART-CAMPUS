'use client'

import { CollapsibleSection } from '@/components/collapsible-section'
import { useState, useEffect, type ComponentType } from 'react'
import { Hint } from '@/components/hint'
import {
  Smartphone, Clock, Bell, Loader2,
  ToggleLeft, ToggleRight, MessageCircle, Printer, Play,
} from 'lucide-react'

interface Rule {
  id: string
  key: string
  label: string
  description: string | null
  channel: string
  is_active: boolean
  cron_schedule: string | null
  last_run_at: string | null
  config: Record<string, unknown>
}

const CHANNEL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  telegram: MessageCircle,
  whatsapp: Smartphone,
  sms: MessageCircle,
  print: Printer,
  system: Bell,
}

const SCHEDULE_LABELS: Record<string, string> = {
  duty_roster_notify: '06:30 daily',
  checkin_reminder: '08:30 weekdays',
  absentee_alert: '10:00 weekdays',
  next_period_notify: 'Every period change',
  daily_summary_broadcast: '14:00 weekdays',
  assembly_talk_reminder: '07:00 Mon & Fri',
  assembly_discussion_reminder: '08:00 Mon & Fri',
  daily_report_reminder: '12:00 weekdays',
  duty_auto_assign: '06:00 weekdays',
  parade_auto_close: '14:30 weekdays',
  scheduled_broadcast_processor: 'Every 15 min',
  end_of_day_digest: '15:00 weekdays',
}

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [runStatus, setRunStatus] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/automation/rules')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRules(data)
      setError(null)
    } catch {
      setError('Failed to load automation rules. Make sure the API is available.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRules() }, [])

  const toggleRule = async (key: string, current: boolean) => {
    const newState = !current
    const res = await fetch('/api/automation/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, is_active: newState }),
    })
    if (res.ok) {
      setRules(prev => prev.map(r => r.key === key ? { ...r, is_active: newState } : r))
    }
  }

  const testRule = async (key: string) => {
    const label = rules.find(r => r.key === key)?.label || key
    setRunStatus(`Testing "${label}"...`)
    setRunning(true)
    try {
      const res = await fetch('/api/automation/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: key }),
      })
      const data = await res.json()
      const result = data.results?.[0]
      if (result?.executed) {
        setRunStatus(`✅ "${label}" executed. ${result.sent ? `${result.sent} notifications sent.` : ''}`)
      } else {
        setRunStatus(`⏭️ "${label}" skipped: ${result?.error || 'no action needed'}`)
      }
    } catch {
      setRunStatus(`❌ Failed to test "${label}"`)
    } finally {
      setRunning(false)
      setTimeout(() => setRunStatus(null), 6000)
    }
  }

  const runAllActive = async () => {
    setRunStatus('⚙️ Running all active automations...')
    setRunning(true)
    try {
      const res = await fetch('/api/automation/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      const executed = data.results?.filter((r: any) => r.executed) || []
      if (executed.length) {
        setRunStatus(
          `✅ ${executed.length} rule(s) executed:\n` +
          executed.map((r: any) => `  • ${r.rule}${r.sent ? ` (${r.sent} sent)` : ''}`).join('\n')
        )
      } else {
        const skipped = data.results?.filter((r: any) => !r.executed) || []
        setRunStatus(`⏭️ No rules were due. ${skipped.length} rule(s) checked.`)
      }
    } catch {
      setRunStatus('❌ Engine run failed')
    } finally {
      setRunning(false)
      setTimeout(() => setRunStatus(null), 8000)
    }
  }

  const scheduleLabels: Record<string, string> = SCHEDULE_LABELS

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-primary)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-6 text-center">
          <p className="text-[var(--color-danger)]">{error}</p>
          <button onClick={fetchRules} className="mt-3 text-sm text-[var(--color-danger)] underline">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Automation Hub</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-1">
            All automations run on a schedule. Toggle rules on/off, test them, or run all due now.
            <Hint text="The automation engine runs every 5 minutes via Vercel Cron. Each rule checks if it's the right time/day before executing." side="right" />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAllActive}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-sidebar)] disabled:opacity-50 transition-colors"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run All Due
          </button>
        </div>
      </div>

      {/* Status bar */}
      {runStatus && (
        <div className="rounded-lg bg-[var(--color-info)]/10 border border-[var(--color-info)]/30 px-4 py-3 text-sm text-[var(--color-info)] whitespace-pre-line">
          {runStatus}
        </div>
      )}

      {/* Automation Rules */}
      <CollapsibleSection
        items={rules}
        keyExtractor={(rule) => rule.key}
        defaultVisible={5}
        className="space-y-3"
        renderItem={(rule) => {
          const Icon = CHANNEL_ICONS[rule.channel] || Bell
          return (
            <div className="bg-[var(--color-bg-card)] rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleRule(rule.key, rule.is_active)}
                  className={`shrink-0 mt-0.5 transition-colors ${rule.is_active ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}
                >
                  {rule.is_active ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[var(--color-text-primary)]">{rule.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.is_active ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {rule.description && <Hint text={rule.description} side="top" />}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{rule.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {rule.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {scheduleLabels[rule.key] || rule.cron_schedule || 'on demand'}
                    </span>
                    {rule.last_run_at && (
                      <span className="text-[var(--color-text-muted)]">
                        Last run: {new Date(rule.last_run_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => testRule(rule.key)}
                  disabled={running || !rule.is_active}
                  className="shrink-0 rounded-lg border border-[var(--color-border-hover)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Run Test
                </button>
              </div>
            </div>
          )
        }}
      />

      {/* Telegram automation commands */}
      <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm text-[var(--color-success)] flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> Control Automations via Telegram
        </h3>
        <div className="text-sm text-[var(--color-success)] space-y-1">
          <p>Admins can manage automations from Telegram:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
            <li><code className="bg-[var(--color-success)]/20 px-1 rounded">/automate</code> — Run all due automations now</li>
            <li><code className="bg-[var(--color-success)]/20 px-1 rounded">/automate rule_key</code> — Run a specific rule</li>
            <li><code className="bg-[var(--color-success)]/20 px-1 rounded">/automation list</code> — List all rules & status</li>
            <li><code className="bg-[var(--color-success)]/20 px-1 rounded">/automation toggle rule_key</code> — Enable/disable a rule</li>
            <li><code className="bg-[var(--color-success)]/20 px-1 rounded">/schedule YYYY-MM-DD HH:MM message</code> — Schedule a broadcast</li>
          </ul>
        </div>
      </div>

      {/* Scheduled broadcasts section */}
      <div className="bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20 rounded-lg p-4">
        <h3 className="font-medium text-sm text-[var(--color-accent)]/70 mb-2">📅 Scheduled Broadcasts</h3>
        <ScheduledBroadcastsList />
      </div>
    </div>
  )
}

function ScheduledBroadcastsList() {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/broadcasts/scheduled')
      .then(r => r.json())
      .then(d => setBroadcasts(d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-xs text-[var(--color-accent)]/70">Loading...</p>
  if (!broadcasts.length) return <p className="text-xs text-[var(--color-accent)]/70">No scheduled broadcasts.</p>

  return (
    <CollapsibleSection
      items={broadcasts}
      keyExtractor={(b: any) => b.id}
      defaultVisible={5}
      className="space-y-2"
      renderItem={(b: any) => (
        <div className="bg-[var(--color-bg-card)] rounded border border-purple-100 p-2.5 flex items-center justify-between">
          <div className="text-xs text-[var(--color-text-primary)]">
            <span className="font-medium">{b.title || 'Broadcast'}</span>
            {' — '}{b.content?.substring(0, 80)}{b.content?.length > 80 ? '…' : ''}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] shrink-0 ml-2">
            {new Date(b.scheduled_for).toLocaleDateString()} {new Date(b.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span className={`ml-2 px-1.5 py-0.5 rounded ${b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-[var(--color-success)]/20 text-[var(--color-success)]'}`}>
              {b.status}
            </span>
          </div>
        </div>
      )}
    />
  )
}
