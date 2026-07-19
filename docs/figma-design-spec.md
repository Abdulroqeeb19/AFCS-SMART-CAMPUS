# AFCS Smart Campus — Figma Design Specification

> **Master document for UI/UX design of AFCS Smart Campus Web Application**
> Bridges the current production system with the full-school-management vision.

---

## 1. Designer Brief

### 1.1 About the Project
AFCS Smart Campus is a live, production-grade school management OS deployed at **Air Force Comprehensive School, Igbara-Oke, Ondo State, Nigeria**. It currently serves **80+ staff and 3,000+ students** with 12 core modules. The application needs a **complete UI/UX overhaul** to match enterprise SaaS standards while preserving all existing functionality.

### 1.2 Design Philosophy
Inspired by: **Notion, Linear, Microsoft 365, Supabase Dashboard, Stripe Dashboard, Vercel Dashboard**

| Principle | Application |
|---|---|
| Clean layouts | Generous whitespace, clear information hierarchy |
| Minimal clutter | Show essential info first, progressive disclosure |
| Excellent typography | Inter/Geist/SF Pro, proper scale |
| Spacious spacing | 8px grid system, 12-16px border radius |
| Responsive | Desktop → Tablet → Mobile |
| Accessibility | WCAG AA minimum |
| Dark/Light mode | Full theme support via CSS variables |

### 1.3 Brand Personality
- **Military professionalism** — structured, disciplined, precise
- **Educational excellence** — trustworthy, authoritative, supportive
- **Modern technology** — fast, responsive, delightful
- **Security** — zero-compromise on data protection

---

## 2. Color System

### 2.1 Updated Palette (Current vs Figma)
| Token | Current Hex | Figma Spec Hex | Usage |
|---|---|---|---|
| Primary | `#001A4D` | `#1F4E79` | Sidebar, buttons, headers, active states |
| Secondary | — | `#4DA6FF` | Highlights, links, secondary buttons |
| Accent | `#C9A84C` | — | Highlights, active indicators |
| Success | `#008751` | `#22C55E` | Present, completed, active |
| Warning | — | `#F59E0B` | Late, pending, caution |
| Danger | `#E03C31` | `#EF4444` | Absent, errors, deletions |
| Page BG | `#F4F4F5` | Slate 50 | Main content area |
| Card BG | `#FFFFFF` | White | Cards, modals, panels |
| Text Primary | `#18181B` | Slate 900 | Body text |
| Text Muted | `#71717A` | Slate 500 | Labels, secondary |

### 2.2 Semantic Tokens (Light + Dark)
Define as CSS variables for auto-switching:
- `--color-bg-primary` / `--color-bg-secondary` / `--color-bg-card`
- `--color-text-primary` / `--color-text-secondary` / `--color-text-muted`
- `--color-border` / `--color-border-hover`
- `--color-accent` / `--color-accent-hover`
- `--color-success` / `--color-warning` / `--color-danger` / `--color-info`

---

## 3. Typography

| Level | Size | Weight | Usage |
|---|---|---|---|
| H1 | 32px / 2rem | Bold (700) | Page titles |
| H2 | 24px / 1.5rem | Semibold (600) | Section headers |
| H3 | 20px / 1.25rem | Semibold (600) | Card titles |
| H4 | 16px / 1rem | Semibold (600) | Subsection headers |
| Body | 14px / 0.875rem | Regular (400) | Default text |
| Body Small | 13px / 0.8125rem | Regular (400) | Dense content |
| Caption | 12px / 0.75rem | Regular (400) | Help text, timestamps |
| Label | 11px / 0.6875rem | Medium (500) | Badge text, table headers |
| Stat Number | 28-36px | Bold (700) | KPI card numbers |

**Font Stack:** `'Inter', 'Geist', 'SF Pro Display', system-ui, -apple-system, sans-serif`

---

## 4. Grid & Spacing

