'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Printer, ClipboardList, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { NotificationQueue } from '@/lib/database.types'

export default function PrintQueuePage() {
  const [items, setItems] = useState<(NotificationQueue & { staff?: { full_name: string; staff_id: string } })[]>([])
  const [showAllItems, setShowAllItems] = useState(false)
  const displayItems = showAllItems ? items : items.slice(0, 5)
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
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Print Queue</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Offline notification queue for notice board distribution
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-blue-700)] transition-colors print:hidden"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-warning)]">
            <ClipboardList className="h-5 w-5" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold mt-1">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-success)]">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Sent</span>
          </div>
          <p className="text-2xl font-bold mt-1">{sent.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-danger)]">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Failed</span>
          </div>
          <p className="text-2xl font-bold mt-1">{failed.length}</p>
        </div>
      </div>

      {/* Printable table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden print:border-none">
        <table className="w-full text-sm print:text-xs">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)] print:bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">#</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">Staff</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">Channel</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">Type</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">Status</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">Message</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)] print:hidden">Retries</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications in queue</p>
                </td>
              </tr>
            )}
            {displayItems.map((item, i) => (
              <tr key={item.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-2 text-[var(--color-text-muted)]">{i + 1}</td>
                <td className="px-4 py-2 font-medium">
                  {item.staff?.full_name || item.recipient_name || 'Unknown'}
                  <span className="text-xs text-[var(--color-text-muted)] block">{item.staff?.staff_id}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.channel === 'whatsapp' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                    item.channel === 'sms' ? 'bg-[var(--color-info)]/20 text-[var(--color-info)]' :
                    'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]'
                  }`}>
                    {item.channel}
                  </span>
                </td>
                <td className="px-4 py-2 text-[var(--color-text-secondary)]">{item.message_type}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'sent' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' :
                    item.status === 'failed' ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]' :
                    'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-2 max-w-xs truncate text-[var(--color-text-secondary)]">
                  {item.last_error || item.message_body.slice(0, 80)}...
                </td>
                <td className="px-4 py-2 text-[var(--color-text-secondary)] print:hidden">{item.retry_count}/{item.max_retries}</td>
              </tr>
            ))}
          </tbody>
          {items.length > 5 && (
            <tfoot>
              <tr>
                <td colSpan={99} className="text-center py-2">
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="flex items-center gap-1 mx-auto py-1.5 px-3 text-xs font-medium text-[var(--color-info)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-lg transition-colors"
                  >
                    {showAllItems ? (
                      <>Show less</>
                    ) : (
                      <>Show {items.length - 5} more</>
                    )}
                  </button>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] text-center print:block hidden">
        AFCS Smart Campus - Notification Print Queue - Generated {new Date().toLocaleDateString()}
      </p>
    </div>
  )
}
