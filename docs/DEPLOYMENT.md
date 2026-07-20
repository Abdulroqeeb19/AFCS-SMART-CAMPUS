# AFCS Smart Campus — Production Deployment Guide

## Prerequisites

| Item | Purpose | Cost |
|------|---------|------|
| **Vercel** (or Railway/Render/Fly.io) | Host the Next.js app | Free–$20/mo |
| **Supabase** | Database + Auth | Free tier works |
| **Domain name** (optional) | Custom domain | ~$10/yr |
| **Telegram Bot** (free) | Staff notifications | Free |
| **WhatsApp Business API** (optional) | Premium notifications | Free–$50/mo |
| **Termii** (optional) | SMS fallback | Pay-per-use |

---

## Step 1: Supabase — Create Project

1. Go to https://supabase.com → **New project**
2. Choose a strong database password — save it
3. Wait for provisioning (~2 min)
4. From **Project Settings → API**, copy:
   - `Project URL` (e.g. `https://xxx.supabase.co`)
   - `anon public key`

---

## Step 2: Database Migrations

In **Supabase SQL Editor**, run these `.sql` files **in order**. Each builds on the previous.

| # | File | What it does |
|---|------|-------------|
| 1 | `001_staff_schema.sql` | `staff`, `academic_sessions`, `classes`, `subjects` tables |
| 2 | `002_seed_data.sql` | Default admin/commandant accounts |
| 3 | `003_student_schema.sql` | `students`, `student_class_history` |
| 4 | `004_student_activity_reports.sql` | `student_activity_log` |
| 5 | `004_student_seed.sql` | Sample students |
| 6 | `005_duty_schema.sql` | `duty_rosters`, `duty_assignments` |
| 7 | `006_duty_seed.sql` | Sample duty slots |
| 8 | `007_parade_schema.sql` | `parades`, `parade_briefings`, `parade_tasks` |
| 9 | `008_parade_seed.sql` | Sample parade data |
| 10 | `009_notifications_schema.sql` | `notification_logs` |
| 11 | `010_security_hardening.sql` | RLS policies, audit triggers |
| 12 | `011_timetable_schema.sql` | `time_slots`, `timetable_entries`, `timetable_generations` |
| 13 | `012_system_prompts.sql` | `system_prompts` for WhatsApp/SMS templates |
| 14 | `013_offline_notifications.sql` | Offline notification queue |
| 15 | `014_student_checkout.sql` | Student checkout tracking |
| 16 | `016_staff_rls_select_policy.sql` | Staff table RLS fix |
| 17 | `017_telegram_notifications.sql` | Telegram notification channels |
| 18 | `018_telegram_bot_token.sql` | `telegram_bot_config` table |
| 19 | `019_fix_rls_for_dev_mode.sql` | Dev mode RLS bypass |
| 20 | `020_restore_rls_for_prod.sql` | Production RLS hardening |
| 21 | `021_task_responses.sql` | `task_responses` table |
| 22 | `022_fix_timetable_slots_classes.sql` | Timetable FK constraints |
| 23 | `023_friday_time_slots.sql` | Friday-specific time slots |
| 24 | `025_automation_ddl.sql` | `automation_rules` table |
| 25 | `025_automation_engine.sql` | Automation engine functions |
| 26 | `026_commandant_todo_rule.sql` | Commandant todo automation |
| 27 | `026_delete_staff_cascade.sql` | Cascade delete for staff |
| 28 | `027_seed_js3_and_sample_students.sql` | JS3 classes + students |
| 29 | `028_rate_limit_logs.sql` | Rate limiting table |
| 30 | `029_commandant_unique_constraint.sql` | Unique constraint on commandant |
| 31 | **`030_prefect_roles.sql`** | Prefect roles & permissions |
| 32 | **`031_update_notification_channels.sql`** | Update 6 automation rules to Telegram |
| 33 | **`032_in_app_notifications.sql`** | `is_read` column on `notification_logs` |
| 34 | **`033_licensing_schema.sql`** | `licenses` table for annual licensing |

> **Files 030–033 are the newest.** Run them last.

### Verify after migrations

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

You should see: `academic_sessions`, `automation_rules`, `classes`, `duty_assignments`, `duty_rosters`, `licenses`, `notification_logs`, `parades`, `parade_briefings`, `parade_tasks`, `staff`, `student_activity_log`, `student_class_history`, `students`, `subjects`, `system_prompts`, `task_responses`, `telegram_bot_config`, `time_slots`, `timetable_entries`, `timetable_generations`.

---

## Step 3: Environment Variables

Copy `.env.example` → `.env.local` and fill in:

```bash
# === REQUIRED ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                    # from Supabase API settings
NEXT_PUBLIC_DEV_MODE=false

# === AI ASSISTANT ===
AI_PROVIDER=openai                                      # or gemini, ollama
AI_API_KEY=sk-...                                       # https://platform.openai.com/api-keys
GEMINI_API_KEY=...                                      # https://aistudio.google.com/apikey (optional)
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_AI_PROVIDER=openai
# Ollama (local only — not for Vercel):
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=qwen3:4b

# === CAPTCHA (optional — Cloudflare Turnstile) ===
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAA...

# === ATTENDANCE ===
NEXT_PUBLIC_ATTENDANCE_CUTOFF_HOUR=8
NEXT_PUBLIC_ATTENDANCE_CUTOFF_MINUTE=0

# === WHATSAPP (premium) ===
WHATSAPP_API_TOKEN=                                     # Meta permanent token
WHATSAPP_PHONE_NUMBER_ID=                               # from WhatsApp Manager
WHATSAPP_VERIFY_TOKEN=afcs_webhook_2026
WHATSAPP_TEMPLATE_DUTY=duty_assignment
WHATSAPP_TEMPLATE_TASK=task_assignment
WHATSAPP_TEMPLATE_PERIOD=period_reminder
WHATSAPP_TEMPLATE_BROADCAST=broadcast_announcement

# === SMS FALLBACK (pick one) ===
TERMII_API_KEY=                                         # https://termii.com
TERMII_SENDER_ID=AFCS Campus
# or
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=

# === TELEGRAM (free — recommended over WhatsApp) ===
TELEGRAM_BOT_TOKEN=8832772526:AAHxSERfP4ZXmt5av...     # from @BotFather

# === AUTOMATION ===
CRON_SECRET=a-random-string-at-least-32-chars           # used by cron jobs
MAKE_WEBHOOK_URL=                                       # optional — Make.com
N8N_WEBHOOK_URL=                                        # optional — n8n
```

---

## Step 4: Deploy to Vercel

### Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Via Dashboard

1. Push to GitHub
2. Go to https://vercel.com → **Add New Project** → Import your repo
3. Framework preset: **Next.js**
4. Add all environment variables from Step 3
5. Deploy

### After deploy — set env vars in Vercel

**Vercel Dashboard → Project → Settings → Environment Variables**

Add every variable from `.env.local`. Mark `NEXT_PUBLIC_*` as **Public**.

---

## Step 5: Cron Job (Automation Engine)

The automation engine checks rules every morning at 06:00.

### Option A: Vercel Cron (Pro plan)
Already configured in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/automation/engine", "schedule": "0 6 * * *" }
  ]
}
```

### Option B: cron-job.org (Free)
1. Go to https://cron-job.org → Create account
2. New job:
   - URL: `https://your-site.vercel.app/api/automation/engine`
   - Schedule: `Every day at 06:00`
   - Method: `GET`
   - Add header: `x-cron-secret: <your CRON_SECRET>`

---

## Step 6: First Login

1. Visit `https://your-site.vercel.app/login`
2. Default credentials:
   - **Admin:** `admin@afcs.edu.ng` / `Admin@12345`
   - **Commandant:** `commandant@afcs.edu.ng` / `Commandant@12345`
3. **Immediately change passwords** in Settings.

---

## Step 7: Generate a License Key

1. Go to **Settings → License**
2. Click **Generate License**
3. Choose:
   - **Essential** — attendance, duty roster, reports
   - **Professional** — adds AI timetable, Telegram bot, automation, muster, prefects, AI assistant
   - **Enterprise** — adds WhatsApp/SMS, notifications hub, dedicated support
4. Enter school name + duration (1–5 years)
5. Click **Generate License Key**
6. The key (`AFCSSMART-XXXX-XXXX-XXXX`) appears immediately

> If the generate button does nothing, the `licenses` table was not created. Run `033_licensing_schema.sql` in Supabase SQL Editor.

---

## Step 8: Seed Academic Data

1. **Setup → Subjects** → Add: Mathematics, English, Physics, Chemistry, Biology, etc.
2. **Setup → Teacher Assignments** → Assign each subject to teachers
3. **Setup → Classes** → Assign subjects to each class
4. **Timetable → Generate** → Select term → **Generate Timetable**
5. Check diagnostics for skipped entries

---

## Step 9: Configure Telegram Bot (Free Notifications)

1. Open Telegram → search **@BotFather** → `/newbot` → name it "AFCS Smart Campus"
2. Copy the token → set as `TELEGRAM_BOT_TOKEN` in Vercel env vars
3. Re-deploy
4. In the web app, go to **Settings → Telegram** → click **Test Bot**
5. Staff register by sending `/start` to your bot on Telegram
6. Once registered, they receive duty assignments, parade tasks, and broadcast alerts

> Telegram replaces WhatsApp entirely for free. No Meta account needed.

---

## Step 10: Configure WhatsApp (Premium Notifications)

1. Create Meta Business Account: https://business.facebook.com
2. Register phone: https://business.whatsapp.com
3. Generate permanent access token
4. Set `WHATSAPP_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in Vercel
5. Set webhook in Meta: `https://your-site.vercel.app/api/whatsapp/webhook`

---

## Step 11: Automation Hub

1. Go to **Automation Hub**
2. Toggle on rules:
   - **Duty Roster Assignment Alert** — fires when rosters are generated
   - **Task Assignment Notification** — fires when tasks are created
   - **Commandant To-Do Reminder** — daily check-in reminders
   - **Check-in Reminder** — 8 AM weekday alert to staff
   - **Next Period Alert** — announces upcoming periods
