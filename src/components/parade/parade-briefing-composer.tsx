'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ParadeBriefing } from '@/lib/database.types'
import { MessageSquare, Plus, Send } from 'lucide-react'

interface Props {
  briefings: ParadeBriefing[]
  paradeId: string
  onAdd: (briefing: { title: string; content: string; priority: string; category: string }) => void
}

const priorityConfig = {
  low: { label: 'Low', variant: 'default' as const },
  normal: { label: 'Normal', variant: 'info' as const },
  high: { label: 'High', variant: 'warning' as const },
  urgent: { label: 'URGENT', variant: 'danger' as const },
}

const categoryConfig: Record<string, string> = {
  general: 'General',
  academic: 'Academic',
  discipline: 'Discipline',
  administrative: 'Admin',
  military: 'Military',
}

export function ParadeBriefingComposer({ briefings, onAdd }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('normal')
  const [category, setCategory] = useState('general')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onAdd({ title: title.trim(), content: content.trim(), priority, category })
    setTitle('')
    setContent('')
    setPriority('normal')
    setCategory('general')
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--color-info)]" />
          Briefing Items ({briefings.length})
        </h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {showForm ? 'Close' : 'Add Briefing'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-[var(--color-info)]/30 bg-[var(--color-info)]/10">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Briefing title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-info)]/40 bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
                required
              />
              <textarea
                placeholder="Briefing content / instructions"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-[var(--color-info)]/40 bg-[var(--color-bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)] resize-y"
                required
              />
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--color-info)]/40 bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--color-info)]/40 bg-[var(--color-bg-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring-focus)]"
                >
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                  <option value="discipline">Discipline</option>
                  <option value="administrative">Administrative</option>
                  <option value="military">Military</option>
                </select>
                <Button type="submit" size="sm" className="gap-1.5 ml-auto">
                  <Send className="h-3.5 w-3.5" /> Post Briefing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {briefings.length === 0 && !showForm && (
        <p className="text-xs text-[var(--color-text-muted)] text-center py-4">No briefing items for this parade.</p>
      )}

      {briefings.map((b) => (
        <Card key={b.id} className="border-l-4" style={{
          borderLeftColor: b.priority === 'urgent' ? '#ef4444' : b.priority === 'high' ? '#f59e0b' : b.priority === 'normal' ? '#3b82f6' : '#a1a1aa'
        }}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{b.title}</h4>
                  <Badge variant={priorityConfig[b.priority as keyof typeof priorityConfig]?.variant || 'default'}>
                    {priorityConfig[b.priority as keyof typeof priorityConfig]?.label}
                  </Badge>
                  <Badge variant="default">{categoryConfig[b.category as keyof typeof categoryConfig]}</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 whitespace-pre-wrap">{b.content}</p>
                {b.author && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Posted by {b.author.full_name}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
