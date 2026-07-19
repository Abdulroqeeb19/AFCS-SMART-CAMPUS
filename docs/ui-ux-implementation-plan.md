# UI/UX Implementation Plan — What Needs to Change

> Analysis of what's required to make the Figma designs work effectively in the AFCS Smart Campus web app, based on current codebase audit.

---

## 🏗️ Foundation: Architecture Changes Required

### 1. Theme System (Dark/Light Mode)
**Current state:** No theme system exists. Colors are hardcoded.

**What's needed:**
- Install `next-themes` or build a custom `ThemeProvider`
- Convert ALL hardcoded colors to CSS variable references
- CSS variables file with light + dark token sets
- Theme toggle in the top navigation bar
- `prefers-color-scheme` media query as default
- Persist preference in `localStorage`

**Files to create/modify:**
```
src/providers/theme-provider.tsx          ← Create
src/app/globals.css                       ← Add :root + .dark variable sets
src/components/theme-toggle.tsx           ← Create (sun/moon icon button)
src/app/layout.tsx                        ← Wrap with ThemeProvider
ALL components/*.tsx                      ← Replace hardcoded colors with CSS vars
```

**Example CSS variable structure:**
```css
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f4f4f5;
  --color-bg-sidebar: #001A4D;
  --color-text-primary: #18181b;
  --color-text-secondary: #52525b;
  --color-border: #e4e4e7;
  --color-sidebar-text: #ffffff;
}
.dark {
  --color-bg-primary: #09090b;
  --color-bg-secondary: #18181b;
  --color-bg-sidebar: #0f0f1a;
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-border: #27272a;
  --color-sidebar-text: #e4e4e7;
}
```

---

### 2. Layout Restructuring
**Current state:** Single `<Nav>` sidebar component. No top navigation bar.

**What's needed:**
Replace the current layout with a **top nav + left sidebar** structure:

```
┌─────────────────────────────────────────┐
│ Top Nav: Logo | Search Ctrl+K | Notif │ Avatar │
├──────────┬──────────────────────────────┤
│ Sidebar  │ Main Content Area            │
│ (collaps)│                              │
│          │                              │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Files to restructure:**
```
src/app/layout.tsx                        ← New top nav + sidebar wrapper
src/components/top-nav.tsx                ← Create (search, notifications, avatar)
src/components/sidebar.tsx                ← Refactor from nav.tsx (icon-collapsible)
src/components/nav.tsx                    ← Deprecate/delete
```

**Key behaviors:**
- Top nav: 56px fixed height, `z-30`, blur backdrop
- Sidebar: 240px expanded / 64px collapsed, smooth transition
- Mobile: sidebar hidden, hamburger in top nav
- Search: global `Ctrl+K` trigger from top nav
- Notifications: bell icon with real-time badge count

---

### 3. Component Library Build
**Current state:** Ad-hoc components with inconsistent styling.

**What's needed:**
Systematically rebuild all UI components with proper variants, states, and theming support.

| Priority | Component | Current State | Action |
|---|---|---|---|
| P0 | Button | Basic, few variants | Rebuild: Primary, Secondary, Outline, Ghost, Danger + loading |
| P0 | Input | Styled only | Add error, disabled, icon-left, icon-right states |
| P0 | Select | Styled only | Add searchable, multi-select variants |
| P0 | Card | Good foundation | Add clickable, with-icon, with-badge variants |
| P0 | Modal | None (uses confirm/alert) | Create with overlay, close, keyboard trap |
| P0 | Table | Direct HTML tables | Create DataTable: sort, filter, paginate, select |
| P0 | Badge | Good | Standardize: success, warning, danger, info, neutral |
| P1 | Toast/Notification | None | Create positioned toast stack with auto-dismiss |
| P1 | Skeleton | Basic | Create shape-matched skeletons (card, table, chart) |
| P1 | Pagination | None | Create page number + prev/next component |
| P1 | Tabs | Inline buttons | Create pill + underline variants |
| P1 | Progress Bar | None | Create determinate + indeterminate |
| P1 | Date Picker | Native HTML | Create styled with month navigation |
| P1 | File Upload | None | Create drag-and-drop zone |
| P1 | Breadcrumb | None | Create auto-generating from pathname |
| P2 | Chart | None (planned) | Create bar, line, pie wrappers |
| P2 | Calendar | None | Create month grid + event dots |

**Implementation approach:** Create `src/components/ui/` directory with each component as a standalone file, following this pattern:
```tsx
// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading && <Spinner className="mr-2" />}
        {children}
      </button>
    )
  }
)
```

---

### 4. New User Roles Infrastructure
**Current state:** 4 roles (commandant, admin, teacher, support) hardcoded in `ROLES` constant.

**Figma spec adds:** Vice Principal, ICT Administrator, Bursary, Parents, Students

**What's needed:**
```
src/app/api/roles/route.ts               ← CRUD for roles
src/db/migrations/032_roles_schema.sql    ← roles table + permissions
src/lib/permissions.ts                    ← Permission evaluation utility
src/contexts/auth-context.tsx             ← Update user type with permissions
```

**Database schema:**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  hierarchy_level INTEGER NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id),
  module VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false
);
```

