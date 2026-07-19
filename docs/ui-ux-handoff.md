# AFCS Smart Campus — UI/UX Design Handoff

**Project:** Air Force Comprehensive School Smart Campus Operating System
**Target Users:** Commandant, Admin, Teachers, Support Staff
**Current State:** Production (80+ staff, 3000+ students)
**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| NAF Blue (Primary) | `#001A4D` | Sidebar, buttons, headers |
| NAF Gold (Accent) | `#C9A84C` | Highlights, active states |
| NAF Red (Danger) | `#E03C31` | Alerts, absent counts |
| NAF Green (Success) | `#008751` | Present counts, success states |
| Page Background | `#F4F4F5` (zinc-50) | Main content area |
| Card Background | `#FFFFFF` | Cards, modals |
| Text Primary | `#18181B` (zinc-900) | Body text |
| Text Muted | `#71717A` (zinc-500) | Labels, secondary text |

---

## 1. Authentication Pages

### 1.1 Login (`/login`)
- **State:** Production ready
- **Components:** `LoginForm` (email/Staff ID + password)
- **Features:** Show/hide password toggle, CAPTCHA (Cloudflare Turnstile), forgot-password link
- **Pain Points:** None

### 1.2 Signup (`/signup`)
- **State:** Production ready
- **Components:** `SignupForm` (full_name, email, phone, staff_id, password, role select)
- **Features:** Admin-only access after creating first commandant account
- **Pain Points:** None

### 1.3 Forgot/Reset Password
- **State:** Production ready
- **Flow:** Email-based password reset via Supabase Auth
- **Pain Points:** Requires configured email provider

---

## 2. Navigation & Layout

### 2.1 Root Layout (`layout.tsx`)
- **Structure:** Sidebar (256px) + Main content area
- **Sidebar:** Fixed left, hidden on mobile (hamburger overlay)
- **Mobile:** Hamburger menu with overlay
- **Data Flow:** Auth context wraps entire app

### 2.2 Sidebar Navigation (`Nav`)
- **State:** Production ready
- **Sections:** Staff, Students, Duty & Reports, Tasks Assignment, Schedule, System
- **Features:** Collapsible sections, role-based filtering, active-link highlighting, user avatar + sign-out
- **Data Flow:** Reads `user.role` from auth context, filters `SIDEBAR_SECTIONS`
- **Pain Points:** No active indicator animation, no tooltips on collapsed icons

### 2.3 Global Search Bar (`SearchBar`)
- **State:** NEW — recently added
- **Trigger:** Search button in sidebar or `Ctrl+K`
- **Behavior:** Modal overlay with search input — filters all pages/features from SIDEBAR_SECTIONS
- **Features:** Keyboard navigation (arrows + Enter), ESC to close, shows section + route path
- **Pain Points:** Doesn't search actual data (students/staff), only page names

---

## 3. Dashboard Pages

### 3.1 Commandant Dashboard (`/dashboard`)
- **State:** Production ready
- **Tabs:** Overview | Staff Attendance | Student Attendance
- **Overview Features:**
  - Combined attendance KPIs (staff + student)
  - Next period indicator with teacher/subject/room
  - Weekly duty roster summary
  - AI-powered insights panel (OpenAI/Gemini/Ollama)
  - Live task response feed
  - Class activity reports
  - Auto-refresh every 30 seconds
- **Data Flow:** 5 parallel API calls (staff report, student report, next period, task responses, duty week)
- **Pain Points:** 30-sec polling may be excessive; no manual refresh needed but no "last updated" indicator

### 3.2 Admin Dashboard (`/admin`)
- **State:** Production ready
- **Tabs:** Overview | Staff Attendance | Student Attendance
- **Features:** Department breakdown with links to filtered staff list
- **Data Flow:** 2 parallel API calls (staff report + student report)
- **Pain Points:** Duplicate redirect guards in code

### 3.3 Class Teacher Dashboard (`/teacher-dashboard`)
- **State:** Production ready
- **Features:** Shows teacher's assigned classes, student counts, check-in status
- **Tabs:** Take Attendance | Submit Activity Report
- **Data Flow:** `GET /api/classes/my`

---

## 4. Check-In/Out Pages

