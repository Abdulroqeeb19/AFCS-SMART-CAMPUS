'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { SearchBar } from '@/components/search-bar'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/providers/sidebar-provider'
import { Bell, BellRing, CheckCheck, ExternalLink, Menu, X, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

export function TopNav() {
  const { user, signOut } = useAuth()
  const { mobileOpen, toggleMobile } = useSidebar()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-md">
      <div className="flex h-full items-center gap-3 px-4">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo (mobile) */}
        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-bg-sidebar)]">
            <Shield className="h-4 w-4 text-[var(--color-accent)]" />
          </div>
          <span className="font-bold text-sm text-[var(--color-text-primary)]">AFCS</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto md:mx-0">
          <SearchBar />
        </div>

        {/* Right actions — pushed to the far right */}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-sidebar)] text-[var(--color-accent)] text-xs font-bold">
                  {user.full_name.charAt(0)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)]">
                  {user.full_name}
                </span>
                <span className="hidden sm:block text-xs text-[var(--color-text-muted)] capitalize">
                  {user.role}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-lg py-1 z-20">
                    <div className="px-3 py-2 border-b border-[var(--color-border)]">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{user.full_name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications?unread_only=true&limit=1')
      .then(r => r.json())
      .then(d => setUnreadCount(d.unread_count || 0))
      .catch(() => {})

    const interval = setInterval(() => {
      fetch('/api/notifications?unread_only=true&limit=1')
        .then(r => r.json())
        .then(d => setUnreadCount(d.unread_count || 0))
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const openDropdown = async () => {
    setOpen(!open)
    if (!open) {
      try {
        const res = await fetch('/api/notifications?limit=5')
        const d = await res.json()
        setNotifications(d.data || [])
      } catch {}
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'duty': return '\u{1F4CB}'
      case 'parade_task': return '\u{1F4E2}'
      case 'period_reminder': return '\u23F0'
      case 'broadcast': return '\u{1F4E1}'
      case 'attendance': return '\u2705'
      default: return '\u{1F514}'
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={openDropdown}
        className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-lg z-20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[var(--color-info)] hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-[var(--color-text-muted)]">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2 px-3 py-2.5 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors ${!n.is_read ? 'bg-[var(--color-info)]/5' : ''}`}
                  >
                    <span className="text-base mt-0.5 shrink-0">{getIcon(n.message_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--color-text-primary)] leading-relaxed line-clamp-2">
                        {n.message_body}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                        {!n.is_read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-[10px] text-[var(--color-info)] hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[var(--color-border)] px-3 py-2">
              <button
                onClick={() => { setOpen(false); router.push('/notifications') }}
                className="flex items-center justify-center gap-1 w-full text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-1"
              >
                <ExternalLink className="h-3 w-3" /> View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