---

## 🎨 Phase A: Redesign Existing Screens

### A1–A2: Login & Forgot Password (`/login`, `/forgot-password`)
**Current:** `LoginForm`, `ForgotPasswordForm` — functional but unbranded.

**Changes needed:**
- Full-page layout with school crest/logo on the left
- Card-based form on the right
- Background: subtle pattern or gradient (NAF blue)
- CAPTCHA inline below password field
- "AFCS Smart Campus" branding + school name
- Links: Forgot password? | Sign up | Back to home

**Files:**
```
src/app/login/page.tsx                    ← Restructure layout
src/components/login-form.tsx             ← Redesign with new Input/Button
src/components/forgot-password-form.tsx   ← Redesign
```

---

### A3–A4: Dashboards (`/dashboard`, `/admin`, `/teacher-dashboard`)
**Current:** 3 separate dashboards. Commandant has 30-sec polling.

**Changes needed:**
- Unified KPI card row with trend indicators
- Charts section (attendance trend, department breakdown)
- Widget grid: Today's Activities, Calendar, Quick Actions, Pending Approvals
- Role-based widget visibility (commandant gets everything, admin gets subset)
- AI Insights panel as collapsible section
- All styled with new Card/StatCard/Chart components

**Files:**
```
src/app/dashboard/dashboard-content.tsx   ← Full redesign
src/app/admin/page.tsx                    ← Full redesign
src/components/class-teacher-dashboard.tsx ← Full redesign
src/components/kpi-cards.tsx              ← Create
src/components/chart-widget.tsx           ← Create
src/components/activity-feed.tsx          ← Create
```

---

### A5–A7: Student Management (`/students`)
**Current:** `students-list.tsx` — 471 lines, no pagination, uses `confirm()`.

**Changes needed:**
- Student list → DataTable with sort/filter/pagination
- Student card grid view option (for smaller screens)
- Add student → Modal form (not separate page)
- Edit student → Slide-out panel
- Student detail → Full detail view with tabs:
  - Profile (info, prefect role, parent contacts)
  - Attendance history (with mini chart)
  - Activity reports
- Prefect role assignment → Inline dropdown in table

**Files:**
```
src/app/students/page.tsx                 ← Redesign
src/app/students/students-list.tsx        ← Redesign (or split into table + detail)
src/components/student-detail.tsx         ← Create
src/components/student-form-modal.tsx     ← Create
```

---

### A8–A9: Staff Management (`/staff`)
**Current:** `staff-list.tsx` — 620 lines, similar issues to students.

**Changes needed:**
- Same DataTable pattern as students
- Staff detail: Profile, Attendance record, Duty history, Subjects assigned
- Department filter pills at top
- Staff card grid view for directory-style browsing
- Role badge with color coding