### 4.1 Staff Check-In (`/check-in`)
- **State:** Production ready, fully working
- **Modes:** Manual ID entry + QR scanner
- **Features:**
  - QR code scanning via camera (BarcodeDetector API + jsQR fallback)
  - Auto check-out if already checked in
  - Late detection with configurable cutoff
  - Duration calculation
- **Data Flow:** Lookup → Check-in/out API
- **Pain Points:** QR scanner requires HTTPS, user-facing migration error messages in API responses

### 4.2 Staff Check-Out (`/check-out`)
- **State:** Production ready
- **Features:** Manual + QR, shows duration since check-in
- **Data Flow:** Lookup → Check-out API

### 4.3 Student Check-In (`/student-checkin`)
- **State:** QR scanning has intermittent issues
- **Features:** Manual + QR, period selection (morning/afternoon/evening)
- **Data Flow:** Lookup → Student check-in API
- **Pain Points:** QR scan puts ID in input but doesn't always auto-process; is_active edge case fixed

### 4.4 Student Check-Out (`/student-checkout`)
- **State:** Production ready
- **Features:** Manual + QR
- **Data Flow:** Student check-out API

---

## 5. QR Scanner Component

### 5.1 QRScanner (`qr-scanner.tsx`)
- **State:** Recently fixed
- **Approach:** Native `BarcodeDetector` API first, `jsQR` (pure JS) fallback
- **Fixes Applied:**
  - Static `import jsQR` (was dynamic import)
  - Video stream resize for performance
  - `readyState` guard before canvas operations
  - `onScanRef` to prevent stale closure on re-renders
  - DOM-before-play ordering for camera start
  - Auto-start on retry after first failure
  - Concurrent start guard (`startingRef`)
- **Pain Points:** Still reliant on camera API support on mobile browsers

---

## 6. Management Pages

### 6.1 Staff Management (`/staff`)
- **State:** Production ready
- **Features:**
  - Staff list with search/filter
  - Add/Edit staff (name, email, phone, department, role, staff ID)
  - Toggle active/inactive
  - Delete with confirmation
  - Assign prefect roles
  - Assign class-teacher duties
  - Assign subjects
- **Data Flow:** CRUD via `/api/staff`, departments, classes, subjects
- **Pain Points:** Large component (620 lines), uses `confirm()`, no pagination

### 6.2 Student Management (`/students`)
- **State:** Production ready
- **Features:**
  - Student list with search/filter
  - Add/Edit student (name, student_id, class, parent info)
  - Toggle active/inactive
  - Assign prefect roles (with dropdown)
  - Prefect role display on cards
  - Class management
- **Data Flow:** CRUD via `/api/students`, classes, prefect-roles
- **Pain Points:** Large component (470 lines), uses `confirm()`, no pagination

### 6.3 Class Management
- **State:** Production ready
- **Features:** Create/delete classes (with name + arm, e.g., "SS1 A"), view class lists
- **Pain Points:** None

### 6.4 Duty Roster (`/duty-roster`)
- **State:** Production ready
- **Views:** Day view | Week view
- **Features:** 8 duty types, auto-assign inspection duty, generate all duties, bulk operations
- **Pain Points:** Large component (626 lines), uses `confirm()`, `Promise.allSettled` with no per-item feedback

### 6.5 Muster Parade (`/muster-parade`)
- **State:** Production ready
- **Features:** Create parade sessions, assign tasks with priority/deadline/assignees, track status
- **Pain Points:** "Clean up old" uses hardcoded 2 weeks, no confirmation before adding task

---

## 7. Timetable Pages

### 7.1 Timetable (`/timetable`)
- **State:** Production ready
- **Tabs:** Timetable Grid | Quality Metrics | History
- **Features:** View by term/class/teacher/subject, AI generate with constraints, publish
- **Data Flow:** Supabase direct queries + `/api/timetable/generate`
- **Pain Points:** Very large file (692 lines), direct Supabase calls from client

### 7.2 Timetable Setup (`/timetable/setup`)
- **State:** Production ready
- **Tabs:** Subjects | Teacher Assignments | Class Subjects | Time Slots | Rooms
- **Features:** Full CRUD for timetable prerequisites
- **Data Flow:** 10+ API endpoints
- **Pain Points:** None

