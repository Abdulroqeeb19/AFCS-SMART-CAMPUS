/* eslint-disable @typescript-eslint/no-require-imports */
const PptxGenJS = require('pptxgenjs')
const path = require('path')

const pptx = new PptxGenJS()

// NAF color scheme
const NAF_BLUE = '001A4D'
const NAF_GOLD = 'C9A84C'
const NAF_RED = 'E03C31'
const NAF_GREEN = '008751'
const WHITE = 'FFFFFF'
const DARK = '1A1A2E'
const GRAY = '666666'

pptx.author = 'AFCS Smart Campus'
pptx.company = 'Air Force Comprehensive School, Igbara-Oke'
pptx.subject = 'Investor Pitch Deck'
pptx.title = 'Smart Campus Operating System'
pptx.layout = 'LAYOUT_WIDE'

function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 5.5, w: 1.5, h: 0.4,
    fontSize: 9, color: GRAY, align: 'right',
    fontFace: 'Calibri',
  })
}

function addFooterBar(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.5, w: 10, h: 0.15,
    fill: { color: NAF_BLUE },
  })
}

const TOTAL_SLIDES = 14

// ---------- SLIDE 1: Title ----------
{
  const s = pptx.addSlide()
  s.background = { fill: NAF_BLUE }

  // Gold accent line
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.2, w: 1.5, h: 0.06,
    fill: { color: NAF_GOLD },
  })

  s.addText('AFCS Smart Campus', {
    x: 0.8, y: 1.5, w: 8.5, h: 1,
    fontSize: 40, color: WHITE, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('Operating System', {
    x: 0.8, y: 2.4, w: 8.5, h: 0.7,
    fontSize: 24, color: NAF_GOLD,
    fontFace: 'Calibri',
  })

  s.addText('AI-Powered School Management Platform\nfor Air Force Comprehensive Schools & Private Schools Across Nigeria', {
    x: 0.8, y: 3.3, w: 8.5, h: 0.8,
    fontSize: 13, color: 'CCCCCC',
    fontFace: 'Calibri',
  })

  s.addText('INVESTOR PITCH DECK', {
    x: 0.8, y: 4.4, w: 4, h: 0.4,
    fontSize: 11, color: NAF_GOLD, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('June 2026', {
    x: 0.8, y: 4.8, w: 4, h: 0.4,
    fontSize: 10, color: '999999',
    fontFace: 'Calibri',
  })

  addFooterBar(s)
  addSlideNumber(s, 1, TOTAL_SLIDES)
}

// ---------- SLIDE 2: Problem ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_RED } })

  s.addText('The Problem', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const problems = [
    { title: '📋 Paper-Based Attendance', desc: 'Manual registers — lost, forged, unverifiable. Zero real-time visibility for school leadership.' },
    { title: '📉 No Operational Intelligence', desc: 'Commandants & principals lack data — no dashboard for attendance trends, lateness patterns, or staff performance.' },
    { title: '🔐 Security & Accountability Gaps', desc: 'No audit trail for duty assignments, parade briefings, or who was where and when. Unauthorized access goes undetected.' },
    { title: '📱 Fragmented Communication', desc: 'WhatsApp groups, notice boards, word-of-mouth. No unified system for task assignment, confirmation, or follow-up.' },
  ]

  problems.forEach((p, i) => {
    const y = 1.3 + i * 1.0
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 8.8, h: 0.85,
      fill: { color: i % 2 === 0 ? 'F0F4FF' : 'FFF7ED' },
      rectRadius: 0.1,
      line: { color: NAF_BLUE, width: 0.5, transparency: 80 },
    })
    s.addText(p.title, {
      x: 0.9, y: y + 0.08, w: 8.2, h: 0.35,
      fontSize: 13, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(p.desc, {
      x: 0.9, y: y + 0.4, w: 8.2, h: 0.35,
      fontSize: 10, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 2, TOTAL_SLIDES)
}

// ---------- SLIDE 3: Solution ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GREEN } })

  s.addText('Our Solution: Smart Campus OS', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('A complete, cloud-based, AI-powered operating system for Nigerian schools.', {
    x: 0.6, y: 1.0, w: 8.8, h: 0.5,
    fontSize: 12, color: GRAY,
    fontFace: 'Calibri',
  })

  const features = [
    { icon: '✓', title: 'Staff Attendance', desc: 'QR-code & manual check-in/out with late detection, time override, auto absent tracking' },
    { icon: '✓', title: 'Student Attendance', desc: 'Class-based student check-in by period with full reporting and parent notification' },
    { icon: '✓', title: 'Duty Roster & Tasks', desc: 'Automated AI department-matched duty generation with WhatsApp task notifications' },
    { icon: '✓', title: 'Muster Parade', desc: 'Digital parade sessions, briefings, task assignments with acknowledgements' },
  ]

  features.forEach((f, i) => {
    const y = 1.7 + i * 0.9
    s.addText(`  ${f.icon}  ${f.title}`, {
      x: 0.8, y, w: 4, h: 0.35,
      fontSize: 13, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(f.desc, {
      x: 1.4, y: y + 0.35, w: 7.8, h: 0.4,
      fontSize: 10, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 3, TOTAL_SLIDES)
}

// ---------- SLIDE 4: Technology ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_BLUE } })

  s.addText('Technology Stack', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const techs = [
    { label: 'Frontend', items: 'Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons' },
    { label: 'Backend', items: 'Next.js API Routes (38 endpoints), Supabase PostgreSQL, Row-Level Security' },
    { label: 'Auth', items: 'Supabase Auth + Cloudflare Turnstile CAPTCHA, Role-based access (4 roles)' },
    { label: 'AI & Automation', items: 'AI department-matching for duty rosters, commandant insights, automated WhatsApp via Meta Cloud API' },
    { label: 'Infrastructure', items: 'Vercel Edge / Serverless, Supabase real-time, WhatsApp Business API' },
  ]

  techs.forEach((t, i) => {
    const y = 1.3 + i * 0.85
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 8.8, h: 0.75,
      fill: { color: i % 2 === 0 ? 'F8FAFC' : WHITE },
      rectRadius: 0.08,
    })
    s.addText(t.label, {
      x: 0.9, y: y + 0.05, w: 3, h: 0.3,
      fontSize: 12, color: NAF_GOLD, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(t.items, {
      x: 0.9, y: y + 0.35, w: 8.2, h: 0.35,
      fontSize: 10, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 4, TOTAL_SLIDES)
}

// ---------- SLIDE 5: Market Opportunity ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GOLD } })

  s.addText('Market Opportunity', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  // Three columns
  const cols = [
    { number: '60+', label: 'AFCS Schools\nNigeria-wide', desc: 'Air Force Comprehensive Schools across all 6 geo-political zones needing standardized operations' },
    { number: '25,000+', label: 'Private Schools\nTarget Segment', desc: 'Big private schools (500+ students) seeking digital transformation in Lagos, Abuja, PH, Ibadan' },
    { number: '₦2.5B+', label: 'TAM (Year 3)', desc: 'Annual serviceable market: SaaS licenses, deployment, training & support contracts' },
  ]

  cols.forEach((c, i) => {
    const x = 0.5 + i * 3.15
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 2.95, h: 3.8,
      fill: { color: i === 1 ? 'FFF7ED' : 'F0F4FF' },
      rectRadius: 0.15,
      line: { color: i === 1 ? NAF_GOLD : NAF_BLUE, width: 0.5, transparency: 70 },
    })
    s.addText(c.number, {
      x, y: 1.5, w: 2.95, h: 0.6,
      fontSize: 32, color: NAF_BLUE, bold: true, align: 'center',
      fontFace: 'Calibri',
    })
    s.addText(c.label, {
      x, y: 2.1, w: 2.95, h: 0.7,
      fontSize: 11, color: NAF_RED, bold: true, align: 'center',
      fontFace: 'Calibri',
    })
    s.addText(c.desc, {
      x: x + 0.2, y: 2.9, w: 2.55, h: 2.0,
      fontSize: 9.5, color: GRAY, align: 'center',
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 5, TOTAL_SLIDES)
}

// ---------- SLIDE 6: Competitive Advantage ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GREEN } })

  s.addText('Competitive Moat', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const advantages = [
    { title: '🎯 Purpose-Built for Nigerian Schools', desc: 'Designed for AFCS command structure with military precision — not a generic EdTech adapted for school use' },
    { title: '🔗 WhatsApp-Native Communication', desc: 'Tasks, duty assignments, and alerts delivered via WhatsApp Cloud API — no app installation required. Messages show school name as sender.' },
    { title: '🤖 AI-Powered Automation', desc: 'Intelligent department-matching for duty rosters, attendance pattern detection, commandant insights dashboard' },
    { title: '🛡️ NAF Security Standards', desc: 'Row-Level Security, audit trails, CAPTCHA verification, role-based access control — meets military-grade data protection' },
    { title: '📊 Offline-Resilient Architecture', desc: 'Serverless edge deployment with Supabase real-time sync — works reliably even with Nigeria\'s variable internet connectivity' },
  ]

  advantages.forEach((a, i) => {
    const y = 1.2 + i * 0.85
    s.addText(a.title, {
      x: 0.8, y, w: 8.5, h: 0.35,
      fontSize: 13, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(a.desc, {
      x: 0.8, y: y + 0.33, w: 8.5, h: 0.4,
      fontSize: 10, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 6, TOTAL_SLIDES)
}

// ---------- SLIDE 7: Phases & Milestones ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GOLD } })

  s.addText('Implementation Milestones', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const phases = [
    { name: 'Phase 1', pct: '100%', title: 'Staff Attendance', status: '✅ Complete', color: NAF_GREEN },
    { name: 'Phase 2', pct: '100%', title: 'Student Attendance', status: '✅ Complete', color: NAF_GREEN },
    { name: 'Phase 3', pct: '100%', title: 'Duty Roster & Reporting', status: '✅ Complete', color: NAF_GREEN },
    { name: 'Phase 4', pct: '100%', title: 'Muster Parade Automation', status: '✅ Complete', color: NAF_GREEN },
  ]

  phases.forEach((p, i) => {
    const y = 1.3 + i * 1.0
    const barW = 5.5
    const fillW = barW * 1 // 100%

    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 1.0, h: 0.5,
      fill: { color: p.color },
      rectRadius: 0.08,
    })
    s.addText(p.pct, {
      x: 0.6, y, w: 1.0, h: 0.5,
      fontSize: 14, color: WHITE, bold: true, align: 'center',
      fontFace: 'Calibri',
    })

    s.addText(p.name, {
      x: 1.8, y, w: 1.5, h: 0.5,
      fontSize: 12, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })

    s.addText(p.title, {
      x: 3.3, y, w: 2.5, h: 0.5,
      fontSize: 10, color: GRAY,
      fontFace: 'Calibri',
    })

    // Progress bar
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.0, y: y + 0.15, w: barW, h: 0.2,
      fill: { color: 'E5E7EB' },
      rectRadius: 0.1,
    })
    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.0, y: y + 0.15, w: fillW, h: 0.2,
      fill: { color: p.color },
      rectRadius: 0.1,
    })

    s.addText(p.status, {
      x: 8.0, y, w: 1.5, h: 0.5,
      fontSize: 10, color: p.color, bold: true, align: 'right',
      fontFace: 'Calibri',
    })
  })

  // Next Phase
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 4.5, w: 8.8, h: 0.7,
    fill: { color: 'FFF7ED' },
    rectRadius: 0.1,
    line: { color: NAF_GOLD, width: 1 },
  })
  s.addText('▶ Phase 5-6: Timetable Generation & Parent Portal (Funding Required)', {
    x: 0.9, y: 4.55, w: 8.2, h: 0.6,
    fontSize: 12, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  addFooterBar(s)
  addSlideNumber(s, 7, TOTAL_SLIDES)
}

// ---------- SLIDE 8: Security ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_RED } })

  s.addText('Cybersecurity First', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('10 years InfoSec expertise built into every layer of the platform', {
    x: 0.6, y: 1.0, w: 8.8, h: 0.4,
    fontSize: 11, color: GRAY,
    fontFace: 'Calibri',
  })

  const securities = [
    { icon: '🔐', title: 'Row-Level Security (RLS)', desc: 'Every database query enforces per-user access policies. Staff see only their own data.' },
    { icon: '🛡️', title: 'Role-Based Access Control', desc: '4-tier hierarchy: Commandant > Admin > Teacher > Support. Granular action-level permissions.' },
    { icon: '📝', title: 'Complete Audit Trail', desc: 'All overrides, staff edits, and task changes logged with user identity and timestamp.' },
    { icon: '🤖', title: 'CAPTCHA + Rate Limiting', desc: 'Cloudflare Turnstile on authentication. Request body size limits on all write endpoints.' },
    { icon: '🔑', title: 'No Password Storage', desc: 'Supabase Auth handles all credentials. Zero-knowledge architecture — we never see passwords.' },
    { icon: '📱', title: 'Dev Mode Isolation', desc: 'Development mode bypasses production auth with stored session validation against database.' },
  ]

  securities.forEach((sec, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.6 + col * 4.6
    const y = 1.5 + row * 1.2

    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 4.4, h: 1.05,
      fill: { color: 'FAFAFA' },
      rectRadius: 0.08,
      line: { color: NAF_BLUE, width: 0.3, transparency: 85 },
    })
    s.addText(sec.icon + '  ' + sec.title, {
      x: x + 0.15, y: y + 0.05, w: 4.0, h: 0.35,
      fontSize: 12, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(sec.desc, {
      x: x + 0.15, y: y + 0.38, w: 4.0, h: 0.55,
      fontSize: 9.5, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 8, TOTAL_SLIDES)
}

// ---------- SLIDE 9: WhatsApp Integration ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GREEN } })

  s.addText('WhatsApp-Native Communication', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const items = [
    { icon: '📨', title: 'Personalised Task Alerts', desc: 'Each staff member receives a WhatsApp message with their name, task description, and deadline when duty rosters are generated.' },
    { icon: '🏫', title: 'School Name as Sender', desc: 'Messages are sent from the school\'s registered WhatsApp Business profile — staff see "AFCS Smart Campus" as the sender.' },
    { icon: '📱', title: 'Zero App Installation', desc: 'No app download required — messages arrive directly in staff WhatsApp. Works with basic phones.' },
    { icon: '📊', title: 'Delivery Tracking', desc: 'Full notification history with sent/failed status visible in the commandant dashboard.' },
  ]

  items.forEach((item, i) => {
    const y = 1.3 + i * 1.0
    s.addText(`${item.icon}  ${item.title}`, {
      x: 0.8, y, w: 8.5, h: 0.35,
      fontSize: 13, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(item.desc, {
      x: 1.5, y: y + 0.35, w: 7.8, h: 0.5,
      fontSize: 10.5, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  // Webhook fallback
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 4.8, w: 8.8, h: 0.5,
    fill: { color: 'F0F4FF' },
    rectRadius: 0.08,
  })
  s.addText('⚡ Also supports Make.com / n8n webhooks for custom automation workflows', {
    x: 0.9, y: 4.83, w: 8.2, h: 0.45,
    fontSize: 10, color: GRAY,
    fontFace: 'Calibri',
  })

  addFooterBar(s)
  addSlideNumber(s, 9, TOTAL_SLIDES)
}

// ---------- SLIDE 10: Revenue Model ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GOLD } })

  s.addText('Revenue Model', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const models = [
    { plan: 'AFCS Deployment', price: '₦3.5M / school', setup: '₦1.5M setup + ₦2M/yr license', detail: 'Full deployment: staff & student attendance, duty roster, parade, WhatsApp, training, 1yr support' },
    { plan: 'Private School Standard', price: '₦2.5M / school', setup: '₦1M setup + ₦1.5M/yr license', detail: 'Core attendance + duties + WhatsApp, tailored for private school structure' },
    { plan: 'Enterprise Multi-Campus', price: '₦15M / group', setup: '₦5M setup + ₦10M/yr license', detail: 'Up to 10 campuses under one dashboard, centralized control, dedicated support SLA' },
    { plan: 'Add-On Services', price: '₦500K - 2M', setup: 'Per engagement', detail: 'Custom integrations, hardware (QR scanners, tablets), advanced analytics, staff training' },
  ]

  models.forEach((m, i) => {
    const y = 1.2 + i * 1.0
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 8.8, h: 0.85,
      fill: { color: i % 2 === 0 ? 'F0F4FF' : WHITE },
      rectRadius: 0.08,
      line: { color: NAF_BLUE, width: 0.3, transparency: 85 },
    })
    s.addText(m.plan, {
      x: 0.9, y: y + 0.05, w: 3.2, h: 0.3,
      fontSize: 12, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(m.price, {
      x: 4.2, y: y + 0.05, w: 2, h: 0.3,
      fontSize: 12, color: NAF_GREEN, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(m.setup, {
      x: 6.5, y: y + 0.05, w: 2.6, h: 0.3,
      fontSize: 9, color: GRAY, align: 'right',
      fontFace: 'Calibri',
    })
    s.addText(m.detail, {
      x: 0.9, y: y + 0.38, w: 8.2, h: 0.4,
      fontSize: 9, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 10, TOTAL_SLIDES)
}

// ---------- SLIDE 11: Financial Projections ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GREEN } })

  s.addText('Financial Projections (3-Year)', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  // Table header
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.2, w: 8.8, h: 0.5, fill: { color: NAF_BLUE } })
  const headers = ['', 'Year 1', 'Year 2', 'Year 3']
  const hx = [0.6, 3.5, 5.5, 7.5]
  headers.forEach((h, i) => {
    s.addText(h, {
      x: hx[i], y: 1.2, w: i === 0 ? 3 : 2, h: 0.5,
      fontSize: 11, color: WHITE, bold: true, align: i === 0 ? 'left' : 'center',
      fontFace: 'Calibri',
    })
  })

  const rows = [
    ['Schools Deployed', '5', '20', '50'],
    ['Annual Revenue', '₦12.5M', '₦50M', '₦125M'],
    ['Operating Costs', '₦8M', '₦25M', '₦55M'],
    ['Gross Profit', '₦4.5M', '₦25M', '₦70M'],
    ['Margin', '36%', '50%', '56%'],
  ]

  rows.forEach((row, ri) => {
    const y = 1.75 + ri * 0.6
    const bgColor = ri % 2 === 0 ? 'F8FAFC' : WHITE
    s.addShape(pptx.ShapeType.rect, { x: 0.6, y, w: 8.8, h: 0.55, fill: { color: bgColor } })

    s.addText(row[0], {
      x: 0.8, y, w: 2.7, h: 0.55,
      fontSize: 11, color: ri === 4 ? NAF_GREEN : NAF_BLUE, bold: ri === 4, align: 'left',
      fontFace: 'Calibri',
    })
    for (let ci = 1; ci <= 3; ci++) {
      s.addText(row[ci], {
        x: hx[ci], y, w: 2, h: 0.55,
        fontSize: 11, color: ri >= 3 ? NAF_GREEN : DARK, bold: true, align: 'center',
        fontFace: 'Calibri',
      })
    }
  })

  addFooterBar(s)
  addSlideNumber(s, 11, TOTAL_SLIDES)
}

// ---------- SLIDE 12: Investment Ask ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_GOLD } })

  s.addText('Investment Ask', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 28, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('₦50,000,000', {
    x: 0.6, y: 1.1, w: 4.5, h: 1,
    fontSize: 48, color: NAF_GREEN, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('Seed Round — 15% Equity', {
    x: 0.6, y: 2.0, w: 4.5, h: 0.4,
    fontSize: 14, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  const useCases = [
    { pct: '35%', label: 'Product Development', detail: 'Timetable generator, parent portal, exam management, e-learning' },
    { pct: '25%', label: 'Sales & Marketing', detail: 'Sales team for AFCS commands + private schools across Nigeria' },
    { pct: '20%', label: 'Operations & Support', detail: 'Deployment engineers, 24/7 support desk, training materials' },
    { pct: '20%', label: 'Infrastructure & Security', detail: 'Cloud costs, penetration testing, compliance, SOC 2 readiness' },
  ]

  useCases.forEach((u, i) => {
    const y = 2.7 + i * 0.7
    s.addShape(pptx.ShapeType.roundRect, {
      x: 5.2, y, w: 4.3, h: 0.6,
      fill: { color: 'F0F4FF' },
      rectRadius: 0.08,
    })
    s.addText(u.pct + '  ' + u.label, {
      x: 5.4, y: y + 0.02, w: 3.9, h: 0.28,
      fontSize: 11, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(u.detail, {
      x: 5.4, y: y + 0.28, w: 3.9, h: 0.28,
      fontSize: 9, color: GRAY,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 12, TOTAL_SLIDES)
}

// ---------- SLIDE 13: What Next (Pain-Point Features) ----------
{
  const s = pptx.addSlide()
  s.background = { fill: WHITE }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: NAF_BLUE } })

  s.addText('Roadmap: Solving School Pain Points', {
    x: 0.6, y: 0.4, w: 8.8, h: 0.7,
    fontSize: 26, color: NAF_BLUE, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('Biggest choke points in AFCS & private schools today — and how we solve them:', {
    x: 0.6, y: 1.0, w: 8.8, h: 0.4,
    fontSize: 11, color: GRAY,
    fontFace: 'Calibri',
  })

  const roadmap = [
    { phase: 'Q3 2026', title: 'AI Timetable Generator', problem: 'Manual timetabling takes weeks, clashes are common', impact: 'Algorithmic timetable with teacher/subject/room conflict detection' },
    { phase: 'Q3 2026', title: 'Parent Portal & Notifications', problem: 'Parents have no visibility into student attendance or performance', impact: 'Real-time absence alerts, report cards, fee payment tracking' },
    { phase: 'Q4 2026', title: 'E-Examination Platform', problem: 'Exam malpractice, manual grading, lost answer scripts', impact: 'Secure digital exams with auto-grading, anti-cheating, result analytics' },
    { phase: 'Q4 2026', title: 'Asset & Inventory Management', problem: 'No tracking of school assets, textbooks, uniforms, lab equipment', impact: 'QR-code asset tracking, automated inventory, maintenance alerts' },
    { phase: 'Q1 2027', title: 'AI Counselling & Welfare', problem: 'Guidance counselors overwhelmed, no data on at-risk students', impact: 'AI flags attendance drops, academic decline, behavioral patterns' },
  ]

  roadmap.forEach((r, i) => {
    const y = 1.5 + i * 0.8
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 8.8, h: 0.7,
      fill: { color: i % 2 === 0 ? 'F0F4FF' : WHITE },
      rectRadius: 0.08,
    })
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 1.1, h: 0.7,
      fill: { color: NAF_GOLD },
      rectRadius: 0.08,
    })
    s.addText(r.phase, {
      x: 0.6, y, w: 1.1, h: 0.7,
      fontSize: 8, color: WHITE, bold: true, align: 'center',
      fontFace: 'Calibri',
    })
    s.addText(r.title, {
      x: 1.9, y: y + 0.03, w: 3.5, h: 0.3,
      fontSize: 11, color: NAF_BLUE, bold: true,
      fontFace: 'Calibri',
    })
    s.addText(r.problem, {
      x: 1.9, y: y + 0.33, w: 3.5, h: 0.3,
      fontSize: 8.5, color: NAF_RED,
      fontFace: 'Calibri',
    })
    s.addText('→ ' + r.impact, {
      x: 5.6, y: y + 0.07, w: 3.5, h: 0.55,
      fontSize: 9, color: NAF_GREEN,
      fontFace: 'Calibri',
    })
  })

  addFooterBar(s)
  addSlideNumber(s, 13, TOTAL_SLIDES)
}

// ---------- SLIDE 14: Contact ----------
{
  const s = pptx.addSlide()
  s.background = { fill: NAF_BLUE }

  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.0, w: 1.5, h: 0.06,
    fill: { color: NAF_GOLD },
  })

  s.addText('Let\'s Build the Future', {
    x: 0.8, y: 1.3, w: 8.5, h: 0.8,
    fontSize: 32, color: WHITE, bold: true,
    fontFace: 'Calibri',
  })

  s.addText('of Nigerian School Management', {
    x: 0.8, y: 2.0, w: 8.5, h: 0.6,
    fontSize: 20, color: NAF_GOLD,
    fontFace: 'Calibri',
  })

  const contacts = [
    '📧  dewaleprotocols@gmail.com',
    '📍  Air Force Comprehensive School, Igbara-Oke, Ondo State',
    '🌐  afcs-smart-campus.vercel.app',
  ]
  contacts.forEach((c, i) => {
    s.addText(c, {
      x: 0.8, y: 3.2 + i * 0.45, w: 8.5, h: 0.4,
      fontSize: 12, color: 'CCCCCC',
      fontFace: 'Calibri',
    })
  })

  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 4.8, w: 8.5, h: 0.01,
    fill: { color: NAF_GOLD },
  })

  s.addText('© 2026 AFCS Smart Campus — All Rights Reserved', {
    x: 0.8, y: 4.9, w: 8.5, h: 0.4,
    fontSize: 9, color: '777777',
    fontFace: 'Calibri',
  })

  addSlideNumber(s, 14, TOTAL_SLIDES)
}

// Generate
const outputPath = path.join(__dirname, '..', 'AFCS_Smart_Campus_Investor_Pitch.pptx')
pptx.writeFile({ fileName: outputPath })
  .then(() => console.log('✅ PPT created at:', outputPath))
  .catch(err => console.error('❌ Error:', err))