**Files:**
```
src/app/staff/page.tsx                    ← Redesign
src/app/staff/staff-list.tsx              ← Redesign
src/components/staff-detail.tsx           ← Create
```

---

### A10–A11: Parent Portal & Admissions (New)
**Current:** Not built.

**Files to create:**
```
src/app/parents/page.tsx                  ← Parent dashboard
src/app/parents/children/[id]/page.tsx    ← Child detail view
src/app/admissions/page.tsx               ← Admissions overview
src/app/admissions/apply/page.tsx         ← Application form
src/app/admissions/[id]/page.tsx          ← Application detail
src/db/migrations/033_admissions.sql      ← Admissions tables
```

---

### A12: School Homepage (`/`)
**Current:** Basic landing page with hero + features + about.

**Changes needed:**
- Full marketing landing page
- Hero section with school image/gradient
- Feature grid (12 modules as cards)
- Stats counter row (80+ staff, 3000+ students, etc.)
- CTA section (Request Demo, Contact Us)
- Footer with school info, links, social

**Files:**
```
src/app/page.tsx                          ← Redesign
src/components/landing/hero.tsx           ← Create
src/components/landing/features.tsx       ← Create
src/components/landing/stats.tsx          ← Create
src/components/landing/footer.tsx         ← Create
```

---

### A13–A15: User/Role Management, Audit Logs (New)
**Files to create:**
```
src/app/settings/users/page.tsx           ← User CRUD
src/app/settings/roles/page.tsx           ← Role management
src/app/settings/audit/page.tsx           ← Audit log viewer
src/app/api/users/route.ts                ← User management API
src/app/api/roles/route.ts                ← Role CRUD API
src/app/api/audit/route.ts                ← Audit log API
```

---

## 📐 Phase B: Learning Management (New)

### Database Schema Needed
```sql
CREATE TABLE courses (...);
CREATE TABLE lessons (...);
CREATE TABLE assignments (...);
CREATE TABLE submissions (...);
CREATE TABLE exam_questions (...);
CREATE TABLE cbt_sessions (...);
CREATE TABLE gradebook (...);
CREATE TABLE report_cards (...);
```

### API Routes Needed
```
POST /api/courses          GET /api/courses/[id]
POST /api/lessons
POST /api/assignments      POST /api/assignments/[id]/submit
POST /api/exams            POST /api/exams/[id]/start
POST /api/exams/[id]/answer
POST /api/results/process  GET /api/results/report-card
POST /api/gradebook
```

### Screens (16 total)
| Screen | Route | Key Component |
|---|---|---|
| Course List | `/academics/courses` | DataTable + card grid |
| Course Detail | `/academics/courses/[id]` | Tabs: syllabus, lessons, assignments |
| Lesson Viewer | `/academics/lessons/[id]` | Rich content viewer |
| Assignment Upload | `/academics/assignments/create` | Form with file upload |
| Assignment Submit | `/academics/assignments/[id]` | Submission form |
| Teacher Dashboard | `/teacher-dashboard` | Expanded with academic data |
| Student Dashboard | `/student-dashboard` | My courses, grades, timetable |
| CBT Dashboard | `/exams` | Upcoming exams, results |
| Exam Interface | `/exams/[id]/take` | Timer, questions, navigation |
| Question Builder | `/exams/questions/create` | MCQ/Theory builder |
| Question Bank | `/exams/questions` | Searchable question library |
| Result Processing | `/academics/results` | Approve/publish workflow |
| Gradebook | `/academics/gradebook` | Per-class grade table |
| Report Card | `/academics/report-cards/[id]` | Printable PDF view |
| Academic Analytics | `/academics/analytics` | Charts: performance, trends |
| Timetable | `/timetable` | Visual drag grid |

---

## 📊 Phase C: Attendance & Documents

