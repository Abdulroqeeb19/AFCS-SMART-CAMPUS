'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles, ChevronDown, AlertCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] text-xs rounded-lg p-3 my-2 overflow-x-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] px-1.5 py-0.5 rounded text-xs">$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-3 mb-1">$1</h1>')
    .replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\n{2,}/g, '</p><p class="text-sm my-1.5">')
  html = '<p class="text-sm my-1.5">' + html + '</p>'
  return html
}

const SUGGESTIONS = [
  'What is the attendance status today?',
  'Who are the teachers on duty?',
  'What is the next period?',
  'Search for a student',
  'Show today\'s parade',
  'Current term info',
]

export function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'ollama'>('openai')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('afcs_ai_provider') as 'openai' | 'gemini' | 'ollama' | null
    if (saved) {
      setProvider(saved)
    } else if (process.env.NEXT_PUBLIC_AI_PROVIDER === 'gemini') {
      setProvider('gemini')
    } else if (process.env.NEXT_PUBLIC_AI_PROVIDER === 'ollama') {
      setProvider('ollama')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('afcs_ai_provider', provider)
  }, [provider])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = async (content: string) => {
    if (!content.trim() || loading) return
    setShowSuggestions(false)
    setError(null)

    const userMsg: Message = { role: 'user', content: content.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          provider,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] shadow-lg hover:bg-[var(--color-blue-700)] transition-all px-5 py-3 ${open ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        title="Open AI Assistant"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-medium">AI Assistant</span>
      </button>

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-[var(--color-bg-card)] shadow-2xl border-l border-[var(--color-border)] flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[var(--color-accent)]/20 p-2">
              <Bot className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AFCS AI Assistant</h2>
              <p className="text-xs text-[var(--color-text-sidebar)]">Powered by
                <button
                  onClick={() => setProvider(provider === 'openai' ? 'gemini' : provider === 'gemini' ? 'ollama' : 'openai')}
                  className="ml-1 underline decoration-dotted hover:text-white transition-colors"
                >
                  {provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : 'Ollama'}
                </button>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProvider(provider === 'openai' ? 'gemini' : provider === 'gemini' ? 'ollama' : 'openai')}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  provider === 'openai'
                  ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                  : provider === 'gemini'
                  ? 'bg-[var(--color-info)]/20 text-[var(--color-info)]'
                  : 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]/70'
              }`}
              title="Switch AI provider"
            >
              {provider === 'openai' ? 'GPT' : provider === 'gemini' ? 'Gem' : 'Qwen'}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-[var(--color-bg-card)]/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[var(--color-text-muted)]">
              <Bot className="h-12 w-12 mb-3 text-[var(--color-text-muted)]" />
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">How can I help you today?</p>
              <p className="text-xs mt-1">Ask about attendance, students, staff, timetable, or parade</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[var(--color-bg-sidebar)] text-[var(--color-text-sidebar)] rounded-br-md'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-bg-muted)] rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-muted)]" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length === 0 && !error && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-2">
              <ChevronDown className="h-3 w-3" />
              <span>Try asking</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-full px-3 py-1.5 text-[var(--color-text-secondary)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[var(--color-border)] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] px-4 py-2 focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask anything about the school..."
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="rounded-lg p-1.5 text-[var(--color-bg-sidebar)] hover:bg-[var(--color-bg-sidebar)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2 text-center">
            Data is queried from the live school database in real-time
          </p>
        </div>
      </div>
    </>
  )
}
