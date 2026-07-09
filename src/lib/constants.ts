export const APP_NAME = 'AFCS Smart Campus'
export const APP_SCHOOL = 'Air Force Comprehensive School, Igbara-Oke'
export const APP_STATE = 'Ondo State, Nigeria'

export const ROLES = {
  COMMANDANT: 'commandant',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  SUPPORT: 'support',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<Role, number> = {
  commandant: 100,
  admin: 80,
  teacher: 40,
  support: 20,
}

export const ATTENDANCE_DEFAULTS = {
  CUTOFF_HOUR: 8,
  CUTOFF_MINUTE: 0,
  CLOSING_HOUR: 16,
  CLOSING_MINUTE: 0,
}

export const SIDEBAR_SECTIONS = [
  {
    label: 'Staff',
    items: [
      { href: '/dashboard', label: 'Commandant Dashboard', icon: 'LayoutDashboard', roles: ['commandant'] as const },
      { href: '/admin', label: 'Admin Dashboard', icon: 'LayoutDashboard', roles: ['admin'] as const },
      { href: '/my-tasks', label: 'My Tasks', icon: 'ListChecks', roles: ['commandant', 'admin', 'support'] as const },
      { href: '/check-in', label: 'Check In', icon: 'ClipboardCheck', roles: ['commandant', 'admin', 'support'] as const },
      { href: '/check-out', label: 'Check Out', icon: 'LogOut', roles: ['commandant', 'admin', 'support'] as const },
      { href: '/staff', label: 'Manage Staff', icon: 'Users', roles: ['commandant', 'admin'] as const },
    ],
  },
  {
    label: 'Students',
    items: [
      { href: '/student-checkin', label: 'Check In', icon: 'UserCheck', roles: ['commandant', 'admin', 'teacher'] as const },
      { href: '/student-checkout', label: 'Check Out', icon: 'LogOut', roles: ['commandant', 'admin', 'teacher'] as const },
      { href: '/student-attendance', label: 'Attendance', icon: 'BookOpen', roles: ['commandant', 'admin', 'teacher'] as const },
      { href: '/students', label: 'Manage Students', icon: 'GraduationCap', roles: ['commandant', 'admin'] as const },
    ],
  },
  {
    label: 'Duty & Reports',
    items: [
      { href: '/daily-report', label: 'Submit Report', icon: 'FileText', roles: ['commandant', 'admin', 'support'] as const },
      { href: '/reports', label: 'Report Dashboard', icon: 'BarChart3', roles: ['commandant', 'admin'] as const },
    ],
  },
  {
    label: 'Tasks',
    items: [
      { href: '/muster-parade', label: 'Tasks', icon: 'Shield', roles: ['commandant', 'admin'] as const },
    ],
  },
  {
    label: 'Schedule',
    items: [
      { href: '/timetable', label: 'Timetable', icon: 'CalendarDays', roles: ['commandant', 'admin'] as const },
      { href: '/timetable/setup', label: 'Timetable Setup', icon: 'Settings', roles: ['commandant', 'admin'] as const },
      { href: '/duty-roster', label: 'Duty Roster', icon: 'Calendar', roles: ['commandant', 'admin'] as const },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/automation', label: 'Automation Hub', icon: 'Bell', roles: ['commandant', 'admin'] as const },
      { href: '/settings', label: 'Settings', icon: 'Settings', roles: ['commandant', 'admin'] as const },
      { href: '/settings/prompts', label: 'System Config', icon: 'MessageSquare', roles: ['commandant', 'admin'] as const },
      { href: '/notifications', label: 'Notifications', icon: 'Smartphone', roles: ['commandant', 'admin'] as const },
    ],
  },
]
