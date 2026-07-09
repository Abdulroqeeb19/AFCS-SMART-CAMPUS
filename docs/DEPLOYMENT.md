# AFCS Smart Campus — Deployment Guide

## Prerequisites

1. **Vercel Account** (or any Node.js hosting — Railway, Render, Fly.io)
2. **Supabase Project** (free tier works for JS1-SS3)
3. **Meta Business Account** for WhatsApp Cloud API
4. **Termii Account** (optional, for SMS fallback)
5. **Domain Name** (optional but recommended)

---

## Step 1: Supabase Setup

1. Go to https://supabase.com → Create new project
2. Copy your project URL and anon key from **Settings → API**
3. In your Supabase SQL Editor, run migrations in order:
   - `001_staff_schema.sql` through `013_offline_notifications.sql`
4. After all migrations, verify tables exist: `academic_sessions`, `staff`, `classes`, etc.

## Step 2: Environment Variables

```bash
# .env.local — copy from .env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # optional
TURNSTILE_SECRET_KEY=             # optional

# WhatsApp (for staff notifications)
WHATSAPP_API_TOKEN=your-permanent-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id

# SMS fallback (for staff without smartphones)
TERMII_API_KEY=                   # optional
# or
AFRICAS_TALKING_API_KEY=         # optional
AFRICAS_TALKING_USERNAME=
```

## Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Set all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

## Step 4: WhatsApp Cloud API Setup

1. Go to https://business.facebook.com → Create Business Account
2. Go to https://business.whatsapp.com → Register phone number
3. Generate permanent access token
4. Find Phone Number ID in WhatsApp Manager
5. Set `WHATSAPP_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in Vercel

## Step 5: Seed Academic Data

After login as admin/commandant:

1. **Setup → Subjects** → Add: Mathematics, English, Physics, Chemistry, Biology, etc.
   - Set difficulty tier: Maths/English = 1 (hard), Sciences = 2, Arts = 4
   - Check "2x period" for practical subjects (Physics, Chemistry, Biology, CS)
2. **Setup → Teacher Assignments** → Assign each subject to at least one teacher
3. **Setup → Classes** → Assign each subject to each class (JSS1A-C, JSS2A-C, etc.)
4. **Timetable → Generate** → Select term → Click Generate Timetable
5. Check diagnostics if anything was skipped

## Step 6: Configure Automation

1. **Automation Hub →** Toggle on:
   - Duty Roster Assignment Alert (fires when rosters are generated)
   - Task Assignment Notification (fires when tasks are created)
2. **System Config → Prompts** → Edit WhatsApp templates as needed

## Step 7: Set Up Cron Jobs

For scheduled automations (check-in reminders, period alerts, daily summaries):

### Option A: Vercel Cron (Pro plan)
Create `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/timetable/next-period", "schedule": "*/30 8-14 * * 1-5" }
  ]
}
```

### Option B: cron-job.org (Free)
1. Go to https://cron-job.org
2. Create job → URL: `https://your-site.vercel.app/api/timetable/next-period`
3. Schedule: Every 30 minutes, Mon-Fri 8:00-14:00

### Option C: GitHub Actions
```yaml
name: Cron
on:
  schedule:
    - cron: '30 8 * * 1-5'  # 8:30 AM weekdays
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST https://your-site.vercel.app/api/timetable/next-period
```

---

## Role-Based Access Summary

| Page | Commandant | Admin | Teacher | Support |
|------|:----------:|:-----:|:-------:|:-------:|
| Commandant Dashboard | ✓ | — | — | — |
| Admin Dashboard | — | ✓ | — | — |
| My Tasks | ✓ | ✓ | ✓ | ✓ |
| Check In/Out | ✓ | ✓ | ✓ | ✓ |
| Manage Staff | ✓ | ✓ | — | — |
| Student Attendance | ✓ | ✓ | ✓ | — |
| Manage Students | ✓ | ✓ | — | — |
| Timetable | ✓ | ✓ | ✓ | — |
| Timetable Setup | ✓ | ✓ | — | — |
| Duty Roster | ✓ | ✓ | ✓ | — |
| Automation Hub | ✓ | ✓ | — | — |
| Settings | ✓ | ✓ | — | — |
| System Config | ✓ | ✓ | — | — |
| Notifications | ✓ | ✓ | — | — |

---

## Investor Pitch Points

**Current Completion: ~72%**
- ✅ Staff & Student Attendance (100%)
- ✅ Duty Roster & Reports (100%)
- ✅ Parade Muster & Tasks (100%)
- ✅ AI Timetable Generator (95%)
- ✅ Security & Audit (100%)
- ✅ WhatsApp/SMS Notifications (100%)
- ✅ System Prompts & Automation (90%)
- ❌ E-Examination Platform (0%) — Pain point
- ❌ Parent Portal & Communication (0%) — Pain point
- ❌ Asset & Inventory Management (0%) — Pain point
- ❌ AI Predictive Analytics (0%) — Pain point

**ROI for AFCS:**
- Eliminates manual register-taking (saves 30+ hours/week)
- Zero-cost paper registers
- Real-time commandant oversight
- WhatsApp notifications cost less than paper memos
- Timetable generation saves 2 weeks of headmaster time per term