---

## 8. Reports & Daily Operations

### 8.1 Daily Report (`/daily-report`)
- **State:** Production ready
- **Features:** Submit end-of-day activity report
- **Data Flow:** `POST /api/reports`

### 8.2 Reports Center (`/reports`)
- **State:** Production ready
- **Tabs:** Task Reports | Attendance Reports | Daily Reports
- **Features:** Date filtering, CSV export, AI summary
- **Pain Points:** CSV downloads via `window.open()` (no auth headers)

### 8.3 My Tasks / Daily To-Do (`/my-tasks`)
- **State:** Production ready
- **Features:** Aggregated parade tasks + duty rosters for current user, custom to-do items, status tracking
- **Pain Points:** None

---

## 9. Automation Hub (`/automation`)

### 9.1 Automation Hub
- **State:** Production ready, recently updated
- **Features:**
  - 13 scheduled automation rules
  - Toggle on/off
  - Run test for individual rules
  - Run all due automations
  - Scheduled broadcasts list
  - Telegram command reference
- **Recently Changed:** 6 rules' display channel changed to Telegram (was WhatsApp/SMS)
- **Data Flow:** `GET/PATCH /api/automation/rules`, `POST /api/automation/engine`
- **Pain Points:** No UI for editing cron schedules or channel

### 9.2 Automation Rules (Updated)
| Rule | Channel | Schedule |
|---|---|---|
| Duty Roster Notification | Telegram | 06:30 daily |
| Task Assignment Notification | Telegram | on demand |
| Daily Absentee Alert | Telegram | 10:00 weekdays |
| Check-in Reminder | Telegram | 08:30 weekdays |
| Next Period Reminder | Telegram | Every period change |
| Daily Summary Broadcast | Telegram | 14:00 weekdays |
| Assembly Talk Reminder | Telegram | 07:00 Mon & Fri |
| Assembly Discussion Reminder | Telegram | 08:00 Mon & Fri |
| Daily Report Reminder | Telegram | 12:00 weekdays |
| Duty Auto-Assign | Telegram | 06:00 weekdays |
| Parade Auto-Close | Telegram | 14:30 weekdays |
| Scheduled Broadcast Processor | Telegram | Every 15 min |
| End-of-Day Digest | Telegram | 15:00 weekdays |

---

## 10. Settings & Configuration

### 10.1 System Settings (`/settings`)
- **Features:** Attendance rules (late cutoff, closing time), school info, check-in methods (QR), WhatsApp settings, seed data reference
- **Data Flow:** `GET/POST /api/settings`

### 10.2 System Config / Prompts (`/settings/prompts`)
- **Tabs:** System Prompts | Broadcast Messages | Task Templates
- **Features:** Manage AI/notification templates, schedule broadcasts, create task templates
- **Pain Points:** Direct Supabase queries from client

### 10.3 Telegram Setup
- **Features:** Configure Telegram bot token, set webhook, test connection
- **Pain Points:** None

---

## 11. Notification System Architecture

### 11.1 Channel Priority
1. **Telegram** (primary) — Bot API, free, reliable, works on 2G
2. **SMS** (fallback) — Termii + Africa's Talking
3. **WhatsApp** (fallback) — Meta Cloud API with templates
4. **Queue** (last resort) — `notification_queue` table with retry

### 11.2 Notification Types
- Task assignments (parade tasks, duty roster)
- Daily summaries
- Check-in reminders
- Absentee alerts
- Period reminders
- Broadcast messages

### 11.3 Telegram Bot Commands (25+)
- `/start`, `/help`, `/attendance`, `/checkin`, `/checkout`
- `/tasks`, `/mytasks`, `/ack`, `/complete`
- `/duty`, `/duty today`, `/duty week`
- `/automate`, `/automation list`, `/automation toggle`
- `/schedule`, `/broadcast`, `/report`
- `/notifications`, `/settings`

---

## 12. AI Features

### 12.1 AI Chat Assistant
- **State:** Previously in dashboard, now replaced by SearchBar
- **Providers:** OpenAI (GPT-4o), Gemini, Ollama (Qwen3:4b)
- **Capabilities:** Natural language queries about attendance, students, timetable

