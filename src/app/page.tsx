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
    color: 'bg-blue-100', iconColor: 'text-blue-600',
  },
  {
    icon: GraduationCap, label: 'Student Attendance', desc: 'Class-based student tracking with batch check-in',
    color: 'bg-amber-100', iconColor: 'text-amber-600',
  },
  {
    icon: ClipboardCheck, label: 'Activity Reports', desc: 'Class teachers submit daily student activity reports',
    color: 'bg-emerald-100', iconColor: 'text-emerald-600',
  },
  {
    icon: BarChart3, label: 'Commandant Dashboard', desc: 'Real-time intelligence, analytics & automated reports',
    color: 'bg-violet-100', iconColor: 'text-violet-600',
  },
  {
    icon: Calendar, label: 'AI Timetable', desc: 'Smart timetable generator with conflict detection',
    color: 'bg-rose-100', iconColor: 'text-rose-600',
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
    color: 'bg-orange-100', iconColor: 'text-orange-600',
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#001A4D]" />
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
                <div className="absolute inset-0 rounded-full bg-[#C9A84C]/20 blur-xl" />
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
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  AFCS Smart Campus
                </h1>
                <p className="text-[#C9A84C] text-base md:text-lg font-medium mt-1">
                  Air Force Comprehensive School
                </p>
                <p className="text-blue-200 text-sm">Igbara-Oke, Ondo State, Nigeria</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="h-1 w-10 rounded-full bg-[#C9A84C]" />
              <span className="h-1 w-10 rounded-full bg-[#E03C31]" />
              <span className="h-1 w-10 rounded-full bg-[#008751]" />
              <span className="h-1 w-10 rounded-full bg-blue-400" />
            </div>

            <p className="text-blue-100 text-lg max-w-2xl leading-relaxed mb-3">
              Staff & Student Attendance Automation System
            </p>
            <p className="text-blue-200/70 text-sm max-w-xl mb-10">
              Digital check-in, real-time analytics, AI-powered timetable generation,
              parade management, and commandant intelligence dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login">
                <Button size="lg" className="gap-2 bg-[#C9A84C] text-[#001A4D] hover:bg-[#B8962E] font-bold px-8 h-14 text-base shadow-lg shadow-[#C9A84C]/25">
                  Sign In to Continue <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="gap-2 border-blue-300 text-blue-200 hover:bg-blue-800/50 hover:text-white px-8 h-14 text-base">
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
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-[#001A4D]">{s.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-zinc-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#001A4D] mb-3">
              About <span className="text-[#C9A84C]">AFCS Smart Campus</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-0.5 w-8 bg-[#C9A84C]" />
              <span className="h-0.5 w-8 bg-[#001A4D]" />
            </div>
            <p className="text-zinc-600 max-w-2xl mx-auto leading-relaxed">
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
                <div key={item.title} className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md hover:border-[#C9A84C]/30 transition-all">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#001A4D] mb-4">
                    <Icon className="h-6 w-6 text-[#C9A84C]" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#001A4D] mb-3">
              System <span className="text-[#C9A84C]">Modules</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-0.5 w-8 bg-[#C9A84C]" />
              <span className="h-0.5 w-8 bg-[#001A4D]" />
            </div>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Everything you need to manage school operations efficiently
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.label}
                  className="group rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-lg hover:border-[#001A4D]/20 transition-all"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-1">{f.label}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#001A4D] to-[#003366] py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-blue-200 mb-8 max-w-lg mx-auto">
            Sign in to access the command dashboard, manage attendance, generate timetables, and oversee school operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2 bg-[#C9A84C] text-[#001A4D] hover:bg-[#B8962E] font-bold px-8 h-12 shadow-lg">
                Sign In <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="gap-2 border-blue-300 text-blue-200 hover:bg-blue-800/50 px-8 h-12">
                Register New Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001033] text-blue-200 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Image src="/images/naf-emblem.svg" alt="NAF" width={36} height={36} />
                <div>
                  <p className="font-bold text-white text-sm">AFCS Smart Campus</p>
                  <p className="text-[10px] text-blue-300">Air Force Comprehensive School</p>
                </div>
              </div>
              <p className="text-xs text-blue-300 leading-relaxed">
                A digital transformation initiative for the Nigerian Air Force Comprehensive School,
                Igbara-Oke, Ondo State.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/login" className="hover:text-[#C9A84C] transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-[#C9A84C] transition-colors">Create Account</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#C9A84C] transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-[#C9A84C]" />
                  Igbara-Oke, Ondo State, Nigeria
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-[#C9A84C]" />
                  Nigerian Air Force
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-[#C9A84C]" />
                  admin@afcs.edu.ng
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-900 pt-6 text-center">
            <p className="text-xs text-blue-400">
              &copy; {new Date().getFullYear()} AFCS Smart Campus. Air Force Comprehensive School, Igbara-Oke. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
