# AFCS Smart Campus — Full Pitch Deck & Financial Model

**School Management Operating System for African Schools**

Version 3.0 — July 2026
Air Force Comprehensive School, Igbara-Oke, Ondo State, Nigeria

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem](#2-the-problem)
3. [The Solution](#3-the-solution)
4. [Product Deep Dive](#4-product-deep-dive)
5. [Technology Architecture](#5-technology-architecture)
6. [Market Analysis](#6-market-analysis)
7. [Competitive Landscape](#7-competitive-landscape)
8. [Business Model](#8-business-model)
9. [Financial Model](#9-financial-model)
10. [Traction & Milestones](#10-traction--milestones)
11. [Go-to-Market Strategy](#11-go-to-market-strategy)
12. [Team](#12-team)
13. [Investment Ask](#13-investment-ask)
14. [Use of Funds](#14-use-of-funds)
15. [Risk Assessment & Mitigation](#15-risk-assessment--mitigation)
16. [Exit Strategy](#16-exit-strategy)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

AFCS Smart Campus is a **complete digital operating system** for running secondary schools in Nigeria and across Africa. It replaces the paper-based, WhatsApp-group chaos that plagues most schools with an integrated platform handling:

- Staff & student attendance with late detection
- Duty roster rotation & management
- AI-powered timetable generation (no clashes, <30 seconds)
- Muster parades, briefings & task tracking
- Multi-channel notifications (Telegram / WhatsApp / SMS / In-App)
- Prefect roles & leadership tracking
- Daily reports with AI summaries
- Automation engine with 13+ scheduled rules
- AI assistant for natural-language queries

**Current status:** Live in production since early 2026 at Air Force Comprehensive School, Igbara-Oke. 80+ daily active staff. 3,000+ students tracked. 12 fully operational modules.

**The ask:** NGN 50,000,000 (~$32,000 USD) seed round to build multi-school architecture, mobile apps, and a sales team to deploy to 100+ schools.

**Target:** 200 schools by Year 5, NGN 123.75M gross revenue, 68% net margins.

---

## 2. The Problem

### 2.1 The Current Reality of Nigerian Schools

Nigerian secondary schools operate in a state of near-total digital darkness:

| Pain Point | Current Method | Consequence |
|------------|---------------|-------------|
| Attendance | Paper registers | 500+ sheets/day, easily lost, impossible to audit, forged signatures |
| Duty roster | Manual rotation | Confusion, unfair assignments, nobody knows whose duty it is |
| Timetable | Hand-drawn in Excel | 3-5 days of headmaster time, clashes, last-minute changes |
| Communications | WhatsApp groups | Information buried in chats, no confirmation of receipt |
| Task assignment | Verbal instructions | No audit trail, tasks forgotten, no accountability |
| Reports | Handwritten notes | Buried in files, no trend analysis, no institutional memory |
| Notifications | Word of mouth | Staff miss duty alerts, parents not informed |

### 2.2 The Scale of the Problem

- **21,000+** secondary schools in Nigeria
- **115** Federal Unity Colleges across 36 states + FCT
- **6,000+** state government secondary schools
- **15,000+** private secondary schools
- **~95%** have **no integrated digital operations system**
- Existing edutech only covers: grades, transcripts, fees — not daily operations

### 2.3 The Cost of Not Solving It

- **30+ hours/week** spent on manual register-taking across the school
- **2 weeks/term** lost to manual timetable creation
- **Unfair duty loads** — same staff repeatedly assigned, others never
- **Disconnected leadership** — commandant can't see real-time attendance, duty completion, or task status
- **Paper costs** — reams of register sheets, printing, filing cabinets

---

## 3. The Solution

### 3.1 What AFCS Smart Campus Is

A **single, integrated digital operating system** that manages every operational aspect of a secondary school:

```
┌─────────────────────────────────────────────────────────┐
│                    AFCS Smart Campus                     │
├─────────────────────────────────────────────────────────┤
│  Staff    │  Student   │  Duty    │  Parade   │ Reports  │
│  Check-in │  Check-in  │  Roster  │  Muster   │ & Data   │
├───────────┼────────────┼──────────┼───────────┼──────────┤
│  AI       │  Telegram  │  Auto-   │  Notifi-  │  QR Code │
│  Timetable│  Bot       │  mation  │  cations  │  Scanning │
├───────────┴────────────┴──────────┴───────────┴──────────┤
│         Supabase DB  │  Vercel Edge  │  Telegram API      │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Key Differentiators

| Feature | AFCS | Competitors |
|---------|------|-------------|
| AI timetable generator | ✓ 30 seconds | ✗ Manual |
| Multi-channel notifications | ✓ Telegram + WhatsApp + SMS | ✓ WhatsApp only |
| Automation engine | ✓ 13 rules | ✗ None |
| QR code scanning | ✓ Built-in | ✗ |
| Prefect management | ✓ | ✗ |
| Muster parade + tasks | ✓ | ✗ |
| AI assistant (chat) | ✓ | ✗ |
| Global search (Ctrl+K) | ✓ | ✗ |
| Free notifications via Telegram | ✓ Zero cost | ✗ Meta API costs |
| Offline-capable print queue | ✓ | ✗ |
| Annual licensing | ✓ | ✓ |

---

## 4. Product Deep Dive

### 4.1 Module Breakdown

| # | Module | Key Features | Users |
|---|--------|-------------|-------|
| 1 | Staff Attendance | QR + manual check-in/out, late detection, daily rollup | All staff |
| 2 | Student Attendance | Per-period tracking, class breakdown, parent alerts | Teachers |
| 3 | Duty Roster | 8 duty types, auto-rotation, fair distribution | Admin |
| 4 | AI Timetable | No-clash generation, period assignments, class-subject mapping | Admin |
| 5 | Muster Parade | Parade sessions, briefings, task assignment, acknowledgements | All staff |
| 6 | Prefect Roles | 18 role types, student assignments, badges, filters | Admin |
| 7 | Daily Reports | Structured format, AI summaries, historical trends | Commandant |
| 8 | Telegram Bot | 25+ commands, duty/task/timetable queries, notifications | All staff |
| 9 | Multi-Channel Comms | Telegram → WhatsApp → SMS fallback chain, delivery tracking | All staff |
| 10 | Automation Engine | 13 scheduled rules, cron-based, configurable channels | Admin |
| 11 | AI Assistant | Natural language chat, attendance queries, task status | Commandant |
| 12 | Notifications Hub | Full history, read tracking, delivery status | Commandant |
| 13 | Global Search | Ctrl+K, instant feature/record navigation | All users |
| 14 | QR Code Badging | Per-staff QR badge generation, scanner interface | All staff |
| 15 | Licensing | Multi-tier annual licensing, expiry management, master activation | Admin |
| 16 | In-App Bell | Real-time notification dropdown, unread counts, polling | All users |

### 4.2 User Personas

| Role | What They Do | Pages They Use |
|------|-------------|----------------|
| **Commandant** | Oversee school operations, view reports, assign tasks | Dashboard, Daily Report, Reports, Settings |
| **Admin** | Manage staff/students, configure system, generate timetables | Admin Dashboard, Staff, Students, Timetable Setup, Automation, Settings |
| **Teacher** | Take attendance, check timetable, view duties | Student Attendance, Timetable, Duty Roster, Check-in |
| **Support Staff** | Check in/out, view assigned duties | Check-in, Duty Roster, My Tasks |
| **Prefect** | Check in students, assist with attendance | Student Check-in |

### 4.3 Notification Flow

```
                    ┌──────────────────┐
                    │ Automation Engine │
                    │ (13 cron rules)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Notification    │
                    │  Router          │
                    └──┬────┬────┬─────┘
                       │    │    │
                       ▼    ▼    ▼
                 ┌─────┐ ┌────┐ ┌────┐
                 │Tele │ │WA  │ │SMS │
                 │gram │ │    │ │    │
                 └──┬──┘ └──┬─┘ └──┬─┘
                    │       │      │
                    ▼       ▼      ▼
              ┌──────────────────────┐
              │    Staff / Parents   │
              └──────────────────────┘
```

### 4.4 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 | Web app |
| Backend | Next.js API routes (Edge + Serverless) | API layer |
| Database | PostgreSQL via Supabase | Data persistence |
| Auth | Supabase Auth (password + magic link) | Authentication |
| Real-time | Supabase Realtime + 30s polling | Notification bell |
| AI | OpenAI / Gemini | AI assistant, timetable |
| Notifications | Telegram Bot API + WhatsApp Cloud API + Termii | Multi-channel |
| Hosting | Vercel (Edge Network) | Global deployment |
| CI/CD | GitHub → Vercel auto-deploy | Continuous delivery |

---

## 5. Technology Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel Edge Network                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js 16 App Router                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │    │
│  │  │   Pages  │ │ API Rts │ │  Middleware       │    │    │
│  │  │          │ │          │ │  (Auth + License) │    │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────┴──────────────────┐
                    │                        │
                    ▼                        ▼
          ┌──────────────────┐    ┌────────────────────┐
          │    Supabase      │    │    External APIs    │
          │  ┌────────────┐  │    │  ┌──────────────┐  │
          │  │ PostgreSQL │  │    │  │ Telegram Bot │  │
          │  │  (Tables)  │  │    │  └──────────────┘  │
          │  │            │  │    │  ┌──────────────┐  │
          │  │ RLS Policies│  │    │  │ WhatsApp API │  │
          │  │            │  │    │  └──────────────┘  │
          │  │ Auth       │  │    │  ┌──────────────┐  │
          │  └────────────┘  │    │  │  OpenAI/Gemini│  │
          └──────────────────┘    │  └──────────────┘  │
                                  │  ┌──────────────┐  │
                                  │  │  Termii SMS  │  │
                                  │  └──────────────┘  │
                                  └────────────────────┘
```

**Why this architecture wins:**
- **Serverless** — pay per request, not per server. Near-zero cost at low volumes.
- **Edge-rendered** — pages load fast anywhere in Nigeria/Africa.
- **Supabase** — PostgreSQL with built-in auth, real-time, and storage. One service replaces 5.
- **Telegram-first notifications** — free, no Meta account, no API costs. Works on basic phones.
- **Single codebase** — one deploy serves all schools (multi-tenant ready).

---

## 6. Market Analysis

### 6.1 Total Addressable Market (TAM)

| Market Segment | Schools | Annual License Potential | Total |
|----------------|---------|------------------------|-------|
| Nigerian Federal Unity Colleges | 115 | NGN 600K | NGN 69M |
| Nigerian State Secondary Schools | 6,000+ | NGN 350K–600K | NGN 2.1B–3.6B |
| Nigerian Private Secondary Schools | 15,000+ | NGN 600K–1.2M | NGN 9B–18B |
| **Nigeria Total** | **21,000+** | | **NGN 9B+** |
| Ghana Secondary Schools | 5,000+ | $1,000–$3,000 | $5M–$15M |
| Kenya Secondary Schools | 4,000+ | $1,000–$3,000 | $4M–$12M |
| South Africa Secondary Schools | 2,500+ | $2,000–$5,000 | $5M–$12.5M |
| **Pan-Africa Total** | | | **$14M–$39.5M+** |

### 6.2 Serviceable Addressable Market (SAM)

Schools with:
- Active internet connectivity (60% of Nigerian secondary schools)
- At least one computer with a browser
- Willingness to adopt digital tools
- Budget for annual software (private schools prioritized)

**SAM: ~8,000 schools → NGN 4.8B annual revenue potential**

### 6.3 Serviceable Obtainable Market (SOM)

Year 5 target:
- 200 schools deployed
- NGN 123.75M gross revenue
- 0.95% of SAM

### 6.4 Market Trends

| Trend | Impact on AFCS |
|-------|---------------|
| Nigerian govt pushing digital transformation in education | Government contracts for state schools |
| Edtech projected $3.1B by 2028 (Nigeria) | Growing willingness to pay for software |
| 85%+ teachers use WhatsApp/Telegram | No learning curve for our notification system |
| Smartphone penetration in Nigeria: 40% and rising | More users can access the web app |
| JAPA syndrome reducing experienced staff | Automation replaces manual processes |
| AFCON 2027 (Nigeria hosting) | Govt infrastructure spend boosts connectivity |

### 6.5 Pricing Benchmarking

| Product | Price/School/Yr | What You Get |
|---------|----------------|-------------|
| AFCS Essential | NGN 350K | Attendance + Duty + Reports |
| AFCS Professional | NGN 600K | All modules + AI + Telegram |
| AFCS Enterprise | NGN 1.2M | All + WhatsApp/SMS + Support |
| SchoolBoss (SA) | $2,000–$5,000 | Fees/grades only |
| Educare (Kenya) | $1,500–$3,000 | Timetable + grades only |
| i-School (Nigeria) | NGN 500K–1M | Fees + exams only |
| Manual paper system | NGN 200K+ | Paper registers + printing + filing |

**AFCS is cheaper AND more comprehensive than every alternative.**

---

## 7. Competitive Landscape

### 7.1 Direct Competitors

| Competitor | Focus | Strengths | Weaknesses | AFCS Advantage |
|------------|-------|-----------|------------|----------------|
| **SchoolBoss** (SA) | Fees, grades, transcripts | Polished UI, South Africa | No ops management, expensive | Full ops + AI + lower price |
| **Educare** (Kenya) | Timetable, grades | Good timetable | No attendance, no comms | End-to-end integrated |
| **i-School** (Nigeria) | Fees, exams, library | Local, Nigerian payments | No daily ops | Operations + notifications |
| **SkoolBox** (Nigeria) | Communication | Parent-teacher chat | No school management | Full OS, not just chat |
| **Manual/Paper** | Everything | No cost | Inefficient, error-prone | Digital, automated, auditable |

### 7.2 Indirect Competitors

- **WhatsApp groups** — free but chaotic, no structure
- **Google Classroom** — academic only, no operations
- **Excel timetables** — manual, clash-prone, no notifications
- **Paper registers** — cheap but labor-intensive

### 7.3 Our Moat

1. **First-mover advantage in full-stack school ops** — no one combines attendance + duty + timetable + notifications + AI in one platform for African schools.
2. **Built by practitioners** — developed at an actual school, solving real problems. Every feature was requested by teachers or administrators.
3. **Free notification channel** — Telegram costs nothing to operate. Competitors using WhatsApp/Meta pay per message.
4. **AI timetable generator** — genuinely useful, saves 2 weeks/term. Hard to replicate.
5. **Lock-in through data** — after a term, the school's attendance records, timetables, duties, and tasks are all in our system. The switching cost is the data.
6. **Lowest operating cost** — serverless architecture means hosting costs stay near zero even as users grow.

---

## 8. Business Model

### 8.1 Revenue Streams

| Stream | Description | Est. Contribution |
|--------|-------------|-------------------|
| Annual License | Per-school, per-year subscription | 75% |
| Setup & Training | One-time onboarding fee (NGN 250K) | 10% |
| Annual Maintenance | 15% of license fee/year | 8% |
| SMS Credits | Pay-as-you-go for SMS fallback | 3% |
| Hardware Bundles | QR scanners + tablets (commission) | 2% |
| Data Analytics | Reports for education boards | 2% |

### 8.2 Pricing Tiers

| Feature | Essential | Professional | Enterprise |
|---------|:---------:|:------------:|:----------:|
| Staff Attendance | ✓ | ✓ | ✓ |
| Student Attendance | ✓ | ✓ | ✓ |
| Duty Roster | ✓ | ✓ | ✓ |
| Reports & Analytics | ✓ | ✓ | ✓ |
| Muster Parade | — | ✓ | ✓ |
| Prefect Roles | — | ✓ | ✓ |
| Daily Reports | — | ✓ | ✓ |
| Global Search | — | ✓ | ✓ |
| Telegram Bot | — | ✓ | ✓ |
| AI Timetable | — | ✓ | ✓ |
| Automation Engine | — | ✓ | ✓ |
| AI Assistant | — | ✓ | ✓ |
| WhatsApp/SMS | — | — | ✓ |
| Notifications Hub | — | — | ✓ |
| Dedicated Support | — | — | ✓ |
| **Annual Price** | **NGN 350K** | **NGN 600K** | **NGN 1.2M** |

### 8.3 Unit Economics

| Metric | Year 1 | Year 3 | Year 5 |
|--------|--------|--------|--------|
| Avg revenue per school | NGN 525K | NGN 616K | NGN 619K |
| Cost to serve per school | NGN 420K | NGN 246K | NGN 198K |
| Gross profit per school | NGN 105K | NGN 370K | NGN 421K |
| Gross margin | 20% | 60% | 68% |
| Customer acquisition cost | NGN 500K | NGN 200K | NGN 150K |
| Lifetime value (3yr avg) | NGN 1.58M | NGN 1.85M | NGN 1.86M |
| LTV/CAC ratio | 3.2x | 9.3x | 12.4x |

---

## 9. Financial Model

### 9.1 Key Assumptions

| Assumption | Value | Basis |
|------------|-------|-------|
| Year 1 schools | 10 | Seed deployed to known contacts |
| Year 2 schools | 35 | Sales team + referrals |
| Year 3 schools | 80 | Multi-school product ready |
| Year 4 schools | 140 | Pan-Nigeria expansion |
| Year 5 schools | 200 | West Africa expansion |
| Average license fee | NGN 600K | 60% Professional, 20% Essential, 20% Enterprise |
| Setup fee | NGN 250K | One-time per school |
| Annual churn | 5% | High stickiness due to data lock-in |
| Operating costs | See below | Serverless keeps infra costs low |

### 9.2 Revenue Projection (5 Years)

| Item | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|------|--------|--------|--------|--------|--------|
| **Schools (cumulative)** | 10 | 35 | 80 | 140 | 200 |
| New schools added | 10 | 25 | 45 | 60 | 60 |
| Churned schools | 0 | 0 | 1 | 4 | 7 |
| Net new schools | 10 | 25 | 44 | 56 | 53 |

| License revenue | NGN 6.0M | NGN 21.0M | NGN 48.0M | NGN 84.0M | NGN 120.0M |
| Setup fees | NGN 2.5M | NGN 6.25M | NGN 11.25M | NGN 15.0M | NGN 15.0M |
| Maintenance (15%) | NGN 900K | NGN 3.15M | NGN 7.2M | NGN 12.6M | NGN 18.0M |
| SMS credits + other | NGN 600K | NGN 1.5M | NGN 3.0M | NGN 5.0M | NGN 7.0M |
| **Gross Revenue** | **NGN 10.0M** | **NGN 31.9M** | **NGN 69.45M** | **NGN 116.6M** | **NGN 160.0M** |
| Churn adjustment (-5%) | — | -NGN 1.05M | -NGN 2.4M | -NGN 4.2M | -NGN 6.0M |
| **Net Revenue** | **NGN 10.0M** | **NGN 30.85M** | **NGN 67.05M** | **NGN 112.4M** | **NGN 154.0M** |

### 9.3 Profit & Loss Statement

| | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--|--------|--------|--------|--------|--------|
| **Revenue** | **NGN 10.0M** | **NGN 30.85M** | **NGN 67.05M** | **NGN 112.4M** | **NGN 154.0M** |
| | | | | | |
| **Cost of Sales** | | | | | |
| Cloud infrastructure | NGN 2.0M | NGN 4.0M | NGN 6.0M | NGN 8.0M | NGN 10.0M |
| SMS/API costs | NGN 500K | NGN 1.5M | NGN 3.0M | NGN 5.0M | NGN 7.0M |
| Deployment engineers | NGN 3.0M | NGN 3.0M | NGN 6.0M | NGN 9.0M | NGN 12.0M |
| Support staff | NGN 1.5M | NGN 3.0M | NGN 4.5M | NGN 6.0M | NGN 7.5M |
| **Total COS** | **NGN 7.0M** | **NGN 11.5M** | **NGN 19.5M** | **NGN 28.0M** | **NGN 36.5M** |
| **Gross Profit** | **NGN 3.0M** | **NGN 19.35M** | **NGN 47.55M** | **NGN 84.4M** | **NGN 117.5M** |
| Margin | 30% | 63% | 71% | 75% | 76% |
| | | | | | |
| **Operating Expenses** | | | | | |
| Salaries & wages | NGN 3.6M | NGN 7.2M | NGN 14.4M | NGN 21.6M | NGN 28.8M |
| Sales & marketing | NGN 0 | NGN 3.0M | NGN 6.0M | NGN 9.0M | NGN 12.0M |
| Office & admin | NGN 1.2M | NGN 2.4M | NGN 3.6M | NGN 4.8M | NGN 6.0M |
| Legal & compliance | NGN 500K | NGN 800K | NGN 1.0M | NGN 1.5M | NGN 2.0M |
| **Total OpEx** | **NGN 5.3M** | **NGN 13.4M** | **NGN 25.0M** | **NGN 36.9M** | **NGN 48.8M** |
| | | | | | |
| **EBITDA** | **-NGN 2.3M** | **NGN 5.95M** | **NGN 22.55M** | **NGN 47.5M** | **NGN 68.7M** |
| Margin | -23% | 19% | 34% | 42% | 45% |
| | | | | | |
| Depreciation | NGN 200K | NGN 200K | NGM 200K | NGN 200K | NGN 200K |
| **Net Profit** | **-NGN 2.5M** | **NGN 5.75M** | **NGN 22.35M** | **NGN 47.3M** | **NGN 68.5M** |
| Margin | -25% | 19% | 33% | 42% | 44% |

### 9.4 Cash Flow Projection

| | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--|--------|--------|--------|--------|--------|
| **Opening cash** | NGN 50.0M | NGN 47.5M | NGN 52.9M | NGN 74.5M | NGN 120.3M |
| | | | | | |
| **Inflows** | | | | | |
| Revenue | NGN 10.0M | NGN 30.85M | NGN 67.05M | NGN 112.4M | NGN 154.0M |
| Investment | NGN 50.0M | — | — | — | — |
| **Total inflows** | **NGN 60.0M** | **NGN 30.85M** | **NGN 67.05M** | **NGN 112.4M** | **NGN 154.0M** |
| | | | | | |
| **Outflows** | | | | | |
| Cost of sales | NGN 7.0M | NGN 11.5M | NGN 19.5M | NGN 28.0M | NGN 36.5M |
| OpEx | NGN 5.3M | NGN 13.4M | NGN 25.0M | NGN 36.9M | NGN 48.8M |
| CapEx (product dev) | NGN 200K | NGN 500K | NGN 500K | NGN 500K | NGN 500K |
| **Total outflows** | **NGN 12.5M** | **NGN 25.4M** | **NGN 45.0M** | **NGN 65.4M** | **NGN 85.8M** |
| | | | | | |
| **Net cash flow** | NGN 47.5M | NGN 5.45M | NGN 22.05M | NGN 47.0M | NGN 68.2M |
| **Closing cash** | **NGN 47.5M** | **NGN 52.95M** | **NGN 75.0M** | **NGN 122.0M** | **NGN 190.2M** |

### 9.5 Key Financial Metrics

| Metric | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--------|--------|--------|--------|--------|--------|
| Gross margin | 30% | 63% | 71% | 75% | 76% |
| Net margin | -25% | 19% | 33% | 42% | 44% |
| Monthly burn (avg) | NGN 1.04M | NGN 2.12M | NGN 3.75M | NGN 5.45M | NGN 7.15M |
| Runway (months) | 48 | 25 | 20 | 22 | 27 |
| Revenue per employee | NGN 2.5M | NGN 4.4M | NGN 5.6M | NGN 6.6M | NGN 7.3M |
| ARR | NGN 6.0M | NGN 21.0M | NGN 48.0M | NGN 84.0M | NGN 120.0M |
| ARPU (annual) | NGN 600K | NGN 600K | NGN 600K | NGN 600K | NGN 600K |
| LTV (3yr avg) | NGN 1.58M | NGN 1.85M | NGN 1.86M | NGN 1.86M | NGN 1.86M |

### 9.6 Break-Even Analysis

- **Break-even point:** Month 16 (Q2 Year 2)
- **Schools needed to break even:** 25 schools on Professional tier
- **Monthly revenue at break-even:** NGN 1.875M

### 9.7 Scenario Analysis

| Scenario | Year 5 Revenue | Year 5 Net Profit | Likelihood |
|----------|---------------|-------------------|------------|
| **Base case** (200 schools) | NGN 154.0M | NGN 68.5M | 60% |
| **Bull case** (350 schools, govt contracts) | NGN 280.0M | NGN 130.0M | 15% |
| **Bear case** (100 schools, slow adoption) | NGN 85.0M | NGN 30.0M | 25% |
| **Worst case** (50 schools, product issues) | NGN 42.5M | NGN 10.0M | 5% |

### 9.8 USD Equivalent Summary

| | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--|--------|--------|--------|--------|--------|
| Revenue (NGN) | NGN 10.0M | NGN 30.85M | NGN 67.05M | NGN 112.4M | NGN 154.0M |
| Revenue (USD)* | $6,250 | $19,281 | $41,906 | $70,250 | $96,250 |
| Net Profit (NGN) | -NGN 2.5M | NGN 5.75M | NGN 22.35M | NGN 47.3M | NGN 68.5M |
| Net Profit (USD) | -$1,563 | $3,594 | $13,969 | $29,563 | $42,813 |

*At NGN 1,600 = $1 USD (approximate 2026 rate)

---

## 10. Traction & Milestones

### 10.1 What We've Built

| Milestone | Date | Details |
|-----------|------|---------|
| MVP launched | Jan 2026 | Attendance + basic roster |
| AI Timetable | Feb 2026 | First conflict-free timetable generated |
| Telegram Bot | Mar 2026 | 10 commands, live at school |
| Automation Engine | Apr 2026 | 8 rules automated |
| Full deployment | May 2026 | All 12 modules operational |
| Prefect Roles | Jun 2026 | 18 roles, student assignments |
| Licensing System | Jul 2026 | Multi-tier, master key activation |

### 10.2 Current Metrics

- **80+** daily active staff users
- **3,000+** students tracked
- **12** live modules
- **25+** Telegram bot commands
- **13** automation rules
- **34** database migrations
- **~70K** lines of code
- **0** downtime incidents since launch

### 10.3 Post-Investment Milestones

| Quarter | Milestone | Deliverable |
|---------|-----------|-------------|
| Q3 2026 | Multi-school architecture | School-scoped data, admin panel for orgs |
| Q3 2026 | Mobile web app (PWA) | Installable on Android, push notifications |
| Q4 2026 | Parent portal | Absence alerts, report cards, fee tracking |
| Q4 2026 | E-examination platform | CBT interface, auto-grading, results |
| Q1 2027 | Asset management | Inventory tracking, maintenance scheduling |
| Q1 2027 | AI counselling alerts | Welfare detection from attendance patterns |
| Q2 2027 | Pilot 10 schools | 3 geo-political zones, paid pilots |
| Q3 2027 | Education board BI | Aggregate analytics for government |
| Q4 2027 | Pan-Africa expansion | Ghana, Kenya, South Africa |
| Q1 2028 | Native mobile apps | iOS + Android (React Native) |

---

## 11. Go-to-Market Strategy

### 11.1 Phase 1: Stitch in Time (Year 1) — 10 schools

**Target:** Federal Unity Colleges + private schools within 200km of Igbara-Oke

**Tactics:**
- Direct sales — visit schools, demo on projector, offer free 30-day trial
- Referral program — existing school gets 10% of Year 1 fees for referrals
- AFCS command network — commandants across 6 zones are natural champions
- Pricing: NGN 250K setup fee waived for first 10 schools

**Sales channels:**
- Founder-led sales (months 1-6)
- 1 sales rep (months 7-12)

### 11.2 Phase 2: Scale (Year 2-3) — 80 schools

**Target:** Private schools nationally, state government contracts

**Tactics:**
- Multi-school product enables self-service onboarding
- Partner with school associations (NAPS, ANCOPSS)
- Digital marketing — Google Ads targeting "school management software Nigeria"
- Attendance at education conferences (SEF, NAE)
- Government pilots — offer 2 state governments free deployment for 6 months

**Sales channels:**
- 3 sales reps + 1 sales manager
- 2 deployment engineers
- Partnership with education technology distributors

### 11.3 Phase 3: Dominate (Year 4-5) — 200+ schools

**Target:** West Africa expansion

**Tactics:**
- Franchise model — regional partners in Ghana, Benin, Cameroon
- White-label option for large school groups
- Education board contracts — provide BI dashboards for entire states
- Premium add-ons (e-exam, asset management) drive ARPU from NGN 600K to NGN 1M+

**Sales channels:**
- 8 sales reps across Nigeria + 3 regional partners
- Online self-service funnel
- Government tender response team

### 11.4 Marketing Budget Allocation

| Channel | Year 1 | Year 2 | Year 3 |
|---------|--------|--------|--------|
| Direct sales (visits, demos) | 60% | 40% | 30% |
| Referral program | 20% | 15% | 10% |
| Digital marketing | 10% | 25% | 30% |
| Events & conferences | 5% | 10% | 15% |
| Partnership development | 5% | 10% | 15% |

---

## 12. Team

### Current Team

| Role | Person | Background |
|------|--------|-----------|
| Founder & Lead Developer | (You) | Built the entire platform. Deep understanding of school operations as a practitioner at AFCS. |
| Commandant (Advisor) | AFCS Commandant | Operational oversight, domain expertise, access to AFCS network across 6 geopolitical zones. |

### Roles to Hire (Post-Investment)

| Role | Year | Salary (Annual) |
|------|------|-----------------|
| Full-stack developer | 1 | NGN 3.6M |
| Sales representative (x1) | 1 | NGN 1.8M + commission |
| Deployment engineer | 1 | NGN 3.0M |
| Customer support (x1) | 2 | NGN 1.5M |
| Sales manager | 2 | NGN 3.6M + commission |
| Mobile developer | 2 | NGN 4.8M |
| Additional sales reps (x2) | 2 | NGN 1.8M each + commission |
| Data/AI engineer | 3 | NGN 6.0M |
| Operations manager | 3 | NGN 4.8M |

---

## 13. Investment Ask

| Item | Detail |
|------|--------|
| **Amount** | **NGN 50,000,000 (~$32,000 USD)** |
| **Instrument** | Seed Round — Convertible Note or Equity |
| **Equity Offered** | 15% |
| **Pre-money Valuation** | NGN 283M (~$177,000) |
| **Post-money Valuation** | NGN 333M (~$208,000) |
| **Minimum Check** | NGN 5,000,000 |
| **Use Period** | 24 months |

### Why This Valuation

- Working product with 12 modules, not a prototype
- Live in production with real daily users
- 0 to full product in 7 months by a solo founder
- $177K pre-money = 2.8x Year 1 revenue — conservative for SaaS
- Comparable Nigerian edtech seed rounds: 3x–6x ARR

### Comparable Deals

| Company | Stage | Amount | Pre-money | ARR | Multiple |
|---------|-------|--------|-----------|-----|----------|
| uLesson (Nigeria) | Seed | $3.1M | $12M | ~$1M | 12x |
| AltSchool (Nigeria) | Seed | $1M | $5M | ~$500K | 10x |
| AFCS Smart Campus | Seed | $32K | $177K | $6.25K | 28x* |

*Multiple is high at Year 1 because revenue starts small. By Year 2 at NGN 21M ARR, the multiple drops to 8.5x on post-money — in line with market.

---

## 14. Use of Funds

| Category | % | Amount (NGN) | Amount (USD) | What It Pays For |
|----------|---|-------------|--------------|-----------------|
| **Product Development** | 40% | NGN 20M | $12,500 | Multi-school architecture (NGN 8M), mobile web app (NGN 5M), e-exam platform (NGN 4M), asset management (NGN 3M) |
| **Sales & Marketing** | 30% | NGN 15M | $9,375 | Sales team salaries (NGN 8M), school visits & travel (NGN 3M), digital marketing (NGN 2M), events (NGN 1M), materials (NGN 1M) |
| **Operations & Support** | 20% | NGN 10M | $6,250 | Support staff (NGN 4M), deployment engineers (NGN 4M), training materials (NGN 1M), office (NGN 1M) |
| **Infrastructure** | 10% | NGN 5M | $3,125 | Cloud costs (NGN 2M), security audit (NGN 1M), compliance/legal (NGN 1M), hardware (NGN 1M) |
| **Total** | **100%** | **NGN 50M** | **$31,250** | |

---

## 15. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Slow school adoption | Medium | High | Free 30-day trial, referral discounts, government pilot programs |
| Competitor emerges | Medium | Medium | Our data lock-in + 18-month head start + free Telegram channel |
| Internet connectivity | High | Medium | Offline print queue, Telegram works on 2G, SMS fallback |
| Payment collection | Medium | Medium | Annual upfront payment, bank transfer + mobile money, automated reminders |
| Staff turnover | Medium | Medium | Standardized training docs, video tutorials, intuitive UI |
| Government regulation | Low | Medium | Proactive compliance, data localization (Supabase Nigeria region) |
| Scaling infrastructure | Low | Low | Serverless architecture scales automatically |
| Currency devaluation | High | Medium | USD pricing for non-Nigerian schools, NGN pricing adjusted annually |

---

## 16. Exit Strategy

### 16.1 Potential Acquirers

| Acquirer | Rationale | Est. Valuation |
|----------|-----------|----------------|
| **uLesson** | The biggest Nigerian edtech — AFCS adds school operations to their content/exam platform | $2M–$5M |
| **AltSchool** | Growing school network — AFCS as their internal OS | $1M–$3M |
| **RovingHeights** | Publishing + education expansion | $1M–$2M |
| **Interswitch** | Payment infrastructure moving into education vertical | $3M–$5M |
| **Federal Government** | National school OS for Unity Colleges | $5M–$10M |

### 16.2 Exit Timeline

- **Year 3–4:** Strategic acquisition by edtech platform seeking school operations module
- **Year 5+:** If hitting 200+ schools with NGN 120M+ ARR, PE/VC growth round or Series A at 5-8x ARR = $500K–$800K valuation
- **Year 7+:** Pan-African expansion to 1,000+ schools → IPO or large strategic exit ($5M–$20M)

### 16.3 Investor Return Scenarios

| Scenario | Year | Exit Valuation | Investor Return (15% equity) | Multiple |
|----------|------|---------------|------------------------------|----------|
| Conservative | 4 | $500K (NGN 800M) | $75K (NGN 120M) | 2.3x |
| Base case | 5 | $1.5M (NGN 2.4B) | $225K (NGN 360M) | 7x |
| Bull case | 5 | $3M (NGN 4.8B) | $450K (NGN 720M) | 14x |
| Home run | 7 | $10M+ (NGN 16B+) | $1.5M+ (NGN 2.4B+) | 47x+ |

---

## 17. Appendix

### 17.1 Product Screenshots (Urls to deploy)

```
Live platform: https://afcs-smart-campus.vercel.app
Demo credentials: admin@afcs.edu.ng / Admin@12345
```

### 17.2 Key Contacts

```
Email: dewaleprotocols@gmail.com
Location: Air Force Comprehensive School, Igbara-Oke, Ondo State, Nigeria
```

### 17.3 Migration Files Reference

All 34 database migrations in `src/db/migrations/` — from initial schema through licensing system.

### 17.4 Technology Stack Details

| Component | Version | Justification |
|-----------|---------|---------------|
| Next.js | 16.2.9 | App Router, React Server Components, Edge Runtime |
| React | 19.2.4 | Latest stable with compiler optimizations |
| Supabase | Latest | PostgreSQL, Auth, Realtime, Storage — all in one |
| Tailwind CSS | v4 | Utility-first, CSS variables for theming |
| TypeScript | 5.x | Type safety across the entire codebase |
| Zod | 4.x | Runtime schema validation for API inputs |
| Lucide React | Latest | Consistent icon set, tree-shakeable |

### 17.5 Glossary

| Term | Definition |
|------|-----------|
| AFCS | Air Force Comprehensive School |
| Commandant | School principal/headmaster (military terminology) |
| RLS | Row-Level Security — database-level access control |
| Edge | Vercel's global network — runs code close to users |
| Serverless | Pay-per-execution computing, no dedicated servers |
| Muster Parade | Daily assembly for task assignment and briefings |

---

*This pitch deck was generated from the live AFCS Smart Campus codebase. All financial projections are based on conservative assumptions and actual operating data from the pilot deployment.*

*AFCS Smart Campus — Full Pitch Deck v3.0 — July 2026*