### 12.2 AI Timetable Generator
- **State:** Production ready
- **Features:** Constraint-satisfaction algorithm, conflict detection, quality metrics
- **Constraints:** Teacher availability, room capacity, subject period allocation, double periods, Friday 30-min periods

---

## 13. Prefect Roles System

### 13.1 Prefect Roles
- **State:** NEW — recently added
- **Feature:** 18 prefect roles (Head Boy/Girl through Time Prefect)
- **Assignment:** Dropdown on student cards in Manage Students
- **Display:** Prefect badge on student cards, filter by prefect role in search
- **Data Flow:** `GET /api/prefect-roles`, stored in `students.prefect_role_id`
- **Pain Points:** Migration SQL must be run manually in Supabase

---

## 14. New Features (Recent)

| Feature | Description | Date |
|---|---|---|
| Global Search Bar | Ctrl+K search across all features | Recent |
| Prefect Roles | Student leadership role assignment | Recent |
| Ollama AI Provider | Free local AI option (Qwen3:4b) | Recent |
| QR Scanner Reliability | 7 fixes: static import, resize, stale closure, auto-start | Recent |
| Automation Channel Update | 6 rules redirected to Telegram | Recent |
| Card Layout Fix | Removed xl:4-col grid, added flex-wrap | Recent |
| Student is_active Fix | `=== false` instead of `!` check | Recent |
| MaybeSingle() Migration | Safer existence checks across API | Recent |

---

## 15. Pain Points Summary

### Critical
1. **Student QR check-in intermittent** — scanned ID goes to manual input but doesn't always auto-process
2. **No pagination** — Staff/student lists load all records at once
3. **Monolithic components** — 5+ files over 400 lines mixing data/UI/state

### High Priority
4. **Direct Supabase from client** — Several pages bypass API routes
5. **`confirm()`/`alert()` dialogs** — Blocking, unstylable
6. **Error messages leak SQL** — User-facing text references migration files
7. **CSV download without auth** — `window.open()` bypasses auth headers

### Medium Priority
8. **30-second polling** — May be excessive on slow networks
9. **Hardcoded constants** — Schedule labels, difficulty colors in components
10. **DevAuthInterceptor fragile** — monkey-patches `window.fetch`

### Low Priority
11. **Timetable page direct Supabase** — Should use API routes
12. **Quality metrics hardcoded HTML** — Should be data-driven
13. **Many `any` types** — Not using TypeScript strict mode fully

---

## 16. Data Flow Patterns

### Standard Pattern
```
Page Component → fetch() → API Route → createAdminClient() → Supabase → Response → State Update → Render
```

### Auth Pattern
```
AuthProvider (context) → Supabase Auth + localStorage → user object → role-based guards → page access
```

### QR Check-In Pattern
```
QRScanner → scan → handleQRScan(id) → GET /api/checkin/lookup?identifier= → POST /api/attendance/check-in → State Update
```

### Automation Pattern
```
Vercel Cron (every 5 min) → POST /api/automation/engine → runAutomationEngine() → Handler(s) → sendTelegramMessage() → Log
```

---

## 17. Design Recommendations for Figma

### Consistency Improvements
- Standardize card shadows, border radius (8px or 12px), spacing scale
- Create a consistent empty state component (currently uses raw text)
- Unify button styles (size variants, icon+text combos)
- Standardize loading states (currently mixes skeletons and spinners)

### Layout Improvements
- Responsive sidebar: collapsible to icon-only on tablet
- Mobile-friendly tables with horizontal scroll
- Consistent page header pattern (title + subtitle + actions)
- Breadcrumb navigation for deep pages (timetable/setup, settings/prompts)

### New Component Library Needed
- Empty state with illustration
- Confirmation dialog (replace `confirm()`)
- Toast/notification system for success/error feedback
- Pagination component
- Date picker (currently uses native HTML date input)
- File upload component (for reports, attachments)

### Visual Polish
- Micro-animations for page transitions
- Loading skeletons matching card shapes
- Hover states on all interactive elements
- Focus ring styles matching NAF Blue
- Status badges with consistent color semantics
