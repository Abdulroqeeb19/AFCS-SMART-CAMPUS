'use client'

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
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#001A4D]">System Configuration</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage prompts, broadcasts, and task templates without editing the database</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-[#001A4D]' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Prompts Tab */}
      {tab === 'prompts' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Edit the message templates used by the system. Use {'{{variable_name}}'} placeholders for dynamic content.
          </p>
          {prompts.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No prompts found. Run migration 012_system_prompts.sql</p>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="bg-white rounded-lg border overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border-b">
                    <button onClick={() => handleTogglePrompt(prompt.id, prompt.is_active)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        prompt.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-500'
                      }`}
                    >
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#001A4D]">{prompt.label}</p>
                      <p className="text-xs text-zinc-400">{prompt.category} — {prompt.key}</p>
                    </div>
                    {prompt.description && (
                      <p className="text-xs text-zinc-400 hidden md:block max-w-xs truncate">{prompt.description}</p>
                    )}
                    {savedId === prompt.id && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                  <div className="p-4">
                    {editingPrompt === prompt.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm font-mono min-h-[120px] bg-white"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSavePrompt(prompt.id)} disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-4 py-1.5 text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition-colors"
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                          </button>
                          <button onClick={() => setEditingPrompt(null)}
                            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-50 transition-colors"
                          >Cancel</button>
                          <button onClick={() => setEditText(prompt.default_text || '')}
                            className="text-xs text-zinc-400 hover:text-zinc-600 ml-auto"
                          >Reset to default</button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-mono bg-zinc-50 rounded p-3 max-h-24 overflow-y-auto">
                          {prompt.prompt_text}
                        </pre>
                        <button onClick={() => { setEditingPrompt(prompt.id); setEditText(prompt.prompt_text) }}
                          className="absolute top-2 right-2 rounded bg-white border border-zinc-200 px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-50"
                        >Edit</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Broadcasts Tab */}
      {tab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-400">Send announcements to staff via their notification feed</p>
            <button onClick={() => setShowNewBroadcast(!showNewBroadcast)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Broadcast
            </button>
          </div>

          {showNewBroadcast && (
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm text-[#001A4D]">Create Broadcast</h3>
              <input placeholder="Title (optional)" value={newBroadcast.title}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <textarea placeholder="Message content..." value={newBroadcast.content}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, content: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm min-h-[100px]" />
              <div className="flex gap-2">
                <select value={newBroadcast.priority} onChange={(e) => setNewBroadcast({ ...newBroadcast, priority: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input placeholder="Target roles (comma-separated, e.g. teacher, admin)" value={newBroadcast.target_roles}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, target_roles: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm flex-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSendBroadcast}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#008751] text-white px-4 py-2 text-sm font-medium hover:bg-green-800 transition-colors"
                >
                  <Send className="h-4 w-4" /> Publish & Send
                </button>
                <button onClick={() => setShowNewBroadcast(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
                >Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {broadcasts.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No broadcasts sent yet</p>
            ) : broadcasts.map((b) => (
              <div key={b.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-full p-2 shrink-0 ${
                    b.priority === 'urgent' ? 'bg-red-100' : b.priority === 'high' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <Megaphone className={`h-4 w-4 ${
                      b.priority === 'urgent' ? 'text-red-600' : b.priority === 'high' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.title && <span className="font-medium text-sm text-zinc-900">{b.title}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        b.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                        b.priority === 'high' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>{b.priority}</span>
                      {b.target_roles && <span className="text-xs text-zinc-400">Roles: {b.target_roles.join(', ')}</span>}
                    </div>
                    <p className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap">{b.content}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {b.author?.full_name || 'Unknown'} · {new Date(b.created_at).toLocaleString()}
                      {b.published_at && ` · Published ${new Date(b.published_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-400">Pre-defined task templates for quick assignment</p>
            <button onClick={() => setShowNewTemplate(!showNewTemplate)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>

          {showNewTemplate && (
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm text-[#001A4D]">Create Task Template</h3>
              <input placeholder="Title" value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <textarea placeholder="Description" value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <div className="flex gap-2 flex-wrap">
                <select value={newTemplate.default_priority} onChange={(e) => setNewTemplate({ ...newTemplate, default_priority: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                  <option value="low">Low</option><option value="normal">Normal</option>
                  <option value="high">High</option><option value="urgent">Urgent</option>
                </select>
                <input type="number" placeholder="Deadline (days)" value={newTemplate.default_deadline_days}
                  onChange={(e) => setNewTemplate({ ...newTemplate, default_deadline_days: Number(e.target.value) })}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm w-32" />
                <select value={newTemplate.auto_assign_duty_type_id} onChange={(e) => setNewTemplate({ ...newTemplate, auto_assign_duty_type_id: e.target.value })}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white">
                  <option value="">No auto-assign duty</option>
                  {dutyTypes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateTemplate}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#001A4D] text-white px-4 py-2 text-sm font-medium hover:bg-blue-900 transition-colors"
                ><Plus className="h-4 w-4" /> Create</button>
                <button onClick={() => setShowNewTemplate(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
                >Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No task templates defined</p>
            ) : templates.map((t) => (
              <div key={t.id} className="bg-white rounded-lg border p-4 flex items-start gap-3">
                <ClipboardList className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-zinc-900">{t.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      t.default_priority === 'urgent' ? 'bg-red-50 text-red-700' :
                      t.default_priority === 'high' ? 'bg-amber-50 text-amber-700' :
                      t.default_priority === 'low' ? 'bg-zinc-100 text-zinc-600' : 'bg-blue-50 text-blue-700'
                    }`}>{t.default_priority}</span>
                    <span className="text-xs text-zinc-400">{t.default_deadline_days} day deadline</span>
                    {t.auto_assign_duty_type_id && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Auto-duty</span>}
                  </div>
                  {t.description && <p className="text-sm text-zinc-600 mt-1">{t.description}</p>}
                </div>
                <button onClick={() => handleDeleteTemplate(t.id)}
                  className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
