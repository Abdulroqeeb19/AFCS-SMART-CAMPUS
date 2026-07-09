'use client'

import { useState, type ComponentType } from 'react'
import { Hint } from '@/components/hint'
import {
  Smartphone, Clock, Bell, Loader2,
  ToggleLeft, ToggleRight, MessageCircle, Printer,
} from 'lucide-react'

interface AutomationRule {
  id: string
  key: string
  label: string
  description: string
  enabled: boolean
  channel: string[]
  schedule: string
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: '1',
    key: 'checkin_reminder',
    label: 'Staff Check-In Reminder',
    description: 'Send WhatsApp/SMS reminder to staff who haven\'t checked in by 8:00 AM each day',
    enabled: false,
    channel: ['whatsapp', 'sms'],
    schedule: '07:45 daily',
  },
  {
    id: '2',
    key: 'checkout_reminder',
    label: 'Staff Check-Out Reminder',
    description: 'Remind staff to check out at closing time via WhatsApp or SMS',
    enabled: false,
    channel: ['whatsapp', 'sms'],
    schedule: '15:45 daily',
  },
  {
    id: '3',
    key: 'next_period_alert',
    label: 'Next Period Alert',
    description: 'Notify teachers 5 minutes before their next class period with subject, class, and room details',
    enabled: false,
    channel: ['whatsapp', 'sms'],
    schedule: 'Every period change',
  },
  {
    id: '4',
    key: 'duty_roster_notify',
    label: 'Duty Roster Assignment Alert',
    description: 'Auto-notify staff when duty rosters are generated — WhatsApp then SMS fallback',
    enabled: true,
    channel: ['whatsapp', 'sms'],
    schedule: 'On roster generation',
  },
  {
    id: '5',
    key: 'task_assigned',
    label: 'Task Assignment Notification',
    description: 'Notify staff immediately when parade tasks or assignments are created — WhatsApp then SMS fallback',
    enabled: true,
    channel: ['whatsapp', 'sms'],
    schedule: 'On task creation',
  },
  {
    id: '6',
    key: 'daily_summary',
    label: 'Daily Summary Broadcast',
    description: 'Send end-of-day attendance summary to commandant/admin with staff & student stats',
    enabled: false,
    channel: ['whatsapp', 'sms'],
    schedule: '16:00 daily',
  },
  {
    id: '7',
    key: 'absentee_alert',
    label: 'High Absentee Alert',
    description: 'Send SMS to commandant when staff or student absentee rate exceeds 20% (works on any phone)',
    enabled: false,
    channel: ['sms'],
    schedule: 'On threshold breach',
  },
  {
    id: '8',
    key: 'period_attendance',
    label: 'Period-by-Period Attendance',
    description: 'Each period, teachers with no class attendance recorded get a reminder',
    enabled: false,
    channel: ['whatsapp', 'sms'],
    schedule: 'Every period',
  },
]

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES)
  const [loading, setLoading] = useState(false)
  const [runStatus, setRunStatus] = useState<string | null>(null)

  const toggleRule = (key: string) => {
    setRules((prev) => prev.map((r) => r.key === key ? { ...r, enabled: !r.enabled } : r))
  }

  const testRule = async (key: string) => {
    setRunStatus(`Testing "${rules.find((r) => r.key === key)?.label}"...`)
    setLoading(true)

    if (key === 'next_period_alert') {
      const res = await fetch('/api/timetable/next-period', { method: 'POST' })
      const data = await res.json()
      setRunStatus(`Test result: ${data.sent}/${data.total} notifications sent. ${data.message || ''}`)
    } else if (key === 'duty_roster_notify' || key === 'task_assigned') {
      setRunStatus('Already active — these fire automatically when duties/tasks are assigned.')
    } else {
      setRunStatus('This automation requires a scheduled cron job (see documentation).')
    }

    setLoading(false)
    setTimeout(() => setRunStatus(null), 5000)
  }

  const runAllDue = async () => {
    setRunStatus('Running all active automations...')
    setLoading(true)
    const results: string[] = []
    for (const rule of rules) {
      if (!rule.enabled) continue
      if (rule.key === 'next_period_alert') {
        const res = await fetch('/api/timetable/next-period', { method: 'POST' })
        const data = await res.json()
        results.push(`${rule.label}: ${data.sent} sent`)
      }
    }
    setRunStatus(results.length ? results.join(' | ') : 'No active automations to run.')
    setLoading(false)
    setTimeout(() => setRunStatus(null), 8000)
  }

  const channelIcons: Record<string, ComponentType<{ className?: string }>> = {
    whatsapp: Smartphone,
    email: Bell,
    sms: MessageCircle,
    print: Printer,
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001A4D]">Automation Hub</h1>
          <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1">
            Configure which tasks are automated and sent via WhatsApp
            <Hint text="Each automation rule controls a specific recurring task. Toggle it on to activate, click Run Test to try it immediately. The system sends messages via your configured WhatsApp Business API." side="right" />
          </p>
        </div>
        <button
          onClick={runAllDue}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#001A4D] text-white px-4 py-2 text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Run Active Automations
        </button>
      </div>

      {/* Status bar */}
      {runStatus && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {runStatus}
        </div>
      )}

      {/* Automation Rules */}
      <div className="space-y-3">
        {rules.map((rule) => {
          const Icon = channelIcons[rule.channel[0]] || Bell
          return (
            <div key={rule.key} className="bg-white rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleRule(rule.key)}
                  className={`shrink-0 mt-0.5 transition-colors ${rule.enabled ? 'text-[#008751]' : 'text-zinc-300'}`}
                >
                  {rule.enabled ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-zinc-900">{rule.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                    <Hint text={rule.description} side="top" />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{rule.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {rule.channel.join(', ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rule.schedule}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => testRule(rule.key)}
                  disabled={loading || !rule.enabled}
                  className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Run Test
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Offline & Alternative Channels */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm text-green-800 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> No WhatsApp? No Smartphone? No Problem.
        </h3>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>SMS Gateway (Termii / Africa&apos;s Talking) — Works on Any Phone</strong></p>
          <p className="text-xs">
            When WhatsApp fails or a staff member has no smartphone, the system automatically falls
            back to SMS. Set <code className="bg-green-100 px-1 rounded">TERMII_API_KEY</code> or{' '}
            <code className="bg-green-100 px-1 rounded">AFRICAS_TALKING_API_KEY</code> in your .env.local.
            SMS messages are plain text (no emoji, no formatting) — every phone can receive them.
          </p>

          <p className="mt-3"><strong>Print Queue — For Notice Board Distribution</strong></p>
          <p className="text-xs">
            Even without SMS, every notification is queued in the{' '}
            <a href="/notifications/print" className="underline font-medium">Print Queue</a>.
            Print the queue and post it on the staff notice board. Useful for areas with zero network coverage.
          </p>

          <p className="mt-3"><strong>Channel Priority Order</strong></p>
          <p className="text-xs">
            1. WhatsApp Cloud API → 2. SMS (Termii/Africa&apos;s Talking) → 3. Queue + Retry (3 attempts) → 4. Print Queue
          </p>
        </div>
      </div>

      {/* Deployment Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm text-amber-800 flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> Deployment Guide — WhatsApp & Beyond
        </h3>
        <div className="text-sm text-amber-700 space-y-2">
          <p><strong>WhatsApp Cloud API (Meta) — Recommended for Production</strong></p>
          <p className="text-xs">
            All automations above can send via WhatsApp Business API. Messages display your school name as sender.
            Requires: Meta Business Account + approved phone number + permanent access token.
          </p>

          <p className="mt-3"><strong>Alternative Platforms for Notifications & Prompts</strong></p>
          <div className="grid gap-2 text-xs">
            <div className="bg-white rounded border border-amber-100 p-2.5">
              <strong>📱 Telegram Bot</strong> — Free, no approval needed. Create a bot via @BotFather, get an API token.
              Staff join a channel or receive DMs. Supports rich media, inline keyboards for check-in confirmation.
              <span className="block text-amber-500 mt-1">Best for: Instant setup, no business verification needed.</span>
            </div>
            <div className="bg-white rounded border border-amber-100 p-2.5">
              <strong>🔗 Make.com / n8n Webhooks</strong> — Already configured (MAKE_WEBHOOK_URL, N8N_WEBHOOK_URL).
              Connect to any messaging platform (WhatsApp, Telegram, SMS via Termii/AfricasTalking, Email).
              <span className="block text-amber-500 mt-1">Best for: Multi-channel delivery without code changes.</span>
            </div>
            <div className="bg-white rounded border border-amber-100 p-2.5">
              <strong>📲 PWA Mobile App</strong> — The Smart Campus site is already a Progressive Web App.
              Staff can &quot;Add to Home Screen&quot; on their phones for push notifications (coming in next phase).
              <span className="block text-amber-500 mt-1">Best for: Push notifications without app store deployment.</span>
            </div>
            <div className="bg-white rounded border border-amber-100 p-2.5">
              <strong>💬 SMS via Termii / AfricasTalking</strong> — Works on any phone, no smartphone required.
              Higher cost per message but guaranteed delivery. Integrates via the webhook system.
              <span className="block text-amber-500 mt-1">Best for: Staff without smartphones or WhatsApp access.</span>
            </div>
          </div>
        </div>
      </div>

      {/* How to schedule automations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-sm text-blue-800 mb-2">⏰ Scheduling Automations (Cron Jobs)</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p>These automations need a cron job service to run at scheduled times. Options:</p>
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            <li><strong>Vercel Cron Jobs</strong> (pro plan) — add a cron job calling <code className="bg-blue-100 px-1 rounded">POST /api/timetable/next-period</code></li>
            <li><strong>GitHub Actions</strong> — schedule a workflow that hits the API endpoints</li>
            <li><strong>EasyCron / cron-job.org</strong> — free external cron services that call your API</li>
            <li><strong>Make.com webhook</strong> — use the existing webhook URL with timer triggers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
