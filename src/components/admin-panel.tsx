'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Pencil, X, Check, Loader2 } from 'lucide-react'

interface AdminPanelProps {
  onSave: (value: string) => Promise<void>
  currentValue: string
  label: string
  type?: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
}

export function AdminEditable({
  onSave,
  currentValue,
  type = 'text',
  options,
}: AdminPanelProps) {
  const { isAdminOrCommandant } = useAuth()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentValue)
  const [saving, setSaving] = useState(false)

  if (!isAdminOrCommandant) {
    return <span>{currentValue}</span>
  }

  if (!editing) {
    return (
      <div className="group relative inline-flex items-center gap-1">
        <span>{currentValue}</span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--color-info)]/20 text-[var(--color-info)]"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'select' && options ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm border border-[var(--color-info)]/40 rounded px-1 py-0.5 bg-[var(--color-info)]/10"
          disabled={saving}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm border border-[var(--color-info)]/40 rounded px-1 py-0.5 bg-[var(--color-info)]/10 w-32"
          disabled={saving}
        />
      )}
      <button onClick={handleSave} className="p-0.5 rounded hover:bg-[var(--color-success)]/20 text-[var(--color-success)]" disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </button>
      <button onClick={() => { setEditing(false); setValue(currentValue) }} className="p-0.5 rounded hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)]">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
