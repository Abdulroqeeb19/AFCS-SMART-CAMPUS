import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, Header, Footer, PageNumber, NumberFormat, ShadingType } from 'docx';
import { writeFileSync } from 'fs';

const DARK_BLUE = '001A4D';
const GOLD = 'C9A84C';
const MID_BLUE = '003366';
const LIGHT_GRAY = 'f5f7fa';

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: DARK_BLUE })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: 'dddddd', size: 1, style: BorderStyle.SINGLE } },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: MID_BLUE })],
    spacing: { before: 300, after: 150 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, ...opts })],
    spacing: { after: 120 },
  });
}

function boldPara(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 21 }),
      new TextRun({ text: value, size: 21 }),
    ],
    spacing: { after: 80 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text: `  •  ${text}`, size: 21 })],
    spacing: { after: 60 },
    indent: { left: 400 },
  });
}

function makeTable(headers, rows) {
  return new Table({
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: 'FFFFFF' })] })],
          shading: { type: ShadingType.SOLID, color: DARK_BLUE },
          width: { size: Math.floor(5000 / headers.length), type: WidthType.DXA },
        })),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18 })] })],
          shading: ri % 2 === 1 ? { type: ShadingType.SOLID, color: LIGHT_GRAY } : undefined,
        })),
      })),
    ],
  });
}