- **Grid:** 12-column responsive grid
- **Spacing base:** 8px increments (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
- **Border radius:** 12px (cards, modals), 8px (buttons, inputs), 6px (badges)
- **Shadows:** soft, multi-layered (see elevation tokens)
- **Breakpoints:** 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (large)

---

## 5. Navigation Layout

### 5.1 Top Navigation Bar
```
[School Logo]  [Search Ctrl+K]  [Notifications] [Messages] [User Avatar ▼] [Settings]
```
- Fixed height: 56px
- Z-index above sidebar
- Notification bell with unread badge count
- User dropdown: Profile, Settings, Sign Out

### 5.2 Left Sidebar
- Width: 240px (256px with labels), collapses to 64px (icon-only) on tablet
- Sections with collapsible groups
- Active item highlight with gold/blue accent bar
- Modules (role-filtered):

| Module | Phases | Roles |
|---|---|---|
| Dashboard | A | All |
| Students | A | Admin, Commandant, Teachers |
| Staff | A | Admin, Commandant |
| Parents | A, D | Admin, Commandant |
| Admissions | A | Admin, Commandant |
| Academics | B | All |
| Attendance | C | Admin, Commandant, Teachers |
| Results | B | Admin, Commandant, Teachers |
| Finance | D | Bursary, Admin, Commandant |
| Documents | C | All |
| Reports | A, C | Admin, Commandant |
| Settings | A | Admin, ICT |

- **Logout** pinned at the bottom

---

## 6. Phase A Screens (Current Production)

These screens already exist and need UI/UX redesign. Preserve all functionality.

| # | Screen | Current File | Key Features |
|---|---|---|---|
| A1 | Login | `login-form.tsx` | Email/Staff ID + password, CAPTCHA, show/hide toggle |
| A2 | Forgot Password | `forgot-password-form.tsx` | Email input → reset link |
| A3 | Commandant Dashboard | `dashboard-content.tsx` | KPIs, charts, next period, duty roster, AI insights, task feed |
| A4 | Admin Dashboard | `admin/page.tsx` | Staff/student overview, department breakdown |
| A5 | Student List | `students-list.tsx` | Search, filter, CRUD, prefect role assignment, class management |
| A6 | Student Detail | — | Modal/expanded view with attendance, prefect role, parent info |
| A7 | Student Registration | — | Add student form (name, ID, class, parent contacts) |
| A8 | Staff Directory | `staff-list.tsx` | Search, filter, CRUD, department, role, subjects, class-teacher |
| A9 | Staff Profile | — | Modal/expanded view with attendance, duties, contact |
| A10 | Parent Portal | — | Future: child attendance, results, fees, messages |
| A11 | Admissions Portal | — | Future: new student application workflow |
| A12 | School Homepage | `page.tsx` | Public landing, hero, features, about, sign-in CTA |
| A13 | User Management | — | Future: role assignment, permissions |
| A14 | Role Management | — | Future: role CRUD, hierarchy config |
| A15 | Audit Logs | — | Future: user activity, changes, edits |

### 6.1 Phase A — Component Mapping
| Current Component | New Design Needed | Notes |
|---|---|---|
| `Nav` | Sidebar + Top Nav | Split into top bar + left sidebar |
| `SearchBar` | Global search in top nav | Keep Ctrl+K, move to top bar |
| `CheckInForm` | Attendance check-in card | Redesign as modal/inline card |
| `CheckOutForm` | Attendance check-out card | Same pattern as check-in |
| `StudentCheckinForm` | Student attendance card | Add period selector inline |
| `QRScanner` | Camera modal | Overlay with scanner viewfinder |
| `AttendanceStats` | KPI stat cards | Redesign with icons, trends |
| `AttendanceTable` | Data table | Sortable, filterable, paginated |
| `DailySummary` | Summary card | Collapsible with expand detail |
| `RecentActivity` | Activity feed widget | Vertical timeline style |
| `ClassTeacherDashboard` | Teacher home | Tabbed: Attendance + Reports |
| `TodayBanner` | Date/time indicator | Compact, in top bar area |

---

## 7. Phase B Screens (Learning Management)

Design these as new screens (not yet built):

| # | Screen | Description |
|---|---|---|
| B1 | Course List | Grid of courses with teacher, class, schedule |
| B2 | Course Detail | Syllabus, materials, assignments, grades |
| B3 | Lesson Viewer | Rich content viewer with attachments |
| B4 | Assignment Upload | Teacher creates assignment with due date |
| B5 | Assignment Submission | Student submits work, teacher grades |
| B6 | Teacher Dashboard | Academic-specific: classes, submissions, performance |
| B7 | Student Dashboard | My courses, assignments, grades, timetable |
| B8 | CBT Dashboard | Computer-based test listing, scheduled exams |
| B9 | Exam Interface | Timer, questions, navigation, auto-submit |
| B10 | Question Builder | Create MCQ/theory questions with answer key |
| B11 | Question Bank | Searchable library of questions by subject/class |
| B12 | Result Processing | Compute, approve, publish results |
| B13 | Gradebook | Per-class grade view with analytics |
| B14 | Report Card | Printable PDF report card design |
| B15 | Academic Analytics | Performance trends, subject analysis, comparisons |
| B16 | Timetable | Visual grid, drag periods, conflict warnings |

---

## 8. Phase C Screens (Attendance & Documents)

| # | Screen | Description |
|---|---|---|
| C1 | Student Attendance | Daily view with class filters, period breakdown |
| C2 | Staff Attendance | Department view, late/absent tracking |
| C3 | QR Check-in | Camera scanner UI with viewfinder, manual override |
| C4 | Attendance Reports | Date range, export CSV, chart visualization |
| C5 | Leave Requests | Apply, approve/reject, balance tracking |
| C6 | Approval Workflow | Pending approvals, chain of command |
| C7 | Document Library | Categories, search, upload, version control |
| C8 | Document Viewer | Preview PDF/images, download, share |
| C9 | Workflow Dashboard | All automated workflows, triggers, history |
| C10 | Notifications | History log, filters, channel status (Telegram/WhatsApp/SMS) |

### 8.1 Existing Screens to Redesign (Phase C)
- `/student-attendance` → redesigned with charts + class filters + export
- `/check-in` + `/check-out` → unified attendance with QR modal
- `/notifications` → notification hub with log + status
- `/automation` → workflow dashboard with trigger visualizer

---

## 9. Phase D Screens (Finance)

Design these as new screens (not yet built):

| # | Screen | Description |
|---|---|---|
| D1 | School Fees Dashboard | Total collected, outstanding, by class, by term |
| D2 | Invoice Generation | Create, print, email invoices per student |
| D3 | Payment History | Per-student payment records, receipts |
| D4 | Outstanding Fees | Students with pending balances, reminders |
| D5 | Revenue Dashboard | Charts: daily/monthly/termly collections |
| D6 | Financial Reports | P&L, balance sheet, fee summary by class |
| D7 | Budget Management | Create, track, approve departmental budgets |
| D8 | Transaction Details | Single transaction view with audit trail |

---

## 10. Dashboard Design Specification (Commandant)

### 10.1 KPI Cards Row
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 3,042    │ │ 84       │ │ 2,156 ✓  │ │ 886 ✗   │ │ ₦12.5M  │
│ Students │ │ Staff    │ │ Present  │ │ Absent   │ │ Revenue  │
│ ▲ +12%   │ │ ▲ +0%   │ │ ▲ 71%   │ │ ▼ 29%   │ │ ▲ +8%   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```
- Each card: number (large), label, trend indicator
- Background color based on trend direction
- Clickable → navigate to detailed view

### 10.2 Charts Section
- **Student Enrollment** — Bar chart (termly comparison)
- **Attendance Trend** — Line chart (daily/weekly)
- **Department Statistics** — Pie/donut chart
- **Fee Collection** — Progress bars per class

### 10.3 Widgets (Right Column / Bottom Row)
- **Today's Activities** — Latest check-ins, reports, task completions
- **School Calendar** — Upcoming events, term dates
- **Recent Notifications** — Last 5 Telegram/WhatsApp sends
- **Quick Actions** — Check in student, assign duty, run automation
- **Pending Approvals** — Leave requests, attendance overrides

---

## 11. Component Library

### 11.1 Design in Figma as Reusable Components

| Component | Variants | States |
|---|---|---|
| Button | Primary, Secondary, Outline, Ghost, Danger | Default, Hover, Active, Disabled, Loading |
| Input | Text, Email, Password, Search, Number | Default, Focus, Error, Disabled |
| Select | Single, Multi, Searchable | Default, Focus, Error |
| Table | Default, Sortable, Selectable, Paginated | Header, Row, Empty |
| Card | Default, Clickable, with Icon, with Badge | Default, Hover |
| Modal | Default, Fullscreen, With Steps | Open, Close animation |
| Sidebar | Expanded, Collapsed, Mobile Overlay | — |
| Tabs | Underline, Pill, Icon | Active, Hover |
| Badge | Success, Warning, Danger, Info, Neutral | — |
| Alert | Success, Warning, Error, Info | Dismissible, Persistent |
| Toast | Top-right, Bottom-center | Enter, Exit animation |
| Progress Bar | Determinate, Indeterminate | — |
| Date Picker | Single, Range | Month picker sub-component |
| File Upload | Single, Multi, Drag-zone | Uploading, Success, Error |
| Pagination | Number, Prev/Next, Compact | — |
| Breadcrumb | Default, With Icons | — |
| Stat Card | Horizontal, Vertical, Mini | With trend, Without trend |
| Chart | Bar, Line, Pie, Donut, Area | — |
| Search Bar | Input, With Filters, Global (Ctrl+K) | — |
| Data Table | Sort, Filter, Export, Column toggle | — |

### 11.2 Interaction States for Every Component
- **Default** — resting state
- **Hover** — subtle background/scale change (transform)
- **Focus** — ring/focus outline (WCAG AA 3:1 contrast)
- **Active/Pressed** — darker background or scale down
- **Disabled** — reduced opacity, no interaction
- **Loading** — skeleton or spinner placeholder
- **Error** — red border, error message below
- **Empty** — illustration + message + CTA

---

## 12. User Roles & Permissions

Design unique dashboards/views for each role:

### 12.1 Commandant
- Strategic analytics, school-wide KPIs
- Approvals (attendance overrides, leave, budgets)
- AI insights panel, automated reports
- **Layout:** Full dashboard with all widgets

### 12.2 ICT Administrator
- User management, role assignments
- System settings, audit logs
- Telegram/WhatsApp configuration
- **Layout:** Settings-centric, technical

### 12.3 Teachers
- Their classes, attendance grid
- Lesson plans, assignment creation
- Student profiles, result entry
- **Layout:** Class-teacher dashboard + daily tasks

### 12.4 Bursary
- Fee dashboard, invoice generation
- Payment tracking, financial reports
- Outstanding fees, receipts
- **Layout:** Finance-focused, no attendance/staff modules

### 12.5 Parents (Future)
- Child's profile, attendance, results
- Fee payment, messages from school
- Announcements, calendar
- **Layout:** Mobile-first, read-only

### 12.6 Students (Future)
- Personal profile, timetable
- Assignment submission, results viewing
- Notifications, announcements
- **Layout:** Mobile-first, self-service

---

## 13. UX States

Every screen must handle:

| State | Implementation |
|---|---|
| **Loading** | Skeleton matching card/table shape (not spinner alone) |
| **Empty** | Illustration + clear message + CTA to add/create |
| **Error** | Friendly message + retry button, not raw error text |
| **Success** | Toast notification or inline success indicator |
| **Partial/Offline** | Banner indicating stale data, last updated timestamp |
| **Permission Denied** | Graceful message, hide unavailable actions |

---

## 14. Responsive Behavior

| Element | Desktop (≥1024px) | Tablet (768-1023px) | Mobile (<768px) |
|---|---|---|---|
| Sidebar | 256px, always visible | 64px icon-only, expand on tap | Hidden, hamburger overlay |
| Top Nav | Full (logo + search + icons + avatar) | Condensed (icons only) | Condensed |
| KPI Cards | 5-column row | 3-column, 2 rows | 2-column, 3 rows |
| Tables | Full with all columns | Horizontal scroll | Card list view |
| Charts | Side by side | Stacked | Single column |
| Modals | Center, max 800px | Full-width, 90% | Full-screen |
| Data entry | Side panel or modal | Modal | Full-screen form |

---

## 15. Deliverables Checklist (Figma)

| # | Deliverable | Status |
|---|---|---|
| 1 | Cover Page with project info | — |
| 2 | Design System (color, typography, spacing, elevation tokens) | — |
| 3 | Component Library (all components with all states) | — |
| 4 | Phase A Screens (desktop — 15 screens) | — |
| 5 | Phase B Screens (desktop — 16 screens) | — |
| 6 | Phase C Screens (desktop — 10 screens) | — |
| 7 | Phase D Screens (desktop — 8 screens) | — |
| 8 | Tablet responsive variants | — |
| 9 | Mobile responsive variants | — |
| 10 | Interactive prototype (key workflows) | — |
| 11 | User flow diagrams | — |
| 12 | Information architecture map | — |
| 13 | Wireframes (low-fi for all screens) | — |
| 14 | High-fidelity mockups | — |
| 15 | Auto Layout components | — |
| 16 | Variables & Design Tokens | — |
| 17 | Developer handoff spec (measurements, code snippets) | — |
| 18 | Export-ready assets (SVG icons, illustrations) | — |
| 19 | Dark mode variants | — |
| 20 | Accessibility compliance checklist | — |

### Key Prototyping Flows to Build
1. **Student Registration** → Add student form → Success → Student list updates
2. **Admission Workflow** → New application → Document upload → Approval → Enrollment
3. **Attendance Recording** → QR scan → Check-in success → Dashboard updates
4. **CBT Examination** → Select exam → Start → Answer questions → Submit → Grade
5. **Fee Payment** → Generate invoice → Payment → Receipt → Balance updates
6. **Result Publishing** → Grade entry → Approve → Publish → Student view
7. **Leave Approval** → Submit request → Chain approval → Status notification
8. **Parent Portal** → Login → View child → Attendance → Results → Fees

---

## 16. Current Implementation Notes for Developer Handoff

### 16.1 Existing Components That Must Be Preserved
The Figma design must account for these existing components. Their functionality is stable:

- `QRScanner` — camera-based scan with jsQR fallback
- `CheckInForm` / `CheckOutForm` — manual + QR attendance
- `StudentCheckinForm` / `StudentCheckoutForm` — student attendance
- `AttendanceStats` / `StudentAttendanceStats` — KPI cards
- `AttendanceTable` / `StudentAttendanceTable` — data tables
- `Nav` — sidebar navigation (to be split into top bar + sidebar)
- `SearchBar` — global search (move from sidebar to top bar)
- `ParadeTasks` / `ParadeSessions` — task management
- `QRCode` — QR display for ID cards
- `TodayBanner` — date display

### 16.2 Key Data Flows (Don't Break These)
- **Auth**: `AuthProvider` → Supabase Auth → role-based redirect
- **Check-In**: QR scan → lookup API → check-in API → dashboard update
- **Attendance Report**: API call → stats + table + chart render
- **Automation**: CRON trigger → engine dispatch → Telegram message → log
- **Student CRUD**: List → Add/Edit → Save → Prefect role assignment
- **Notifications**: Task assigned → Telegram first → SMS fallback → WhatsApp fallback → Queue

### 16.3 Pain Points to Address in Redesign
| Current Issue | Design Solution |
|---|---|
| No pagination on lists | Add pagination + infinite scroll option |
| `confirm()` dialogs | Custom modal component with branded styling |
| Error messages reference SQL | User-friendly error wording |
| CSV download without auth | API-proxied download with loading state |
| 30-sec polling | WebSocket or less frequent polling with manual refresh |
| Monolithic page components | Split into composed sub-components |
| No empty states | Add illustrations and guidance text |
| Loading = spinner only | Skeleton matching content layout |
| No dark mode | CSS variable-based theme switching |

---

## 17. Design System Foundation

### 17.1 Elevation Tokens
| Level | Shadow | Usage |
|---|---|---|
| 0 | None | Flat surfaces |
| 1 | `0 1px 2px rgba(0,0,0,0.05)` | Cards, input fields |
| 2 | `0 4px 6px -1px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| 3 | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, side panels |
| 4 | `0 20px 25px -5px rgba(0,0,0,0.15)` | Full-screen modals |
| 5 | `0 25px 50px -12px rgba(0,0,0,0.25)` | Notification toasts |

### 17.2 Animation Tokens
| Token | Duration | Easing |
|---|---|---|
| Fast | 150ms | ease-in-out |
| Normal | 200ms | ease-in-out |
| Slow | 300ms | ease-out |
| Page transition | 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Modal enter | 200ms | scale(0.95→1) + fade |
| Modal exit | 150ms | scale(1→0.95) + fade |

### 17.3 Iconography
- Use **Lucide Icons** (consistent with current codebase)
- Size scale: 14, 16, 18, 20, 24, 32px
- All icons need hover/active states where interactive
- Custom school crest/logo SVG for branding

---

## 18. File Structure for Figma

```
📁 AFCS Smart Campus
├── 📁 00_Cover
├── 📁 01_Design_System
│   ├── 🎨 Colors (Light + Dark)
│   ├── 🔤 Typography
│   ├── 📐 Spacing & Grid
│   ├── ☀️ Elevation & Shadows
│   ├── ✨ Animation Tokens
│   └── 🖼️ Iconography
├── 📁 02_Component_Library
│   ├── Buttons, Inputs, Selects, ...
│   ├── Data Display (Tables, Cards, Stats)
│   ├── Feedback (Alerts, Toasts, Modals)
│   ├── Navigation (Sidebar, Tabs, Breadcrumbs)
│   └── Charts & Data Viz
├── 📁 03_Screens_Phase_A
│   ├── 📁 Desktop (15 screens)
│   ├── 📁 Tablet (responsive)
│   └── 📁 Mobile (responsive)
├── 📁 04_Screens_Phase_B
│   ├── 📁 Desktop (16 screens)
│   ├── 📁 Tablet
│   └── 📁 Mobile
├── 📁 05_Screens_Phase_C
│   ├── 📁 Desktop (10 screens)
│   ├── 📁 Tablet
│   └── 📁 Mobile
├── 📁 06_Screens_Phase_D
│   ├── 📁 Desktop (8 screens)
│   ├── 📁 Tablet
│   └── 📁 Mobile
├── 📁 07_Prototypes
│   ├── 🎬 Student Registration Flow
│   ├── 🎬 Admission Workflow
│   ├── 🎬 Attendance Recording
│   ├── 🎬 CBT Examination
│   ├── 🎬 Fee Payment
│   ├── 🎬 Result Publishing
│   └── 🎬 Parent Portal
├── 📁 08_User_Flows
├── 📁 09_Info_Architecture
├── 📁 10_Developer_Handoff
└── 📁 11_Assets
```

---

## 19. Developer Handoff Requirements

For each component and screen, Figma should expose:
- **Spacing** between elements (in px)
- **Dimensions** (width/height/flex)
- **Colors** (with hex + token name)
- **Typography** (font, size, weight, line-height, letter-spacing)
- **Auto Layout** constraints (hug/fill, padding, gap)
- **Variants** and their properties
- **Component** descriptions for code mapping

---

## 20. Accessibility Requirements (WCAG AA)

| Criterion | Requirement |
|---|---|
| Color contrast | 4.5:1 for text, 3:1 for large text / UI components |
| Keyboard navigation | All interactive elements reachable via Tab/Shift+Tab |
| Focus indicators | 2px outline with 3:1 contrast (not just color change) |
| Alt text | All icons need `aria-label`, images need `alt` |
| Screen reader | Semantic HTML structure, ARIA landmarks |
| Touch targets | Minimum 44x44px for mobile |
| Error announcements | Screen reader-friendly error messages |
| Motion | Respect `prefers-reduced-motion` |

---

> **Document Version:** 1.0 — July 2026
> **For:** Figma Designer — AFCS Smart Campus UI/UX Redesign
> **Contact:** dewaleprotocols@gmail.com
> **Platform:** https://afcs-smart-campus.vercel.app
