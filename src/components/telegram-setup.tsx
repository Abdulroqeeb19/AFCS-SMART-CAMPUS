'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Loader2, Send, CheckCircle2, AlertCircle, MessageCircle, ExternalLink, Bell } from 'lucide-react'

export function TelegramSetup() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle')
  const [mode, setMode] = useState<'webhook' | 'polling'>('polling')
  const [botInfo, setBotInfo] = useState<{ configured: boolean; webhook: string | null; error: string | null; mode?: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/telegram/config')
      const data = await res.json()
      setBotInfo(data)
      setStatus(data.configured ? 'connected' : 'idle')
      setMode(data.mode === 'webhook' ? 'webhook' : 'polling')
    } catch {}
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  // Poll for Telegram messages every 10 seconds when in polling mode
  useEffect(() => {
    if (status === 'connected' && mode === 'polling') {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/telegram/poll', { method: 'POST' })
          const data = await res.json()
          if (data.processed > 0) setPollCount((c) => c + data.processed)
        } catch {}
      }, 10000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [status, mode])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')

    try {
      const body: Record<string, string> = { token }

      if (isHttps) {
        const baseUrl = window.location.origin
        body.webhookUrl = `${baseUrl}/api/telegram/webhook`
      }

      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await res.json()
      if (!res.ok) {
        setSaveError(result.error || 'Failed to configure')
        setStatus('error')
      } else {
        setStatus('connected')
        setMode(result.mode === 'webhook' ? 'webhook' : 'polling')
        setBotInfo({ configured: true, webhook: result.webhook || null, error: null, mode: result.mode })
      }
    } catch {
      setSaveError('Network error')
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-zinc-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base text-[#001A4D]">Telegram Bot</CardTitle>
          </div>
          <Badge variant={status === 'connected' ? 'success' : status === 'error' ? 'danger' : 'default'} className="text-[10px]">
            {status === 'connected' ? (mode === 'webhook' ? 'Webhook' : 'Polling') : status === 'error' ? 'Error' : 'Off'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Free notifications via Telegram. No Meta/Facebook needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'connected' && botInfo?.configured ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Telegram Bot Active</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Mode: {mode === 'webhook' ? 'Webhook (instant)' : 'Polling (checks every 10s)'}
                </p>
                {pollCount > 0 && (
                  <p className="text-xs text-green-500 mt-0.5">{pollCount} messages processed</p>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
              <p className="text-sm font-medium text-blue-800">Staff Setup Instructions</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal ml-4">
                <li>Search for your bot on Telegram and start a chat</li>
                <li>Send: <code className="bg-blue-100 px-1 rounded">/link YOUR_STAFF_ID YOUR_EMAIL</code></li>
                <li><strong>Your correct staff ID is <code className="bg-blue-100 px-1 rounded">AFC-0016</code> (for dewaleprotocols@gmail.com)</strong></li>
                <li>Full example: <code className="bg-blue-100 px-1 rounded">/link AFC-0016 dewaleprotocols@gmail.com</code></li>
                <li>The bot will confirm: <em>✅ Linked! You'll now receive notifications here...</em></li>
              </ol>
            </div>

            <Button size="sm" variant="outline" className="gap-1.5" disabled={testing}
              onClick={async () => {
                setTesting(true)
                setTestResult(null)
                try {
                  const res = await fetch('/api/telegram/test', { method: 'POST' })
                  const data = await res.json()
                  setTestResult(data.success ? 'sent' : data.error || 'Failed')
                } catch {
                  setTestResult('Network error')
                } finally {
                  setTesting(false)
                }
              }}>
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
              Send Test Notification
            </Button>
            {testResult === 'sent' && (
              <p className="text-xs text-emerald-600">✅ Test sent! Check your Telegram.</p>
            )}
            {testResult && testResult !== 'sent' && (
              <p className="text-xs text-red-600">❌ {testResult}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1 block">
                Bot Token (from @BotFather)
              </label>
              <Input
                type="password"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Don&apos;t have a bot?{' '}
              <a
                href="https://t.me/botfather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Create one on Telegram <ExternalLink className="h-3 w-3" />
              </a>
            </p>

            {!isHttps && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Localhost detected.</strong> Using polling mode (checks for messages every 10s).
                  For instant delivery in production, deploy to an HTTPS URL.
                </p>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {saveError}
              </div>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving || !token.trim()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Save Token
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
