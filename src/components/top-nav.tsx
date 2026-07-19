'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { SearchBar } from '@/components/search-bar'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/providers/sidebar-provider'
import { Bell, Menu, X, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

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

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
          </button>

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
