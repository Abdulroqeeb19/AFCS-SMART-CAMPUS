'use client'

import { CollapsibleSection } from '@/components/collapsible-section'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Save, Plus, Send, Trash2, MessageSquare, ClipboardList,
  Loader2, CheckCircle2, Megaphone,
} from 'lucide-react'

type Tab = 'prompts' | 'broadcasts' | 'templates'

interface PromptItem {
  id: string
  label: string
  category: string
  key: string
  prompt_text: string
  default_text: string | null
  is_active: boolean
  description: string | null
  updated_at: string
}

interface BroadcastItem {
  id: string
  title: string | null
  content: string
  priority: string
  target_roles: string[] | null
  status: string
  created_by: string | null
  created_at: string
  published_at: string | null
  author: { id: string; staff_id: string; full_name: string } | null
}

interface TemplateItem {
  id: string
  title: string
  description: string | null
  default_priority: string
  default_deadline_days: number
  auto_assign_duty_type_id: string | null
}

interface DutyTypeItem {
  id: string
  name: string
  is_active: boolean
}

export default function SettingsPromptsPage() {
  const [tab, setTab] = useState<Tab>('prompts')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([])
  const [newBroadcast, setNewBroadcast] = useState({ title: '', content: '', priority: 'normal', target_roles: '' })
  const [showNewBroadcast, setShowNewBroadcast] = useState(false)

  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [dutyTypes, setDutyTypes] = useState<DutyTypeItem[]>([])
  const [newTemplate, setNewTemplate] = useState({ title: '', description: '', default_priority: 'normal', default_deadline_days: 7, auto_assign_duty_type_id: '' })
  const [showNewTemplate, setShowNewTemplate] = useState(false)

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'prompts', label: 'System Prompts', icon: MessageSquare },
    { id: 'broadcasts', label: 'Broadcast Messages', icon: Megaphone },
    { id: 'templates', label: 'Task Templates', icon: ClipboardList },
  ]

  useEffect(() => {
    async function load() {
      const [p, b, t, d] = await Promise.all([
        supabase.from('system_prompts').select('*').order('category').order('label'),
        supabase.from('broadcast_messages').select('*, author:created_by(id, staff_id, full_name)').order('created_at', { ascending: false }),
        supabase.from('task_templates').select('*').order('title'),
        supabase.from('duty_types').select('*').eq('is_active', true).order('name'),
      ])
      if (p.data) setPrompts(p.data)
      if (b.data) setBroadcasts(b.data)
      if (t.data) setTemplates(t.data)
      if (d.data) setDutyTypes(d.data)
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSavePrompt = async (id: string) => {
    setSaving(true)
    await supabase.from('system_prompts').update({ prompt_text: editText, updated_at: new Date().toISOString() }).eq('id', id)
    setPrompts((prev) => prev.map((p) => p.id === id ? { ...p, prompt_text: editText } : p))
    setEditingPrompt(null)
    setSavedId(id)
    setSaving(false)
    setTimeout(() => setSavedId(null), 2000)
  }

  const handleTogglePrompt = async (id: string, current: boolean) => {
    await supabase.from('system_prompts').update({ is_active: !current }).eq('id', id)
    setPrompts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p))
  }

  const handleSendBroadcast = async () => {
    if (!newBroadcast.content) return
    const { data } = await supabase.from('broadcast_messages').insert({
      title: newBroadcast.title || null, content: newBroadcast.content,
      priority: newBroadcast.priority,
      target_roles: newBroadcast.target_roles ? newBroadcast.target_roles.split(',').map((r: string) => r.trim()) : null,
      status: 'published', published_at: new Date().toISOString(),
    }).select().single()
    if (data) {
      setBroadcasts((prev) => [data as BroadcastItem, ...prev])
      setNewBroadcast({ title: '', content: '', priority: 'normal', target_roles: '' })
      setShowNewBroadcast(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.title) return
    const { data } = await supabase.from('task_templates').insert({
      title: newTemplate.title, description: newTemplate.description,
      default_priority: newTemplate.default_priority,
      default_deadline_days: newTemplate.default_deadline_days,
      auto_assign_duty_type_id: newTemplate.auto_assign_duty_type_id || null,
    }).select().single()
    if (data) {
      setTemplates((prev) => [...prev, data])
      setNewTemplate({ title: '', description: '', default_priority: 'normal', default_deadline_days: 7, auto_assign_duty_type_id: '' })
      setShowNewTemplate(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('task_templates').delete().eq('id', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text-muted)]" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">System Configuration</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Manage prompts, broadcasts, and task templates without editing the database</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-[var(--color-bg-muted)] p-1 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-[var(--color-bg-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Prompts Tab */}
      {tab === 'prompts' && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Edit the message templates used by the system. Use {'{{variable_name}}'} placeholders for dynamic content.
          </p>
          {prompts.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No prompts found. Run migration 012_system_prompts.sql</p>
          ) : (
            <CollapsibleSection
              items={prompts}
              keyExtractor={(prompt) => prompt.id}
              defaultVisible={5}
              className="space-y-3"
              renderItem={(prompt) => (
                <div className="bg-[var(--color-bg-card)] rounded-lg border overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-secondary)] border-b">
                    <button onClick={() => handleTogglePrompt(prompt.id, prompt.is_active)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        prompt.is_active ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{prompt.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{prompt.category} — {prompt.key}</p>
                    </div>
                    {prompt.description && (
                      <p className="text-xs text-[var(--color-text-muted)] hidden md:block max-w-xs truncate">{prompt.description}</p>
                    )}
                    {savedId === prompt.id && <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />}
                  </div>
                  <div className="p-4">
                    {editingPrompt === prompt.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded-lg border border-[var(--color-info)]/40 px-3 py-2 text-sm font-mono min-h-[120px] bg-[var(--color-bg-card)]"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSavePrompt(prompt.id)} disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-4 py-1.5 text-sm font-medium hover:bg-[var(--color-bg-sidebar)] disabled:opacity-50 transition-colors"
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                          </button>
                          <button onClick={() => setEditingPrompt(null)}
                            className="rounded-lg border border-[var(--color-border-hover)] px-4 py-1.5 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                          >Cancel</button>
                          <button onClick={() => setEditText(prompt.default_text || '')}
                            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] ml-auto"
                          >Reset to default</button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono bg-[var(--color-bg-secondary)] rounded p-3 max-h-24 overflow-y-auto">
                          {prompt.prompt_text}
                        </pre>
                        <button onClick={() => { setEditingPrompt(prompt.id); setEditText(prompt.prompt_text) }}
                          className="absolute top-2 right-2 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-bg-hover)]"
                        >Edit</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* Broadcasts Tab */}
      {tab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--color-text-muted)]">Send announcements to staff via their notification feed</p>
            <button onClick={() => setShowNewBroadcast(!showNewBroadcast)}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-bg-sidebar)] transition-colors"
            >
              <Plus className="h-4 w-4" /> New Broadcast
            </button>
          </div>

          {showNewBroadcast && (
            <div className="bg-[var(--color-bg-card)] rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm text-[var(--color-text-primary)]">Create Broadcast</h3>
              <input placeholder="Title (optional)" value={newBroadcast.title}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm" />
              <textarea placeholder="Message content..." value={newBroadcast.content}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, content: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm min-h-[100px]" />
              <div className="flex gap-2">
                <select value={newBroadcast.priority} onChange={(e) => setNewBroadcast({ ...newBroadcast, priority: e.target.value })}
                  className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)]">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input placeholder="Target roles (comma-separated, e.g. teacher, admin)" value={newBroadcast.target_roles}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, target_roles: e.target.value })}
                  className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm flex-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSendBroadcast}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-success)] text-white px-4 py-2 text-sm font-medium hover:bg-green-800 transition-colors"
                >
                  <Send className="h-4 w-4" /> Publish & Send
                </button>
                <button onClick={() => setShowNewBroadcast(false)}
                  className="rounded-lg border border-[var(--color-border-hover)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                >Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {broadcasts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No broadcasts sent yet</p>
            ) : (
              <CollapsibleSection
                items={broadcasts}
                keyExtractor={(b) => b.id}
                defaultVisible={5}
                className="space-y-2"
                renderItem={(b) => (
                  <div className="bg-[var(--color-bg-card)] rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-2 shrink-0 ${
                        b.priority === 'urgent' ? 'bg-[var(--color-danger)]/20' : b.priority === 'high' ? 'bg-[var(--color-warning)]/20' : 'bg-[var(--color-info)]/20'
                      }`}>
                        <Megaphone className={`h-4 w-4 ${
                          b.priority === 'urgent' ? 'text-[var(--color-danger)]' : b.priority === 'high' ? 'text-[var(--color-warning)]' : 'text-[var(--color-info)]'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {b.title && <span className="font-medium text-sm text-[var(--color-text-primary)]">{b.title}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            b.priority === 'urgent' ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' :
                            b.priority === 'high' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' : 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                          }`}>{b.priority}</span>
                          {b.target_roles && <span className="text-xs text-[var(--color-text-muted)]">Roles: {b.target_roles.join(', ')}</span>}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1 whitespace-pre-wrap">{b.content}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {b.author?.full_name || 'Unknown'} · {new Date(b.created_at).toLocaleString()}
                          {b.published_at && ` · Published ${new Date(b.published_at).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      )}

      {/* Task Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--color-text-muted)]">Pre-defined task templates for quick assignment</p>
            <button onClick={() => setShowNewTemplate(!showNewTemplate)}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-bg-sidebar)] transition-colors"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>

          {showNewTemplate && (
            <div className="bg-[var(--color-bg-card)] rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm text-[var(--color-text-primary)]">Create Task Template</h3>
              <input placeholder="Title" value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm" />
              <textarea placeholder="Description" value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm" />
              <div className="flex gap-2 flex-wrap">
                <select value={newTemplate.default_priority} onChange={(e) => setNewTemplate({ ...newTemplate, default_priority: e.target.value })}
                  className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)]">
                  <option value="low">Low</option><option value="normal">Normal</option>
                  <option value="high">High</option><option value="urgent">Urgent</option>
                </select>
                <input type="number" placeholder="Deadline (days)" value={newTemplate.default_deadline_days}
                  onChange={(e) => setNewTemplate({ ...newTemplate, default_deadline_days: Number(e.target.value) })}
                  className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm w-32" />
                <select value={newTemplate.auto_assign_duty_type_id} onChange={(e) => setNewTemplate({ ...newTemplate, auto_assign_duty_type_id: e.target.value })}
                  className="rounded-lg border border-[var(--color-border-hover)] px-3 py-2 text-sm bg-[var(--color-bg-card)]">
                  <option value="">No auto-assign duty</option>
                  {dutyTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateTemplate}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-sidebar)] transition-colors"
                ><Plus className="h-4 w-4" /> Create</button>
                <button onClick={() => setShowNewTemplate(false)}
                  className="rounded-lg border border-[var(--color-border-hover)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                >Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No task templates defined</p>
            ) : (
              <CollapsibleSection
                items={templates}
                keyExtractor={(t) => t.id}
                defaultVisible={5}
                className="space-y-2"
                renderItem={(t) => (
                  <div className="bg-[var(--color-bg-card)] rounded-lg border p-4 flex items-start gap-3">
                    <ClipboardList className="h-5 w-5 text-[var(--color-info)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-[var(--color-text-primary)]">{t.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          t.default_priority === 'urgent' ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' :
                          t.default_priority === 'high' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
                          t.default_priority === 'low' ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]' : 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                        }`}>{t.default_priority}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{t.default_deadline_days} day deadline</span>
                        {t.auto_assign_duty_type_id && <span className="text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] px-2 py-0.5 rounded">Auto-duty</span>}
                      </div>
                      {t.description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteTemplate(t.id)}
                      className="text-[var(--color-danger)] hover:text-[var(--color-danger)] shrink-0"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
