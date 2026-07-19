"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Shield,
  Menu,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  ClipboardCheck,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Smartphone,
  CalendarDays,
  MessageSquare,
  BellDot,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ListChecks,
  ClipboardCheck,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Settings,
  Smartphone,
  CalendarDays,
  MessageSquare,
  BellDot,
}
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { SIDEBAR_SECTIONS } from '@/lib/constants'
import { useSidebar } from '@/providers/sidebar-provider'

export function Nav() {
  const pathname = usePathname()
  const { mobileOpen, setMobileOpen, sidebarCollapsed, setSidebarCollapsed } = useSidebar()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Staff', 'Students', 'Schedule', 'System'])
  )
  const { user, signOut, loading, authenticated } = useAuth()
  const [classTeacherIds, setClassTeacherIds] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/classes/class-teachers')
      .then((r) => r.ok ? r.json() : [])
      .then(setClassTeacherIds)
      .catch(() => {})
  }, [])

  const isClassTeacher = user ? classTeacherIds.includes(user.id) : false

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  if (!authenticated && !loading) return null

  return (
    <>
      <nav className={cn(
        'hidden md:flex flex-col bg-[var(--color-bg-sidebar)] min-h-screen shrink-0 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo area */}
        <Link href="/" className={cn(
          'flex items-center border-b border-[var(--color-border-sidebar)] hover:bg-white/5 transition-colors',
          sidebarCollapsed ? 'justify-center px-0 py-5' : 'gap-3 px-5 py-5'
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] shrink-0">
            <Shield className="h-5 w-5 text-[var(--color-bg-sidebar)]" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="font-bold text-white leading-tight text-sm">AFCS</p>
              <p className="text-[10px] text-[var(--color-text-sidebar-muted)] leading-tight">Smart Campus</p>
            </div>
          )}
        </Link>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {SIDEBAR_SECTIONS.map((section) => {
            const visible = section.items.filter(
              (item) => user && (item.roles as readonly string[]).includes(user.role)
            )
            if (visible.length === 0 && !(section.label === 'Students' && isClassTeacher)) return null

            const sectionActive = visible.some((item) => isActive(item.href)) || (section.label === 'Students' && (isActive('/teacher-dashboard') || isActive('/teacher-attendance')))
            const open = expandedSections.has(section.label)

            return (
              <div key={section.label} className="mb-1">
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                      sectionActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-sidebar-muted)] hover:text-white hover:bg-white/10'
                    )}
                  >
                    {open ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {section.label}
                  </button>
                )}
                {(sidebarCollapsed || open) && (
                  <div className={cn(sidebarCollapsed ? '' : 'mt-0.5 space-y-0.5')}>
                    {visible.map((item) => {
                      const Icon = iconMap[item.icon]
                      if (!Icon) return null
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center rounded-lg text-sm font-medium transition-all',
                            sidebarCollapsed
                              ? 'justify-center p-2.5 mx-auto w-11 h-11'
                              : 'gap-3 pl-7 pr-3 py-2',
                            active
                              ? 'bg-white/10 text-white'
                              : 'text-[var(--color-text-sidebar-muted)] hover:bg-white/5 hover:text-white'
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && item.label}
                        </Link>
                      )
                    })}
                    {section.label === 'Students' && isClassTeacher && !visible.some(i => i.href === '/teacher-dashboard') && (
                      <Link
                        href="/teacher-dashboard"
                        className={cn(
                          'flex items-center rounded-lg text-sm font-medium transition-all',
                          sidebarCollapsed
                            ? 'justify-center p-2.5 mx-auto w-11 h-11'
                            : 'gap-3 pl-7 pr-3 py-2',
                          isActive('/teacher-dashboard')
                            ? 'bg-white/10 text-white'
                            : 'text-[var(--color-text-sidebar-muted)] hover:bg-white/5 hover:text-white'
                        )}
                        title={sidebarCollapsed ? 'My Class' : undefined}
                      >
                        <GraduationCap className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && 'My Class'}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-[var(--color-border-sidebar)]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-[var(--color-text-sidebar-muted)] hover:text-white hover:bg-white/10 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      <MobileNav
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        isClassTeacher={isClassTeacher}
        pathname={pathname}
      />
    </>
  )
}

// ── Mobile navigation component ──
function MobileNav({
  mobileOpen, setMobileOpen, user, isClassTeacher, pathname,
}: {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  user: { role: string } | null
  isClassTeacher: boolean
  pathname: string
}) {
  if (!mobileOpen) return null
  return (
    <div className="md:hidden fixed inset-0 z-40 bg-[var(--color-bg-sidebar)] pt-16 overflow-y-auto">
      <div className="p-4 space-y-4">
        {SIDEBAR_SECTIONS.map((section) => {
          const visible = section.items.filter(
            (item) => user && (item.roles as readonly string[]).includes(user.role)
          )
          if (visible.length === 0 && !(section.label === 'Students' && isClassTeacher)) return null
          return (
            <div key={section.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-sidebar-muted)] mb-1 px-3">
                {section.label}
              </p>
              {visible.map((item) => {
                const Icon = iconMap[item.icon]
                if (!Icon) return null
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-white/10 text-white'
                        : 'text-[var(--color-text-sidebar-muted)] hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              {section.label === 'Students' && isClassTeacher && !visible.some(i => i.href === '/teacher-dashboard') && (
                <Link
                  href="/teacher-dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === '/teacher-dashboard'
                      ? 'bg-white/10 text-white'
                      : 'text-[var(--color-text-sidebar-muted)] hover:bg-white/5 hover:text-white'
                  )}
                >
                  <GraduationCap className="h-4 w-4" />
                  My Class
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
