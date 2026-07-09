"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Shield,
  Menu,
  X,
  LogOut,
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
  LogOut,
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

export function Nav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
      <nav className="hidden md:flex w-64 flex-col bg-[#001A4D] min-h-screen shrink-0">
        {/* Logo area */}
        <Link href="/" className="flex items-center gap-3 px-5 py-5 border-b border-blue-800 hover:bg-blue-800/30 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-naf-gold">
            <Shield className="h-5 w-5 text-[#001A4D]" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight text-sm">AFCS</p>
            <p className="text-[10px] text-blue-200 leading-tight">Smart Campus</p>
          </div>
        </Link>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {SIDEBAR_SECTIONS.map((section) => {
            const visible = section.items.filter(
              (item) => user && (item.roles as readonly string[]).includes(user.role)
            )
            if (visible.length === 0 && !(section.label === 'Students' && isClassTeacher)) return null

            const sectionActive = visible.some((item) => isActive(item.href)) || (section.label === 'Students' && (isActive('/teacher-dashboard') || isActive('/teacher-attendance')))
            const open = expandedSections.has(section.label)

            return (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                    sectionActive
                      ? 'text-naf-gold'
                      : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
                  )}
                >
                  {open ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {section.label}
                </button>
                {open && (
                  <div className="mt-0.5 space-y-0.5">
                    {visible.map((item) => {
                      const Icon = iconMap[item.icon]
                      if (!Icon) return null
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg pl-7 pr-3 py-2 text-sm font-medium transition-all',
                            active
                              ? 'bg-blue-800/60 text-white border-l-2 border-naf-gold'
                              : 'text-blue-200 hover:bg-blue-800/40 hover:text-white border-l-2 border-transparent'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      )
                    })}
                    {section.label === 'Students' && isClassTeacher && !visible.some(i => i.href === '/teacher-dashboard') && (
                      <Link
                        href="/teacher-dashboard"
                        className={cn(
                          'flex items-center gap-3 rounded-lg pl-7 pr-3 py-2 text-sm font-medium transition-all',
                          isActive('/teacher-dashboard')
                            ? 'bg-blue-800/60 text-white border-l-2 border-naf-gold'
                            : 'text-blue-200 hover:bg-blue-800/40 hover:text-white border-l-2 border-transparent'
                        )}
                      >
                        <GraduationCap className="h-4 w-4 shrink-0" />
                        My Class
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* User menu */}
        <div className="p-3 border-t border-blue-800">
          {loading ? (
            <div className="h-8 animate-pulse rounded bg-blue-800" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-blue-800/50 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-naf-gold text-[#001A4D] text-xs font-bold shrink-0">
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user.full_name}</p>
                  <p className="text-[10px] text-blue-300 capitalize">{user.role}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-blue-300 shrink-0" />
              </button>
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-blue-700 bg-[#001A4D] shadow-lg py-1 z-10">
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-blue-800/60 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-[#001A4D] text-white border border-blue-700 shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#001A4D] pt-16 overflow-y-auto">
          <div className="p-4 space-y-4">
            {SIDEBAR_SECTIONS.map((section) => {
              const visible = section.items.filter(
              (item) => user && (item.roles as readonly string[]).includes(user.role)
              )
              if (visible.length === 0 && !(section.label === 'Students' && isClassTeacher)) return null
              return (
                <div key={section.label}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1 px-3">
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
                            ? 'bg-blue-800/60 text-white border-l-2 border-naf-gold'
                            : 'text-blue-200 hover:bg-blue-800/40 hover:text-white'
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
                          ? 'bg-blue-800/60 text-white border-l-2 border-naf-gold'
                          : 'text-blue-200 hover:bg-blue-800/40 hover:text-white'
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
      )}
    </>
  )
}
