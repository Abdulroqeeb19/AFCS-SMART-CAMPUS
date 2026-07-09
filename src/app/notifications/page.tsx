'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, ChevronLeft, CheckCircle, XCircle, Clock, Smartphone, Printer, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface NotificationLog {
  id: string
  recipient_name: string | null
  recipient_phone: string | null
  message_type: string
  message_body: string
  status: string
  sent_at: string | null
  created_at: string
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [configStatus, setConfigStatus] = useState<string>('checking')
  const [smsStatus, setSmsStatus] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setLogs(data)

      const res = await fetch('/api/notify/status')
      const info = await res.json()
      setConfigStatus(info.status)
      setSmsStatus(info.channels?.sms ?? false)

      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Shield className="w-6 h-6 text-[#C9A84C]" />
          <h1 className="text-lg font-semibold text-[#001A4D]">Notification History</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Status card */}
        <div className="bg-white rounded-lg border p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <Smartphone className={`w-5 h-5 ${configStatus === 'configured' ? 'text-[#008751]' : configStatus === 'partial' ? 'text-[#C9A84C]' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-600">
              WhatsApp: {configStatus === 'configured' ? '✅ Connected' : configStatus === 'partial' ? '⚠️ Partially configured' : '⛔ Not configured'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">
              SMS: {smsStatus ? '✅ Configured' : '⛔ Not configured (set TERMII_API_KEY or AFRICAS_TALKING_API_KEY)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications/print" className="inline-flex items-center gap-2 text-sm text-[#001A4D] hover:underline font-medium">
              <Printer className="w-4 h-4" /> Print Queue
            </Link>
            <span className="text-xs text-gray-400 ml-auto">
              {logs.length} notification{logs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No notifications sent yet</p>
            <p className="text-sm mt-1">Notifications are sent automatically when duties are generated or tasks are assigned.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg border p-4 flex items-start gap-3">
                <div className="mt-0.5">
                  {log.status === 'sent' ? (
                    <CheckCircle className="w-5 h-5 text-[#008751]" />
                  ) : log.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-[#E03C31]" />
                  ) : (
                    <Clock className="w-5 h-5 text-[#C9A84C]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{log.recipient_name || 'Unknown'}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{log.message_type.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      log.status === 'sent' ? 'bg-green-50 text-[#008751]' : log.status === 'failed' ? 'bg-red-50 text-[#E03C31]' : 'bg-yellow-50 text-[#C9A84C]'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{log.message_body}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{log.recipient_phone || 'No phone'}</span>
                    {log.sent_at && <span>{new Date(log.sent_at).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
