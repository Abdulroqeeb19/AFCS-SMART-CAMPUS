'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Printer, ClipboardList, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { NotificationQueue } from '@/lib/database.types'

export default function PrintQueuePage() {
  const [items, setItems] = useState<(NotificationQueue & { staff?: { full_name: string; staff_id: string } })[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: queued } = await supabase
        .from('notification_queue')
        .select('*, staff:recipient_id(full_name, staff_id)')
        .order('created_at', { ascending: true })
        .limit(100)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (queued) setItems(queued as any)
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  const pending = items.filter(i => i.status === 'pending')
  const sent = items.filter(i => i.status === 'sent')
  const failed = items.filter(i => i.status === 'failed')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Print Queue</h1>
          <p className="text-sm text-zinc-500">
            Offline notification queue for notice board distribution
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#001A4D] text-white px-4 py-2 text-sm font-medium hover:bg-[#002266] transition-colors print:hidden"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <ClipboardList className="h-5 w-5" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold mt-1">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Sent</span>
          </div>
          <p className="text-2xl font-bold mt-1">{sent.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Failed</span>
          </div>
          <p className="text-2xl font-bold mt-1">{failed.length}</p>
        </div>
      </div>

      {/* Printable table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden print:border-none">
        <table className="w-full text-sm print:text-xs">
          <thead>
            <tr className="bg-zinc-50 print:bg-white border-b border-zinc-200">
              <th className="text-left px-4 py-2 font-medium text-zinc-600">#</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Staff</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Channel</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Type</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Status</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Message</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600 print:hidden">Retries</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-400">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications in queue</p>
                </td>
              </tr>
            )}
            {items.map((item, i) => (
              <tr key={item.id} className="border-b border-zinc-100">
                <td className="px-4 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">
                  {item.staff?.full_name || item.recipient_name || 'Unknown'}
                  <span className="text-xs text-zinc-400 block">{item.staff?.staff_id}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                    item.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                    'bg-zinc-100 text-zinc-700'
                  }`}>
                    {item.channel}
                  </span>
                </td>
                <td className="px-4 py-2 text-zinc-600">{item.message_type}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'sent' ? 'bg-green-100 text-green-700' :
                    item.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-2 max-w-xs truncate text-zinc-500">
                  {item.last_error || item.message_body.slice(0, 80)}...
                </td>
                <td className="px-4 py-2 text-zinc-500 print:hidden">{item.retry_count}/{item.max_retries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400 text-center print:block hidden">
        AFCS Smart Campus - Notification Print Queue - Generated {new Date().toLocaleDateString()}
      </p>
    </div>
  )
}
