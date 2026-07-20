'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Clock, Bell, QrCode, RefreshCw, Building2 } from 'lucide-react'
import { Skeleton } from '@/components/skeleton'

interface SystemSettings {
  cutoff_hour: number
  cutoff_minute: number
  closing_hour: number
  closing_minute: number
  school_name: string
  enable_whatsapp_notifications: boolean
  enable_qr_checkin: boolean
}

const defaults: SystemSettings = {
  cutoff_hour: 8,
  cutoff_minute: 0,
  closing_hour: 16,
  closing_minute: 0,
  school_name: 'Air Force Comprehensive School, Igbara-Oke',
  enable_whatsapp_notifications: false,
  enable_qr_checkin: true,
}

export function SettingsForm() {
  const [settings, setSettings] = useState<SystemSettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings({ ...defaults, ...data })
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-60 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--color-info)]" />
            <CardTitle>School Information</CardTitle>
          </div>
          <CardDescription>Configure your school name and operating hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="school-name"
            label="School Name"
            value={settings.school_name}
            onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="close-hour"
              label="Closing Hour (24h)"
              type="number"
              min={0}
              max={23}
              value={String(settings.closing_hour)}
              onChange={(e) => setSettings({ ...settings, closing_hour: parseInt(e.target.value) || 16 })}
            />
            <Input
              id="close-minute"
              label="Closing Minute"
              type="number"
              min={0}
              max={59}
              value={String(settings.closing_minute)}
              onChange={(e) => setSettings({ ...settings, closing_minute: parseInt(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-info)]" />
            <CardTitle>Attendance Rules</CardTitle>
          </div>
          <CardDescription>
            Configure cutoff times for automatic late detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="cutoff-hour"
              label="Late Cutoff Hour (24h)"
              type="number"
              min={0}
              max={23}
              value={String(settings.cutoff_hour)}
              onChange={(e) => setSettings({ ...settings, cutoff_hour: parseInt(e.target.value) || 8 })}
            />
            <Input
              id="cutoff-minute"
              label="Late Cutoff Minute"
              type="number"
              min={0}
              max={59}
              value={String(settings.cutoff_minute)}
              onChange={(e) => setSettings({ ...settings, cutoff_minute: parseInt(e.target.value) || 0 })}
            />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] rounded-lg px-3 py-2">
            Staff checking in after{' '}
            <strong>
              {String(settings.cutoff_hour).padStart(2, '0')}:
              {String(settings.cutoff_minute).padStart(2, '0')}
            </strong>{' '}
            will be automatically marked as <Badge variant="warning">Late</Badge>.
            Closing at{' '}
            <strong>
              {String(settings.closing_hour).padStart(2, '0')}:
              {String(settings.closing_minute).padStart(2, '0')}
            </strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-[var(--color-info)]" />
            <CardTitle>Check-In Methods</CardTitle>
          </div>
          <CardDescription>Enable or disable attendance capture methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg-hover)] cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Manual Staff ID Entry</p>
              <p className="text-xs text-[var(--color-text-muted)]">Staff type their ID to check in</p>
            </div>
            <input type="checkbox" checked className="h-4 w-4 text-[var(--color-info)] rounded border-[var(--color-border-hover)]" disabled />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg-hover)] cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">QR Code Scanning</p>
              <p className="text-xs text-[var(--color-text-muted)]">Staff scan their QR badge to check in</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_qr_checkin}
              onChange={(e) => setSettings({ ...settings, enable_qr_checkin: e.target.checked })}
              className="h-4 w-4 text-[var(--color-info)] rounded border-[var(--color-border-hover)]"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--color-info)]" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure automated alerts and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 hover:bg-[var(--color-bg-hover)] cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">WhatsApp Notifications</p>
              <p className="text-xs text-[var(--color-text-muted)]">Send attendance alerts via WhatsApp Cloud API</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_whatsapp_notifications}
              onChange={(e) => setSettings({ ...settings, enable_whatsapp_notifications: e.target.checked })}
              className="h-4 w-4 text-[var(--color-info)] rounded border-[var(--color-border-hover)]"
            />
          </label>
          <p className="text-xs text-[var(--color-text-muted)] italic">
            WhatsApp integration requires Make.com webhook setup. See documentation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[var(--color-info)]" />
            <CardTitle>Seed Data</CardTitle>
          </div>
          <CardDescription>Populate the database with sample staff records for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Run the migration SQL in <code className="text-xs bg-[var(--color-bg-muted)] px-1 py-0.5 rounded">src/db/migrations/001_staff_schema.sql</code>{' '}
            in your Supabase SQL editor to create the schema and departments.
            Then run <code className="text-xs bg-[var(--color-bg-muted)] px-1 py-0.5 rounded">src/db/migrations/002_seed_data.sql</code> for sample staff.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        {saved && (
          <Badge variant="success" className="animate-in fade-in">
            Settings saved successfully
          </Badge>
        )}
      </div>
    </div>
  )
}