### C1–C4: Attendance Redesign
**Current:** Separate student and staff attendance pages.

**Changes needed:**
Unify attendance under one `/attendance` namespace with filters:
```
/attendance                    ← Overview (all)
/attendance/staff              ← Staff-specific
/attendance/students           ← Student-specific
/attendance/qr                 ← QR scanner page
/attendance/reports            ← Report builder
```

**New components:**
```
src/components/attendance/qr-scanner-modal.tsx    ← Camera overlay with viewfinder
src/components/attendance/qr-result-card.tsx      ← Scan result with photo + name
src/components/attendance/attendance-chart.tsx    ← Trend line chart
src/components/attendance/report-builder.tsx      ← Date range + filters + export
```

### C5–C6: Leave & Approval Workflow (New)
```
src/app/attendance/leave/page.tsx              ← Leave requests
src/app/attendance/leave/create/page.tsx       ← New request
src/app/approvals/page.tsx                     ← Pending approvals
src/app/api/leave/route.ts                     ← Leave CRUD API
src/db/migrations/034_leave.sql                ← Leave requests table
```

### C7–C10: Documents & Workflows (New)
```
src/app/documents/page.tsx                     ← Document library
src/app/documents/[id]/page.tsx                ← Document viewer
src/app/workflows/page.tsx                     ← Workflow dashboard
src/db/migrations/035_documents.sql            ← Documents table
```

---

## 💰 Phase D: Finance Module (New)

### Database Schema Needed
```sql
CREATE TABLE fee_structures (...);
CREATE TABLE invoices (...);
CREATE TABLE payments (...);
CREATE TABLE transactions (...);
CREATE TABLE budgets (...);
```

### API Routes Needed
```
GET /api/finance/summary          POST /api/finance/invoices
GET /api/finance/invoices         GET /api/finance/invoices/[id]
POST /api/finance/payments        GET /api/finance/payments
GET /api/finance/outstanding      GET /api/finance/reports
POST /api/finance/budgets         GET /api/finance/budgets
```

### Screens (8 total)
| Screen | Route | Key Component |
|---|---|---|
| Fees Dashboard | `/finance` | KPI row: collected, outstanding, targets |
| Invoice Generation | `/finance/invoices/create` | Form with class/student selector |
| Payment History | `/finance/payments` | Filterable data table |
| Outstanding Fees | `/finance/outstanding` | Table with reminder actions |
| Revenue Dashboard | `/finance/revenue` | Charts: daily/monthly/termly |
| Financial Reports | `/finance/reports` | P&L, balance sheet export |
| Budget Management | `/finance/budgets` | Create/track department budgets |
| Transaction Detail | `/finance/transactions/[id]` | Single transaction audit |

---

## 🔧 Non-Negotiable Technical Prerequisites

These must be done BEFORE or IN PARALLEL with the UI redesign:

### 1. CSS Variable Migration
All hardcoded color classes (`text-[#001A4D]`, `bg-[#001A4D]`, `border-blue-800`, etc.) must be replaced with CSS variable references:
```tsx
// BEFORE
<nav className="bg-[#001A4D]">
<button className="text-[#C9A84C]">

// AFTER
<nav className="bg-sidebar">
<button className="text-accent">
```

### 2. Pagination for All Lists
Current student/staff lists load ALL records. Must add:
- Server-side pagination (page + limit params)
- Client-side page navigation component
- Optional: virtual scrolling for large lists

### 3. Modal Component (Replace confirm/alert)
All `confirm()` and `alert()` calls must be replaced with a proper `<ConfirmDialog>` component:
```tsx
const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

// Usage
<ConfirmDialog
  open={!!confirmState}
  title="Delete Student"
  message="This action cannot be undone."
  variant="danger"
  onConfirm={() => handleDelete(id)}
  onCancel={() => setConfirmState(null)}
/>
```