// ============ COVER PAGE ============
function coverPage() {
  return [
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      children: [new TextRun({ text: 'AFCS Smart Campus', bold: true, size: 52, color: DARK_BLUE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Technical Blueprint — Build Guide', size: 28, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Air Force Comprehensive School, Igbara-Oke', size: 22, color: '999999' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Version 1.0 — July 2026', size: 22, color: '999999' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============ TOC ============
function toc() {
  const items = [
    '1. Project Overview', '2. Technology Stack', '3. Architecture & Directory Structure',
    '4. Database Schema & Migrations', '5. Authentication System', '6. API Routes Reference',
    '7. Telegram Bot System', '8. Automation Engine', '9. Frontend Components',
    '10. Environment Variables', '11. Deployment Guide', '12. Step-by-Step Build Process',
  ];
  return [
    h2('Table of Contents'),
    ...items.map((item, i) => new Paragraph({
      children: [new TextRun({ text: item, size: 21, color: MID_BLUE })],
      spacing: { after: 60 },
    })),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ============ DOCUMENT ============
const doc = new Document({
  title: 'AFCS Smart Campus Technical Blueprint',
  description: 'Comprehensive build guide for replicating the AFCS Smart Campus system',
  styles: { default: { document: { run: { font: 'Segoe UI', size: 21 } } } },
  sections: [
    {
      children: [
        ...coverPage(),
        ...toc(),

        // 1. Project Overview
        h2('1. Project Overview'),
        para('AFCS Smart Campus is a comprehensive school management operating system built for Nigerian secondary schools. It digitizes and automates:'),
        bullet('Staff & Student Attendance — QR-based check-in, late detection, batch operations, department/class breakdowns'),
        bullet('Duty Roster Management — 8 duty types, auto-rotation, status tracking, Telegram notifications'),
        bullet('Muster Parade System — Sessions, briefings, tasks with acknowledgement workflow'),
        bullet('AI Timetable Generator — Constraint-satisfaction algorithm that distributes subjects evenly Mon-Fri with Friday 30-min periods'),
        bullet('Daily Reporting — Inspection reports, student activity reports, AI-generated summaries'),
        bullet('Telegram Bot — 25+ commands, interactive task management, real-time push notifications'),
        bullet('Multi-Channel Notifications — Telegram (primary), WhatsApp Cloud API, SMS (Termii/Africa\'s Talking)'),
        bullet('Automation Engine — 13 scheduled rules for duty notification, check-in reminders, daily digests'),
        bullet('AI Assistant — OpenAI/Gemini-powered chat with database function calling'),
        bullet('Role-Based Access — Commandant, Admin, Teacher, Support with distinct dashboards'),
        new Paragraph({ children: [new PageBreak()] }),

        // 2. Technology Stack
        h2('2. Technology Stack'),
        h3('Frontend'),
        makeTable(
          ['Library', 'Version', 'Purpose'],
          [['Next.js', '16.2.9', 'React framework with App Router'], ['React', '19.2.4', 'UI library'], ['TypeScript', '^5', 'Type safety'], ['Tailwind CSS', '^4', 'Utility-first CSS'], ['Lucide React', '^1.21', 'Icon library'], ['date-fns', '^4.4', 'Date manipulation'], ['Zod', '^4.4', 'Schema validation'], ['jsQR', '^1.4', 'QR code scanning']]
        ),
        h3('Backend'),
        makeTable(
          ['Library', 'Purpose'],
          [['Next.js API Routes', 'Serverless API endpoints'], ['Supabase JS', 'Database client + Auth'], ['PostgreSQL', 'Primary database with RLS'], ['Telegram Bot API', 'Bot commands & notifications'], ['WhatsApp Cloud API', 'Meta WhatsApp notifications'], ['Termii / Africa\'s Talking', 'SMS gateway (Nigeria)'], ['OpenAI / Gemini API', 'AI assistant'], ['Cloudflare Turnstile', 'Human verification']]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // 3. Architecture
        h2('3. Architecture & Directory Structure'),
        para('src/ directory structure:'),
        bullet('app/ — Next.js App Router with API routes (attendance, auth, automation, classes, dashboard, duty, parades, reports, rosters, telegram, timetable) and pages (dashboard, duty-roster, timetable, check-in, muster-parade)'),
        bullet('components/ — Reusable React components (ui/ base components, parade/ components, and feature components)'),
        bullet('contexts/ — React contexts (auth)'),
        bullet('db/migrations/ — 27 SQL migration files'),
        bullet('lib/ — Shared utilities (automation engine, notifications, supabase clients, telegram commands)'),
        bullet('scripts/ — Utility scripts'),
        new Paragraph({ children: [new PageBreak()] }),

        // 4. Database Schema
        h2('4. Database Schema & Migrations'),
        para('27 migration files in src/db/migrations/. Run sequentially in Supabase SQL Editor.'),
        makeTable(
          ['#', 'Migration', 'Key Tables'],
          [['001', 'staff_schema', 'departments, staff, staff_attendance, settings'], ['002', 'seed_data', 'Sample staff + attendance'], ['003', 'student_schema', 'classes, students, student_attendance'], ['004', 'student_activity_reports', 'student_activity_reports'], ['005', 'duty_schema', 'duty_types, duty_rosters, daily_reports'], ['007', 'parade_schema', 'parade_sessions, parade_tasks, parade_briefings'], ['009', 'notifications', 'notification_logs'], ['011', 'timetable_schema', 'academic_sessions, terms, subjects, time_slots, rooms, timetable_entries, class_subjects'], ['012', 'system_prompts', 'system_prompts, broadcast_messages, task_templates'], ['013', 'offline_notifications', 'notification_rules, notification_queue'], ['017', 'telegram_chat_id', 'Adds telegram_chat_id to staff'], ['021', 'task_responses', 'task_responses, telegram_task_messages'], ['023', 'friday_time_slots', 'Friday 30-min periods']]
        ),

        h3('Core Table Relationships'),
        para('staff ← staff_attendance; staff ← duty_rosters ← duty_types; staff ← parade_tasks ← parade_sessions; staff ← timetable_entries ← classes/subjects/rooms; classes ← students ← student_attendance; classes ← class_subjects ← subjects; academic_terms ← timetable_entries'),
        new Paragraph({ children: [new PageBreak()] }),

        // 5. Authentication
        h2('5. Authentication System'),
        h3('Production Flow'),
        para('1. User visits /login, enters Staff ID or email'),
        para('2. POST /api/auth/lookup-staff finds staff record'),
        para('3. User enters password; supabase.auth.signInWithPassword() called'),
        para('4. Supabase sets HTTP-only cookies (session)'),
        para('5. AuthContext listens to onAuthStateChange'),
        para('6. Redirect by role: commandant→/dashboard, teacher→/teacher-dashboard'),
        para('7. AuthGate protects all routes'),
        h3('Dev Mode Bypass'),
        para('Set NEXT_PUBLIC_DEV_MODE=true. A staff selector UI saves to localStorage. The DevAuthInterceptor component injects x-auth-email header to all fetch calls, and API routes check this fallback for authorization.'),
        h3('Role Hierarchy'),
        makeTable(
          ['Role', 'Level', 'Access'],
          [['commandant', '100', 'Full system access'], ['admin', '80', 'All except commandant-specific'], ['teacher', '40', 'Class-specific dashboards, reports'], ['support', '20', 'Check-in/out, basic reports']]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // 6. API Routes
        h2('6. API Routes Reference'),
        para('Key endpoints by domain:'),
        makeTable(
          ['Domain', 'Key Endpoints', 'Purpose'],
          [['Attendance', 'POST /api/attendance/check-in, POST /api/attendance/check-out, GET /api/attendance/report', 'Staff check-in/out with QR, reports with department breakdown'],
           ['Student Attendance', 'POST /api/attendance/student/check-in, POST /api/attendance/student/check-out, GET /api/attendance/student/report', 'Batch check-in by class, individual check-out, class breakdown'],
           ['Timetable', 'GET /api/timetable, POST /api/timetable/generate, GET /api/timetable/next-period', 'View entries, run AI generation, get next class period'],
           ['Duty Rosters', 'GET|POST /api/rosters, POST /api/rosters/generate, GET|POST /api/duty/week', 'CRUD rosters, auto-generate weekly assignments'],
           ['Telegram', 'POST /api/telegram/webhook, POST /api/telegram/poll', 'Receive bot updates, polling fallback'],
           ['Automation', 'POST /api/automation/engine, GET|PATCH /api/automation/rules', 'Run all/due rules, manage rule config'],
           ['Reports', 'GET|POST /api/reports, GET /api/reports/student-activity', 'Daily inspection reports, class teacher activity reports']]
        ),
        para('All admin CRUD endpoints use createAdminClient() (service role) with requireAdmin() for authorization. Non-admin endpoints use createServerSupabaseClient() with RLS.'),
        new Paragraph({ children: [new PageBreak()] }),

        // 7. Telegram Bot
        h2('7. Telegram Bot System'),
        h3('Architecture'),
        bullet('Serverless: no persistent bot process. Receives updates via webhook at POST /api/telegram/webhook'),
        bullet('Fallback: POST /api/telegram/poll for environments without public webhook URL'),
        bullet('Token resolved from TELEGRAM_BOT_TOKEN env var or settings table'),
        h3('Staff Commands'),
        makeTable(
          ['Command', 'Description'],
          [['/link STAFF_ID EMAIL', 'Link Telegram to staff account'], ['/tasks', 'View assigned tasks'], ['/todo', 'View daily to-do list with inline buttons'], ['/report Activities | Challenges | Notes', 'Submit daily activity report'], ['/duty', 'Today\'s duties with status'], ['/dutydone', 'Mark pending duties complete'], ['/mytimetable [day]', 'View your teaching schedule'], ['/next', 'Your next class period'], ['/summary', 'Quick stats snapshot']]
        ),
        h3('Admin Commands'),
        makeTable(
          ['Command', 'Description'],
          [['/assign STAFF_ID DESCRIPTION', 'Assign task to staff'], ['/broadcast MESSAGE', 'Send broadcast to all linked staff'], ['/class_tt CLASS [ARM]', 'View class timetable'], ['/tt_status', 'Timetable generation status'], ['/gen_tt', 'Generate timetable for current term'], ['/automate [RULE]', 'Run automation engine'], ['/schedule YYYY-MM-DD HH:MM MSG', 'Schedule future broadcast']]
        ),
        h3('Callback Buttons'),
        para('Interactive inline keyboards handle: task acknowledge/complete/issue, task list navigation, to-do add/complete, duty completion, task deletion.'),
        new Paragraph({ children: [new PageBreak()] }),

        // 8. Automation Engine
        h2('8. Automation Engine'),
        para('Entry point: POST /api/automation/engine. Triggered by Vercel Cron (6:00 AM UTC), Telegram /automate command, or manual button. Each rule checks its time window before executing. Duplicate prevention via last_run_at with 30-min cooldown.'),
        para('13 automation rules:'),
        makeTable(
          ['Rule Key', 'Schedule', 'Action'],
          [['duty_roster_notify', '06:30 daily', 'Notify staff of today\'s duty via Telegram'],
           ['checkin_reminder', '08:30 weekdays', 'Ping staff who haven\'t checked in'],
           ['absentee_alert', '10:00 weekdays', 'Alert commandant if absentee rate > 30%'],
           ['next_period_notify', 'Every ~40 min', 'Remind teachers of upcoming class'],
           ['daily_summary_broadcast', '14:00 weekdays', 'End-of-day stats to admins'],
           ['duty_auto_assign', '06:00 weekdays', 'Rotate duty assignments fairly'],
           ['daily_report_reminder', '12:00 weekdays', 'Remind inspection duty staff to submit report'],
           ['commandant_todo', '06:30 weekdays', 'Morning briefing to commandant\'s Telegram'],
           ['end_of_day_digest', '15:00 weekdays', 'Comprehensive daily stats to commandant'],
           ['scheduled_broadcast_processor', 'Every 15 min', 'Send due scheduled broadcasts']]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // 9. Frontend Components
        h2('9. Frontend Components'),
        h3('Pages by Role'),
        makeTable(
          ['Route', 'Component', 'Roles'],
          [['/dashboard', 'DashboardContent, AiAssistant', 'commandant, admin'],
           ['/teacher-dashboard', 'ClassTeacherDashboard', 'teacher'],
           ['/check-in', 'CheckInForm (QR + manual)', 'commandant, admin, support'],
           ['/student-checkin', 'StudentCheckinForm (batch)', 'commandant, admin, teacher'],
           ['/timetable', 'Timetable grid with generation', 'commandant, admin'],
           ['/timetable/setup', 'Multi-tab setup (subjects, teachers, classes, slots, rooms)', 'commandant, admin'],
           ['/duty-roster', 'RosterContent (CRUD table)', 'commandant, admin'],
           ['/muster-parade', 'MusterContent', 'commandant, admin']]
        ),
        h3('Reusable Components'),
        bullet('Nav — Responsive sidebar with role-based sections'),
        bullet('AuthGate — Route protection with redirect'),
        bullet('CollapsibleCard — Expandable card with chevron toggle'),
        bullet('CollapsibleSection — Show more/less for long lists'),
        bullet('DashboardChart — Attendance bar charts'),
        bullet('QRScanner — Camera-based QR code scanning'),
        bullet('DevAuthInterceptor — Dev mode auth bypass toolbar'),
        new Paragraph({ children: [new PageBreak()] }),

        // 10. Environment Variables
        h2('10. Environment Variables'),
        h3('Required'),
        para('NEXT_PUBLIC_SUPABASE_URL — Supabase project URL'),
        para('NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous key'),
        para('SUPABASE_SERVICE_ROLE_KEY — Supabase service role key'),
        h3('Telegram & Notifications'),
        para('TELEGRAM_BOT_TOKEN, WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, TERMII_API_KEY, AFRICAS_TALKING_API_KEY'),
        h3('AI Assistant'),
        para('AI_API_KEY (OpenAI), GEMINI_API_KEY, AI_PROVIDER ("openai" | "gemini")'),
        h3('Security'),
        para('NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY'),
        h3('Deployment'),
        para('NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_DEV_MODE'),
        new Paragraph({ children: [new PageBreak()] }),

        // 11. Deployment
        h2('11. Deployment Guide'),
        h3('Platform: Vercel'),
        para('1. Push code to GitHub repository'),
        para('2. Create new Vercel project from GitHub repo'),
        para('3. Set all environment variables in Vercel Project Settings'),
        para('4. Build command: next build (default)'),
        para('5. Deploy triggers automatically on push to master'),
        h3('Supabase Setup'),
        para('1. Create Supabase project'),
        para('2. Enable uuid-ossp extension: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'),
        para('3. Run migration files sequentially (001 through latest)'),
        para('4. Configure Authentication providers (email/password)'),
        para('5. Copy project URL, anon key, service role key to Vercel env vars'),
        h3('Telegram Bot Setup'),
        para('1. Create bot via @BotFather on Telegram'),
        para('2. Copy token and set TELEGRAM_BOT_TOKEN env var'),
        para('3. Navigate to Settings → Telegram in the app, click "Set Webhook"'),
        para('4. Or manually: https://api.telegram.org/bot{TOKEN}/setWebhook?url={APP_URL}/api/telegram/webhook'),
        new Paragraph({ children: [new PageBreak()] }),

        // 12. Build Process
        h2('12. Step-by-Step Build Process'),
        h3('Phase 1: Foundation (Week 1-2)'),
        para('1. Initialize Next.js project with TypeScript and App Router'),
        para('2. Set up Tailwind CSS v4'),
        para('3. Create Supabase project, enable uuid-ossp'),
        para('4. Create core migrations: departments, staff, settings'),
        para('5. Build staff CRUD page and API'),
        para('6. Set up authentication with Supabase Auth'),
        para('7. Create AuthContext, AuthGate, role-based routing'),
        para('8. Build responsive sidebar navigation'),
        h3('Phase 2: Attendance (Week 3-4)'),
        para('1. Create staff_attendance table migration'),
        para('2. Build check-in/out API routes'),
        para('3. Build CheckInForm with QR code scanning'),
        para('4. Build attendance dashboard with stats/charts'),
        para('5. Create student schema (classes, students, student_attendance)'),
        para('6. Build batch student check-in by class'),
        para('7. Build student attendance dashboard with class breakdowns'),
        para('8. Add late detection and attendance cutoff logic'),
        h3('Phase 3: Duties & Reports (Week 5-6)'),
        para('1. Create duty schema (duty_types, duty_rosters, daily_reports)'),
        para('2. Build duty type CRUD'),
        para('3. Build duty roster management with auto-rotation'),
        para('4. Build daily report submission form'),
        para('5. Build reports dashboard with filters and export'),
        para('6. Add student activity reports for class teachers'),
        h3('Phase 4: Parade & Tasks (Week 7)'),
        para('1. Create parade schema (sessions, briefings, tasks)'),
        para('2. Build parade session CRUD with status tracking'),
        para('3. Build task assignment with priority and deadlines'),
        para('4. Add acknowledgement workflow'),
        para('5. Build task list page with filters'),
        h3('Phase 5: Timetable Generator (Week 8-10)'),
        para('1. Create timetable schema (terms, subjects, time_slots, rooms, entries, class_subjects)'),
        para('2. Build subject CRUD with difficulty tiers'),
        para('3. Build teacher-subject assignment'),
        para('4. Build class-subject assignment'),
        para('5. Build time slots configuration'),
        para('6. Implement AI timetable generation algorithm (greedy assignment, morning priority for hard subjects, double-period support, conflict detection, quality scoring)'),
        para('7. Build timetable viewer with color-coded cells'),
        para('8. Add Friday 30-min period support'),
        para('9. Add generation history with publish workflow'),
        h3('Phase 6: Telegram Bot (Week 11-12)'),
        para('1. Create Telegram bot with @BotFather'),
        para('2. Implement webhook receiver'),
        para('3. Build account linking flow (/link, /unlink, /status)'),
        para('4. Implement task commands (/tasks, /todo, /complete, /delete)'),
        para('5. Implement duty commands (/duty, /dutyweek, /dutytoday, /dutydone)'),
        para('6. Implement report submission (/report)'),
        para('7. Implement timetable commands (/mytimetable, /next, /class_tt, /tt_status, /gen_tt)'),
        para('8. Add inline keyboards for interactive actions'),
        para('9. Implement callback handlers for all button types'),
        para('10. Add broadcast capability'),
        h3('Phase 7: Automation & Notifications (Week 13-14)'),
        para('1. Create notification_rules table with 13 rules'),
        para('2. Build automation engine with time-window checking'),
        para('3. Implement each rule handler: duty_roster_notify, checkin_reminder, absentee_alert, next_period_notify, daily_summary_broadcast, duty_auto_assign, commandant_todo, end_of_day_digest'),
        para('4. Create Vercel cron configuration (vercel.json)'),
        para('5. Set up WhatsApp Cloud API integration'),
        para('6. Set up SMS gateways (Termii + Africa\'s Talking)'),
        para('7. Build notification queue with retry logic'),
        para('8. Build automation hub page with rule management'),
        h3('Phase 8: AI Assistant & Polish (Week 15-16)'),
        para('1. Build AI chat component with OpenAI/Gemini'),
        para('2. Implement function calling for database queries'),
        para('3. Build AI insights dashboard card'),
        para('4. Error boundary and loading states'),
        para('5. Performance optimization'),
        para('6. Comprehensive testing'),
        para('7. Deployment documentation'),

        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          children: [new TextRun({ text: 'AFCS Smart Campus — Technical Blueprint v1.0 © 2026', size: 18, color: '999999' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

async function main() {
  const buffer = await Packer.toBuffer(doc);
  writeFileSync('docs/AFCS_Smart_Campus_Blueprint.docx', buffer);
  console.log('Blueprint DOCX generated: docs/AFCS_Smart_Campus_Blueprint.docx');
}
main().catch(console.error);