3. Set notification channels (Telegram / WhatsApp / SMS / In-App)

---

## Step 12: Prefect Roles

After running `030_prefect_roles.sql`:

1. Go to **Students** → select a student → **Assign Prefect Role**
2. Available roles: Head Boy, Head Girl, Sports Prefect, Health Prefect, Library Prefect, Labor Prefect
3. Prefects get a badge on their profile and appear in the Prefect listing
4. Automations can send prefect-specific notifications

---

## License Tiers & Features

| Feature | Essential | Professional | Enterprise |
|---------|:---------:|:------------:|:----------:|
| Attendance tracking | ✓ | ✓ | ✓ |
| Duty roster | ✓ | ✓ | ✓ |
| Reports & analytics | ✓ | ✓ | ✓ |
| AI Timetable generator | — | ✓ | ✓ |
| Telegram bot | — | ✓ | ✓ |
| Automation engine | — | ✓ | ✓ |
| Muster parade | — | ✓ | ✓ |
| Prefect roles | — | ✓ | ✓ |
| Daily reports | — | ✓ | ✓ |
| Global search | — | ✓ | ✓ |
| AI Assistant | — | ✓ | ✓ |
| WhatsApp/SMS | — | — | ✓ |
| Notifications hub | — | — | ✓ |
| Dedicated support | — | — | ✓ |

### Pricing (suggested annual)

| Tier | Annual License |
|------|:--------------:|
| **Essential** | $500 / school |
| **Professional** | $2,000 / school |
| **Enterprise** | $5,000 / school (unlimited branches) |

### How to renew

1. In Settings → License, click **Generate New**
2. Select new duration
3. Old key is replaced automatically
4. The 30-day expiry banner gives staff advance notice

---

## Architecture Overview

```
User Browser
    ↓
Vercel (Next.js App Router)
    ↓
Supabase (PostgreSQL + Auth)
    ↓
Telegram / WhatsApp / SMS  ───  Staff & Parents
```

- **Auth**: Supabase Auth with magic link + password
- **Database**: PostgreSQL via Supabase (row-level security)
- **Storage**: Supabase Storage for media (profile photos, documents)
- **Cron**: Vercel Cron or cron-job.org for scheduled automations
- **Notifications**: Multi-channel (Telegram → WhatsApp → SMS → In-App)

---

## Updated Role-Based Access

| Page / Feature | Commandant | Admin | Teacher | Support | Prefect |
|----------------|:----------:|:-----:|:-------:|:-------:|:-------:|
| Commandant Dashboard | ✓ | — | — | — | — |
| Admin Dashboard | — | ✓ | — | — | — |
| My Tasks | ✓ | ✓ | ✓ | ✓ | — |
| Check In/Out | ✓ | ✓ | ✓ | ✓ | — |
| Student Check-in | ✓ | ✓ | ✓ | — | ✓ |
| Staff Management | ✓ | ✓ | — | — | — |
| Student Attendance | ✓ | ✓ | ✓ | — | — |
| Student Management | ✓ | ✓ | — | — | — |
| Timetable | ✓ | ✓ | ✓ | — | — |
| Timetable Setup | ✓ | ✓ | — | — | — |
| Duty Roster | ✓ | ✓ | ✓ | — | — |
| Automation Hub | ✓ | ✓ | — | — | — |
| Settings | ✓ | ✓ | — | — | — |
| Notifications | ✓ | ✓ | — | — | — |
| Prefect Panel | ✓ | ✓ | — | — | ✓ |

---

## Troubleshooting

### "Failed to fetch" / 500 on API routes
- Check env vars are set in Vercel dashboard
- Verify Supabase project is not paused

### License key not generating
- Run `033_licensing_schema.sql` in Supabase SQL Editor
- Ensure you're logged in as `admin` or `commandant`

### Telegram bot not responding
- Set `TELEGRAM_BOT_TOKEN` and re-deploy
- Go to Settings → Telegram → click **Test Bot**
- Bot must be started: send `/start` in Telegram

### AI Assistant not working
- Check `AI_API_KEY` is set
- Check `AI_PROVIDER` (openai / gemini)
- For Ollama, ensure the tunnel is running (not for Vercel)

### Login not working
- `NEXT_PUBLIC_DEV_MODE` must be `false` in production
- Default accounts: run `002_seed_data.sql` if not already done

### Build failing
- `npm install` first
- Check Node.js version ≥ 18

---

## Feature Completion Status

| Feature | Status |
|---------|:------:|
| Staff & Student Attendance | 100% |
| Duty Roster & Reports | 100% |
| Parade Muster & Tasks | 100% |
| AI Timetable Generator | 95% |
| Security & Audit (RLS, rate limits) | 100% |
| Multi-channel Notifications (Telegram/WhatsApp/SMS) | 100% |
| Automation Engine | 90% |
| In-App Notification Bell | 100% |
| Prefect Roles | 100% |
| Annual Licensing System | 100% |
| System Prompts & Templates | 100% |
| E-Examination Platform | 0% |
| Parent Portal & Communication | 0% |
| Asset & Inventory Management | 0% |
| AI Predictive Analytics | 0% |