### 4. Unified Loading/Empty/Error States
Every page currently handles these states ad-hoc. Create standardized:
- `<PageSkeleton variant="table" />` — matches table height/columns
- `<PageSkeleton variant="cards" />` — matches card grid
- `<EmptyState icon={Users} title="No students" action="Add your first student" />`
- `<ErrorState message="Failed to load" onRetry={refetch} />`

### 5. Responsive Table → Card Switch
Tables on mobile must convert to card lists:
```tsx
<div className="hidden md:block">
  <DataTable ... />  {/* Desktop: table */}
</div>
<div className="md:hidden space-y-3">
  {items.map(i => <MobileCard item={i} />)}  {/* Mobile: cards */}
</div>
```

### 6. API Route Audit
Direct Supabase queries from client components (found in `/notifications`, `/settings/prompts`, `/timetable`) must be moved behind API routes for consistent auth, caching, and error handling.

---

## 📦 Implementation Order (Recommended)

### Sprint 1: Foundation (Week 1-2)
1. CSS variable system + dark/light theme provider
2. Layout restructure (top nav + collapsible sidebar)
3. Core UI component library (Button, Input, Select, Card, Badge, Modal)
4. Global search in top nav (move from sidebar)

### Sprint 2: Phase A Redesign (Week 3-4)
5. Login + Forgot Password redesign
6. Commandant Dashboard redesign (KPIs + charts + widgets)
7. Admin Dashboard redesign
8. Teacher Dashboard redesign

### Sprint 3: Phase A Data Pages (Week 5-6)
9. Student Management redesign (table + detail + form)
10. Staff Management redesign (table + detail)
11. Pagination + DataTable component
12. ConfirmDialog replacement across all pages

### Sprint 4: Phase A Remaining (Week 7-8)
13. Landing page redesign
14. User management + roles
15. Audit log viewer
16. Settings pages redesign
17. All remaining Phase A screens

### Sprint 5: Phase C Attendance (Week 9-10)
18. Unified attendance page redesign
19. QR scanner UI (camera overlay modal)
20. Attendance reports builder
21. Leave request + approval workflow

### Sprint 6: Phase B LMS (Week 11-14)
22. Courses + Lessons + Assignments CRUD
23. Teacher/Student academic dashboards
24. CBT exam interface
25. Result processing + report cards
26. Timetable visual grid

### Sprint 7: Phase D Finance (Week 15-16)
27. Fee dashboard + invoice generation
28. Payment tracking + receipts
29. Financial reports + budgets

### Sprint 8: Polish (Week 17-18)
30. Mobile responsive audit
31. Dark mode QA
32. Accessibility audit (WCAG AA)
33. Performance optimization
34. Beta testing with actual users

---

## ⚡ Quick Wins (Can Do Immediately)

These require minimal code changes but make a noticeable UX improvement:

| Change | Effort | Impact |
|---|---|---|
| Replace `confirm()` with a styled `ConfirmDialog` | Low | High |
| Add loading skeletons to list pages | Low | High |
| Add empty state illustrations to tables | Low | Medium |
| Standardize all buttons to `Button` component | Low | Medium |
| Add hover tooltips to sidebar collapsed icons | Low | Medium |
| Add page transition animations | Medium | Medium |
| Add breadcrumb navigation | Medium | Medium |
| Implement responsive table→cards switch | Medium | High |

---

## 📋 Summary Table

| Layer | Files to Create | Files to Modify | Effort |
|---|---|---|---|
| Theme System | 3 | 1 | Small |
| Layout | 2 | 1 | Small |
| UI Components | ~15 | 0 | Medium |
| Phase A Redesign | ~8 | ~12 | Large |
| Phase B LMS | ~30 | ~5 | Very Large |
| Phase C Attendance | ~10 | ~8 | Large |
| Phase D Finance | ~15 | ~0 | Very Large |
| New DB Migrations | ~6 | 0 | Medium |
| New API Routes | ~30 | ~5 | Large |
| **Total** | **~119** | **~32** | **~18 weeks** |
