'use client'

import { useAuth } from '@/contexts/auth-context'
import {
  ArrowRight, Clock, Users, BarChart3, GraduationCap,
  Shield, MapPin, Phone, Mail, ChevronRight,
  ClipboardCheck, Calendar, Award, CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Clock, label: 'Staff Check-In/Out', desc: 'Digital attendance with late detection & QR code scanning',
    color: 'bg-[var(--color-info)]/20', iconColor: 'text-[var(--color-info)]',
  },
  {
    icon: GraduationCap, label: 'Student Attendance', desc: 'Class-based student tracking with batch check-in',
    color: 'bg-[var(--color-warning)]/20', iconColor: 'text-[var(--color-warning)]',
  },
  {
    icon: ClipboardCheck, label: 'Activity Reports', desc: 'Class teachers submit daily student activity reports',
    color: 'bg-[var(--color-success)]/20', iconColor: 'text-[var(--color-success)]',
  },
  {
    icon: BarChart3, label: 'Commandant Dashboard', desc: 'Real-time intelligence, analytics & automated reports',
    color: 'bg-[var(--color-accent)]/10', iconColor: 'text-[var(--color-accent)]/70',
  },
  {
    icon: Calendar, label: 'AI Timetable', desc: 'Smart timetable generator with conflict detection',
    color: 'bg-[var(--color-danger)]/20', iconColor: 'text-[var(--color-danger)]',
  },
  {
    icon: Shield, label: 'Parade Management', desc: 'Morning/evening parade, briefings & task assignments',
    color: 'bg-indigo-100', iconColor: 'text-indigo-600',
  },
  {
    icon: Users, label: 'Role-Based Access', desc: 'Commandant, Admin, Teacher & Support role controls',
    color: 'bg-cyan-100', iconColor: 'text-cyan-600',
  },
  {
    icon: Award, label: 'Duty Roster', desc: 'Automated duty scheduling with WhatsApp notifications',
    color: 'bg-[var(--color-warning)]/20', iconColor: 'text-[var(--color-warning)]/70',
  },
]

const stats = [
  { value: '8+', label: 'System Modules' },
  { value: '3', label: 'Access Tiers' },
  { value: '24/7', label: 'Availability' },
  { value: 'Real-Time', label: 'Sync & Reports' },
]

export default function Home() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[85vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-hover)] border-t-[#001A4D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#001A4D] via-[#002856] to-[#001033]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#C9A84C]/10 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[var(--color-accent)]/20 blur-xl" />
                <Image
                  src="/images/naf-emblem.svg"
                  alt="Nigerian Air Force Emblem"
                  width={96}
                  height={96}
                  className="relative drop-shadow-2xl"
                  priority
                />
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-sidebar)] leading-tight">
                  AFCS Smart Campus
                </h1>
                <p className="text-[var(--color-accent)] text-base md:text-lg font-medium mt-1">
                  Air Force Comprehensive School
                </p>
                <p className="text-blue-200/80 text-sm">Igbara-Oke, Ondo State, Nigeria</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="h-1 w-10 rounded-full bg-[var(--color-accent)]" />
              <span className="h-1 w-10 rounded-full bg-[var(--color-danger)]" />
              <span className="h-1 w-10 rounded-full bg-[var(--color-success)]" />
              <span className="h-1 w-10 rounded-full bg-[var(--color-info)]" />
            </div>

            <p className="text-blue-100/80 text-lg max-w-2xl leading-relaxed mb-3">
              Staff & Student Attendance Automation System
            </p>
            <p className="text-blue-200/80 text-sm max-w-xl mb-10">
              Digital check-in, real-time analytics, AI-powered timetable generation,
              parade management, and commandant intelligence dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login">
                <Button size="lg" className="gap-2 bg-[var(--color-accent)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-hover)] font-bold px-8 h-14 text-base shadow-lg shadow-[var(--color-accent)]/25">
                  Sign In to Continue <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="gap-2 border-[var(--color-info)]/40 text-blue-200/80 hover:bg-[var(--color-bg-sidebar)]/70 hover:text-[var(--color-text-sidebar)] px-8 h-14 text-base">
                  <Shield className="h-5 w-5" /> Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#fafafa" />
          </svg>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{s.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-[var(--color-bg-secondary)] py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
              About <span className="text-[var(--color-accent)]">AFCS Smart Campus</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-0.5 w-8 bg-[var(--color-accent)]" />
              <span className="h-0.5 w-8 bg-[var(--color-bg-sidebar)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              A comprehensive digital transformation solution for Air Force Comprehensive School,
              Igbara-Oke. Automating staff and student attendance, timetable generation,
              duty rosters, parade management, and administrative reporting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin, title: 'Our Location',
                desc: 'Air Force Comprehensive School, Igbara-Oke, Ondo State. A premier Nigerian Air Force educational institution.',
              },
              {
                icon: Award, title: 'Our Mission',
                desc: 'Leveraging technology to streamline school administration, enhance accountability, and provide real-time intelligence for command decisions.',
              },
              {
                icon: CheckCircle2, title: 'System Highlights',
                desc: 'QR code check-in, AI timetable generator, automated notifications, parade management, and role-based dashboards.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-6 hover:shadow-md hover:border-[var(--color-accent)]/30 transition-all">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-bg-sidebar)] mb-4">
                    <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[var(--color-bg-card)] py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
              System <span className="text-[var(--color-accent)]">Modules</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-0.5 w-8 bg-[var(--color-accent)]" />
              <span className="h-0.5 w-8 bg-[var(--color-bg-sidebar)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Everything you need to manage school operations efficiently
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.label}
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 hover:shadow-lg hover:border-[var(--color-bg-sidebar)]/20 transition-all"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{f.label}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#001A4D] to-[#003366] py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-sidebar)] mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-blue-200/80 mb-8 max-w-lg mx-auto">
            Sign in to access the command dashboard, manage attendance, generate timetables, and oversee school operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2 bg-[var(--color-accent)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-hover)] font-bold px-8 h-12 shadow-lg">
                Sign In <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="gap-2 border-[var(--color-info)]/40 text-blue-200/80 hover:bg-[var(--color-bg-sidebar)]/70 px-8 h-12">
                Register New Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-bg-sidebar)] text-blue-200/80 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Image src="/images/naf-emblem.svg" alt="NAF" width={36} height={36} />
                <div>
                  <p className="font-bold text-[var(--color-text-sidebar)] text-sm">AFCS Smart Campus</p>
                  <p className="text-[10px] text-blue-300/80">Air Force Comprehensive School</p>
                </div>
              </div>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                A digital transformation initiative for the Nigerian Air Force Comprehensive School,
                Igbara-Oke, Ondo State.
              </p>
            </div>
            <div>
              <h4 className="text-[var(--color-text-sidebar)] text-sm font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/login" className="hover:text-[var(--color-accent)] transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-[var(--color-accent)] transition-colors">Create Account</Link></li>
                <li><Link href="/dashboard" className="hover:text-[var(--color-accent)] transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--color-text-sidebar)] text-sm font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-[var(--color-accent)]" />
                  Igbara-Oke, Ondo State, Nigeria
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-[var(--color-accent)]" />
                  Nigerian Air Force
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-[var(--color-accent)]" />
                  admin@afcs.edu.ng
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--color-bg-sidebar)] pt-6 text-center">
            <p className="text-xs text-[var(--color-info)]">
              &copy; {new Date().getFullYear()} AFCS Smart Campus. Air Force Comprehensive School, Igbara-Oke. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
