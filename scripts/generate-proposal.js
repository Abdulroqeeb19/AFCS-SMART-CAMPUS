const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, PageBreak,
  Header, Footer, PageNumber, TabStopPosition, TabStopType,
  ShadingType, TableLayoutType, convertInchesToTwip,
} = require('docx')

const DARK_BLUE = '001A4D'
const GOLD = 'C9A84C'
const MID_BLUE = '003366'
const LIGHT_BG = 'F5F7FA'
const WHITE = 'FFFFFF'

function txt(text, opts = {}) {
  return new TextRun({ text, size: opts.size || 21, bold: opts.bold || false, color: opts.color || '1A1A1A', font: opts.font || 'Calibri', ...opts })
}

function p(...runs) {
  return new Paragraph({ spacing: { after: 120 }, children: runs.flat() })
}

function heading(text, level = 1) {
  const sizes = { 1: 36, 2: 28, 3: 24 }
  const colors = { 1: DARK_BLUE, 2: DARK_BLUE, 3: MID_BLUE }
  return new Paragraph({
    spacing: { before: level === 1 ? 400 : 280, after: 160 },
    children: [txt(text, { bold: true, size: sizes[level], color: colors[level] })],
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({ spacing: { after: 0 }, children: [txt(text, { size: opts.size || 18, bold: opts.bold || false, color: opts.color || '1A1A1A' })] })],
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.SOLID } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  })
}

function headerRow(...cells) {
  return new TableRow({ tableHeader: true, children: cells.map(c => cell(c, { bold: true, color: WHITE, shading: DARK_BLUE, size: 18 })) })
}

function dataRow(...cells) {
  return new TableRow({ children: cells.map(c => cell(c, { size: 18 })) })
}

function buildTable(headers, rows) {
  return new Table({
    rows: [headerRow(...headers), ...rows.map(r => dataRow(...r))],
  })
}

async function generateProposal() {
  const doc = new Document({
    title: 'AFCS Smart Campus - Investment Proposal',
    description: 'School Management Operating System - Full Investment Proposal and Financial Model',
    styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
    sections: [
      // COVER PAGE
      {
        properties: {},
        children: [
          new Paragraph({ spacing: { before: 4000 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [txt('AFCS Smart Campus', { bold: true, size: 52, color: DARK_BLUE })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [txt('School Management Operating System', { size: 28, color: '555555' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [txt('INVESTMENT PROPOSAL', { bold: true, size: 22, color: DARK_BLUE })],
          }),
          new Paragraph({ spacing: { before: 600, after: 100 }, alignment: AlignmentType.CENTER, children: [txt('CONFIDENTIAL — Version 3.0 — July 2026', { size: 18, color: '777777' })] }),
          new Paragraph({ spacing: { before: 2000 }, children: [] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [txt('Prepared by: Air Force Comprehensive School, Igbara-Oke, Ondo State', { size: 18, color: '555555' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [txt('Contact: dewaleprotocols@gmail.com', { size: 18, color: '555555' })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [txt('Platform: afcs-smart-campus.vercel.app', { size: 18, color: '555555' })] }),
        ],
      },
      // TABLE OF CONTENTS
      {
        properties: { page: { pageNumbers: { start: 1 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt('AFCS Smart Campus — Investment Proposal', { size: 16, color: '999999' })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [txt('Page ', { size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' })] })] }) },
        children: [
          heading('Table of Contents', 1),
          ...['Executive Summary', 'The Problem', 'The Solution', 'Product Modules', 'Technology Architecture', 'Market Analysis', 'Competitive Landscape', 'Business Model & Pricing', 'Financial Projections', 'Traction & Milestones', 'Go-to-Market Strategy', 'Investment Ask & Use of Funds', 'Risk Assessment', 'Exit Strategy', 'Contact & Next Steps'].map((item, i) =>
            p(txt(`${i + 1}. ${item}`, { size: 22, color: DARK_BLUE }))
          ),
        ],
      },
      // SECTION 1: EXECUTIVE SUMMARY
      {
        properties: {},
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt('AFCS Smart Campus — Investment Proposal', { size: 16, color: '999999' })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [txt('Page ', { size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' })] })] }) },
        children: [
          heading('1. Executive Summary', 1),
          p(txt('AFCS Smart Campus is a complete digital operating system for running secondary schools in Nigeria and across Africa. It replaces paper registers, WhatsApp-group chaos, and manual spreadsheets with an integrated platform handling attendance, duty rosters, AI-powered timetables, parade management, multi-channel notifications, and AI-driven analytics.')),
          p(txt('Current Status:', { bold: true }), txt(' Live in production since January 2026 at Air Force Comprehensive School, Igbara-Oke. 16 fully operational modules. 80+ daily active users. 3,000+ students tracked. Zero downtime since launch.')),
          buildTable(
            ['Metric', 'Detail'],
            [
              ['Daily Active Staff', '80+'],
              ['Students Tracked', '3,000+'],
              ['Live Modules', '16'],
              ['In Production', 'Since January 2026'],
              ['Downtime Incidents', '0'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('The Opportunity', 2),
          p(txt('21,000+ secondary schools in Nigeria — almost none have an integrated digital operations system. NGN 9B+ annual market potential in Nigeria alone; $40M+ across Africa. Existing edutech only covers grades, transcripts, and fees — they ignore how a school actually runs.')),
          heading('The Ask', 2),
          p(txt('NGN 50,000,000 (~$32,000 USD) seed round for 15% equity. Funds will build multi-school architecture, mobile apps, and a sales team to deploy to 100+ schools in 24 months. Path to NGN 120M ARR by Year 5 with 68% net margins.')),
        ],
      },
      // SECTION 2: THE PROBLEM
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('2. The Problem', 1),
          p(txt('Nigerian secondary schools operate in a state of near-total digital darkness. Every operational process is manual, paper-based, or scattered across WhatsApp groups.')),
          buildTable(
            ['Pain Point', 'Current Method', 'Consequence'],
            [
              ['Attendance', 'Paper registers', '500+ sheets/day, easily lost, forged signatures'],
              ['Duty roster', 'Manual rotation', 'Confusion, unfair assignments'],
              ['Timetable', 'Hand-drawn in Excel', '3-5 days, clashes, last-minute changes'],
              ['Communications', 'WhatsApp groups', 'Info buried in chats, no confirmation'],
              ['Task assignment', 'Verbal instructions', 'No audit trail, no accountability'],
              ['Reports', 'Handwritten notes', 'No trend analysis, no memory'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('The Scale', 2),
          p(txt('21,000+ secondary schools in Nigeria (115 Federal, 6,000+ state, 15,000+ private). ~95% have no integrated digital operations system. 30+ hours/week lost to manual register-taking. 2 weeks/term lost to manual timetable creation.')),
          heading('The Cost of Inaction', 2),
          p(txt('A typical school spends NGN 200,000+ annually on paper, printing, and filing. The hidden cost of administrative time wasted is 3-5x higher. AFCS eliminates both — a school saves its annual license fee in paper costs alone within the first term.')),
        ],
      },
      // SECTION 3: THE SOLUTION
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('3. The Solution', 1),
          p(txt('AFCS Smart Campus is a single, integrated digital operating system that manages every operational aspect of a secondary school.')),
          heading('What Makes AFCS Different', 2),
          buildTable(
            ['Feature', 'AFCS', 'Competitors'],
            [
              ['AI timetable', '30 seconds, no clashes', 'Manual Excel, 3-5 days'],
              ['Notifications', 'Telegram + WhatsApp + SMS', 'WhatsApp only'],
              ['Automation', '13 scheduled rules', 'None'],
              ['Free channel (Telegram)', 'Zero cost', 'Meta API costs'],
              ['QR scanning', 'Built-in', 'Requires hardware'],
              ['Muster + tasks', 'Digital, full audit', 'None'],
              ['AI assistant', 'Natural language chat', 'None'],
              ['Annual pricing', 'NGN 350K-1.2M', '$1,500-$5,000'],
            ]
          ),
        ],
      },
      // SECTION 4: PRODUCT MODULES
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('4. Product Modules', 1),
          p(txt('AFCS consists of 16 integrated modules, each solving a specific operational challenge:')),
          buildTable(
            ['#', 'Module', 'Key Features', 'Users'],
            [
              ['1', 'Staff Attendance', 'QR + manual check-in, late detection, dashboard', 'All staff'],
              ['2', 'Student Attendance', 'Per-period tracking, class breakdown, exports', 'Teachers'],
              ['3', 'Duty Roster', '8 duty types, auto-rotation, fair distribution', 'Admin'],
              ['4', 'AI Timetable', 'No-clash generation in <30 seconds', 'Admin'],
              ['5', 'Muster Parade', 'Digital parades, briefings, task tracking', 'All staff'],
              ['6', 'Prefect Roles', '18 role types, student assignments', 'Admin'],
              ['7', 'Daily Reports', 'AI summaries, historical trends', 'Commandant'],
              ['8', 'Telegram Bot', '25+ commands, free to operate', 'All staff'],
              ['9', 'Multi-Channel Comms', 'Telegram > WhatsApp > SMS fallback', 'All staff'],
              ['10', 'Automation Engine', '13 cron rules, configurable channels', 'Admin'],
              ['11', 'AI Assistant', 'Natural language chat', 'Commandant'],
              ['12', 'Global Search', 'Ctrl+K instant navigation', 'All users'],
              ['13', 'Notifications Hub', 'History, tracking, in-app bell', 'All users'],
              ['14', 'QR Badging', 'Per-staff badges, scanner interface', 'All staff'],
              ['15', 'In-App Bell', 'Real-time dropdown, unread counts', 'All users'],
              ['16', 'Licensing System', 'Multi-tier, expiry, master key', 'Admin'],
            ]
          ),
        ],
      },
      // SECTION 5: TECHNOLOGY
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('5. Technology Architecture', 1),
          buildTable(
            ['Layer', 'Technology', 'Purpose'],
            [
              ['Frontend', 'Next.js 16 + React 19 + Tailwind v4', 'Web application'],
              ['Backend', 'Next.js API routes (Edge/Serverless)', 'REST API layer'],
              ['Database', 'PostgreSQL via Supabase', 'Data persistence'],
              ['Auth', 'Supabase Auth', 'User management'],
              ['AI/ML', 'OpenAI GPT-4o-mini / Gemini 2.0', 'AI assistant, timetable'],
              ['Notifications', 'Telegram + WhatsApp + Termii SMS', 'Multi-channel delivery'],
              ['Hosting', 'Vercel Edge Network', 'Global deployment'],
              ['CI/CD', 'GitHub → Vercel auto-deploy', 'Continuous delivery'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Why This Architecture Wins', 2),
          p(txt('Serverless: '), txt('Pay per request, not per server. Near-zero cost at low volumes. Scales to millions without re-architecting.', { color: '555555' })),
          p(txt('Edge-rendered: '), txt('Pages load fast across Nigeria. Vercel edge network covers Lagos, Kano, Port Harcourt.', { color: '555555' })),
          p(txt('Supabase: '), txt('PostgreSQL with built-in auth, real-time, and storage. One service replaces five.', { color: '555555' })),
          p(txt('Telegram-first: '), txt('Free notifications. No Meta account. Works on basic phones and 2G networks.', { color: '555555' })),
          p(txt('Single codebase: '), txt('One deployment serves all schools. Multi-tenant via PostgreSQL Row-Level Security.', { color: '555555' })),
        ],
      },
      // SECTION 6: MARKET ANALYSIS
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('6. Market Analysis', 1),
          buildTable(
            ['Segment', 'Schools', 'Annual Potential'],
            [
              ['Federal Unity Colleges', '115', 'NGN 69M'],
              ['State Secondary Schools', '6,000+', 'NGN 2.1B-3.6B'],
              ['Private Secondary Schools', '15,000+', 'NGN 9B-18B'],
              ['Nigeria Total', '21,000+', 'NGN 9B+'],
              ['Pan-Africa (GH, KE, ZA)', '11,500+', '$14M-$39.5M+'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Market Trends', 2),
          p(txt('Nigerian government actively pushing digital transformation in education. Edtech projected to reach $3.1B by 2028. 85%+ of teachers already use Telegram/WhatsApp — zero learning curve. Smartphone penetration at 40% and rising. AFCON 2027 driving infrastructure spend.')),
        ],
      },
      // SECTION 7: COMPETITIVE LANDSCAPE
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('7. Competitive Landscape', 1),
          buildTable(
            ['Competitor', 'Focus', 'AFCS Advantage'],
            [
              ['SchoolBoss (SA)', 'Fees, grades', 'Full ops + AI + lower price'],
              ['Educare (Kenya)', 'Timetable, grades', 'End-to-end integrated'],
              ['i-School (Nigeria)', 'Fees, exams', 'Full OS, not just admin'],
              ['SkoolBox (Nigeria)', 'Communication', 'Full ops + comms'],
              ['Manual/Paper', 'Everything', 'Digital, automated, auditable'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Our Moat', 2),
          p(txt('1. First-mover in full-stack school ops for African schools.')),
          p(txt('2. Built by practitioners at an actual school. Every feature solves a real problem.')),
          p(txt('3. Free Telegram notifications vs competitors paying per WhatsApp message.')),
          p(txt('4. AI timetable generator saves 2 weeks/term. Difficult to replicate well.')),
          p(txt('5. Data lock-in — after a term, switching cost is all their historical data.')),
          p(txt('6. Lowest operating cost — serverless keeps hosting near zero.')),
        ],
      },
      // SECTION 8: BUSINESS MODEL
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('8. Business Model & Pricing', 1),
          heading('Revenue Streams', 2),
          p(txt('Annual License (75%), Setup & Training (10%), Annual Maintenance (8%), SMS Credits (3%), Hardware Bundles (2%), Data Analytics (2%).')),
          heading('Pricing Tiers', 2),
          buildTable(
            ['Feature', 'Essential', 'Professional', 'Enterprise'],
            [
              ['Attendance + Duty + Reports', '✓', '✓', '✓'],
              ['Muster + Prefects + Daily Reports', '—', '✓', '✓'],
              ['Telegram Bot + AI Timetable', '—', '✓', '✓'],
              ['Automation + AI Assistant', '—', '✓', '✓'],
              ['WhatsApp/SMS + Support', '—', '—', '✓'],
              ['Annual Price', 'NGN 350K', 'NGN 600K', 'NGN 1.2M'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Unit Economics', 2),
          buildTable(
            ['Metric', 'Year 1', 'Year 3', 'Year 5'],
            [
              ['Avg revenue per school', 'NGN 525K', 'NGN 616K', 'NGN 619K'],
              ['Gross profit per school', 'NGN 105K', 'NGN 370K', 'NGN 421K'],
              ['Gross margin', '20%', '60%', '68%'],
              ['LTV/CAC ratio', '3.2x', '9.3x', '12.4x'],
            ]
          ),
        ],
      },
      // SECTION 9: FINANCIAL PROJECTIONS
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('9. Financial Projections', 1),
          p(txt('All figures in Nigerian Naira (NGN). Key assumptions: Year 1: 10 schools → Year 5: 200 schools. 60% Professional tier, 20% Essential, 20% Enterprise. 5% annual churn. Exchange rate: NGN 1,600 = $1 USD.')),
          heading('Revenue Projection', 2),
          buildTable(
            ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
            [
              ['Schools', '10', '35', '80', '140', '200'],
              ['License Revenue', 'NGN 6.0M', 'NGN 21.0M', 'NGN 48.0M', 'NGN 84.0M', 'NGN 120.0M'],
              ['Setup Fees', 'NGN 2.5M', 'NGN 6.25M', 'NGN 11.25M', 'NGN 15.0M', 'NGN 15.0M'],
              ['Other Revenue', 'NGN 1.5M', 'NGN 4.65M', 'NGN 10.2M', 'NGN 17.6M', 'NGN 25.0M'],
              ['Gross Revenue', 'NGN 10.0M', 'NGN 31.9M', 'NGN 69.45M', 'NGN 116.6M', 'NGN 160.0M'],
              ['Net Revenue', 'NGN 10.0M', 'NGN 30.85M', 'NGN 67.05M', 'NGN 112.4M', 'NGN 154.0M'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Profit & Loss', 2),
          buildTable(
            ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
            [
              ['Revenue', 'NGN 10.0M', 'NGN 30.85M', 'NGN 67.05M', 'NGN 112.4M', 'NGN 154.0M'],
              ['Cost of Sales', 'NGN 7.0M', 'NGN 11.5M', 'NGN 19.5M', 'NGN 28.0M', 'NGN 36.5M'],
              ['Gross Profit', 'NGN 3.0M', 'NGN 19.35M', 'NGN 47.55M', 'NGN 84.4M', 'NGN 117.5M'],
              ['Gross Margin', '30%', '63%', '71%', '75%', '76%'],
              ['OpEx', 'NGN 5.3M', 'NGN 13.4M', 'NGN 25.0M', 'NGN 36.9M', 'NGN 48.8M'],
              ['Net Profit', '-NGN 2.5M', 'NGN 5.75M', 'NGN 22.35M', 'NGN 47.3M', 'NGN 68.5M'],
              ['Net Margin', '-25%', '19%', '33%', '42%', '44%'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Cash Flow', 2),
          buildTable(
            ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
            [
              ['Opening Cash', 'NGN 50.0M', 'NGN 47.5M', 'NGN 52.9M', 'NGN 74.5M', 'NGN 120.3M'],
              ['Net Cash Flow', 'NGN 47.5M', 'NGN 5.45M', 'NGN 22.05M', 'NGN 47.0M', 'NGN 68.2M'],
              ['Closing Cash', 'NGN 47.5M', 'NGN 52.95M', 'NGN 75.0M', 'NGN 122.0M', 'NGN 190.2M'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Scenario Analysis', 2),
          buildTable(
            ['Scenario', 'Year 5 Revenue', 'Net Profit', 'Likelihood'],
            [
              ['Base (200 schools)', 'NGN 154.0M', 'NGN 68.5M', '60%'],
              ['Bull (350 schools)', 'NGN 280.0M', 'NGN 130.0M', '15%'],
              ['Bear (100 schools)', 'NGN 85.0M', 'NGN 30.0M', '25%'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          p(txt('Break-even: ', { bold: true }), txt('Month 16 (Q2 Year 2) at 25 schools on Professional tier.')),
        ],
      },
      // SECTION 10: TRACTION
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('10. Traction & Milestones', 1),
          buildTable(
            ['Date', 'Milestone'],
            [
              ['Jan 2026', 'MVP launched — Attendance + basic duty roster'],
              ['Feb 2026', 'AI Timetable Generator — first conflict-free timetable'],
              ['Mar 2026', 'Telegram Bot launched — 10 commands'],
              ['Apr 2026', 'Automation Engine — 8 rules automated'],
              ['May 2026', 'Full deployment — all 12 modules operational'],
              ['Jun 2026', 'Prefect Roles — 18 role types, student assignments'],
              ['Jul 2026', 'Licensing System — multi-tier, master key activation'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Current Metrics', 2),
          p(txt('80+ daily active staff. 3,000+ students tracked. 16 live modules. 25+ Telegram commands. 13 automation rules. 34 database migrations. ~70,000 lines of code. Zero downtime. Zero security breaches.')),
          heading('Post-Investment Milestones', 2),
          buildTable(
            ['Quarter', 'Milestone'],
            [
              ['Q3 2026', 'Multi-school architecture + Mobile web app (PWA)'],
              ['Q4 2026', 'Parent portal + E-examination platform'],
              ['Q1 2027', 'Asset management + AI counselling alerts'],
              ['Q2 2027', 'Pilot 10 schools across 3 geo-political zones'],
              ['Q3 2027', 'Education board BI dashboards'],
              ['Q4 2027', 'Pan-Africa expansion (Ghana, Kenya, SA)'],
            ]
          ),
        ],
      },
      // SECTION 11: GO-TO-MARKET
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('11. Go-to-Market Strategy', 1),
          heading('Phase 1: Stitch in Time (Year 1) — 10 schools', 2),
          p(txt('Target: '), txt('Federal Unity Colleges + private schools within 200km of Igbara-Oke.', { color: '555555' })),
          p(txt('Tactics: '), txt('Direct sales with 30-day free trial. Referral program (10% of fees). AFCS command network. Founder-led sales then 1 sales rep.', { color: '555555' })),
          heading('Phase 2: Scale (Year 2-3) — 80 schools', 2),
          p(txt('Target: '), txt('Private schools nationally, state government contracts.', { color: '555555' })),
          p(txt('Tactics: '), txt('Self-service onboarding. School association partnerships. Digital marketing. Education conferences. Government pilots. 3 sales reps + 2 engineers.', { color: '555555' })),
          heading('Phase 3: Dominate (Year 4-5) — 200+ schools', 2),
          p(txt('Target: '), txt('West Africa expansion.', { color: '555555' })),
          p(txt('Tactics: '), txt('Franchise model in Ghana/Benin/Cameroon. White-label for school groups. Education board contracts for entire states. 8 sales reps + 3 regional partners.', { color: '555555' })),
        ],
      },
      // SECTION 12: INVESTMENT ASK
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('12. Investment Ask & Use of Funds', 1),
          p(txt('Amount: ', { bold: true, size: 24 }), txt('NGN 50,000,000 (~$32,000 USD)', { bold: true, size: 24, color: DARK_BLUE })),
          p(txt('Structure: '), txt('Seed Round — 15% Equity (Convertible Note or Equity)', { color: '555555' })),
          p(txt('Pre-money Valuation: '), txt('NGN 283M (~$177,000)', { color: '555555' })),
          p(txt('Minimum Check: '), txt('NGN 5,000,000', { color: '555555' })),
          p(txt('Use Period: '), txt('24 months', { color: '555555' })),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Use of Funds', 2),
          buildTable(
            ['Category', '%', 'Amount', 'What It Pays For'],
            [
              ['Product Development', '40%', 'NGN 20M', 'Multi-school, mobile app, e-exam, asset mgmt'],
              ['Sales & Marketing', '30%', 'NGN 15M', 'Team, school visits, digital marketing, events'],
              ['Operations & Support', '20%', 'NGN 10M', 'Support, deployment engineers, training'],
              ['Infrastructure', '10%', 'NGN 5M', 'Cloud, security audit, compliance, hardware'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Investor Return Scenarios', 2),
          buildTable(
            ['Scenario', 'Year', 'Exit Valuation', 'Return (15%)', 'Multiple'],
            [
              ['Conservative', '4', '$500K', '$75K', '2.3x'],
              ['Base case', '5', '$1.5M', '$225K', '7x'],
              ['Bull case', '5', '$3M', '$450K', '14x'],
              ['Home run', '7', '$10M+', '$1.5M+', '47x+'],
            ]
          ),
        ],
      },
      // SECTION 13: RISK
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('13. Risk Assessment & Mitigation', 1),
          buildTable(
            ['Risk', 'Probability', 'Impact', 'Mitigation'],
            [
              ['Slow adoption', 'Medium', 'High', 'Free trial, referrals, govt pilots'],
              ['Competitor', 'Medium', 'Medium', 'Data lock-in, 18mo head start, free Telegram'],
              ['Internet connectivity', 'High', 'Medium', 'Offline queue, Telegram on 2G, SMS fallback'],
              ['Payment collection', 'Medium', 'Medium', 'Annual upfront, mobile money'],
              ['Staff turnover', 'Medium', 'Medium', 'Training docs, video tutorials, intuitive UI'],
              ['Currency devaluation', 'High', 'Medium', 'USD pricing abroad, annual NGN adjustment'],
            ]
          ),
        ],
      },
      // SECTION 14: EXIT
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('14. Exit Strategy', 1),
          heading('Potential Acquirers', 2),
          buildTable(
            ['Acquirer', 'Rationale', 'Est. Valuation'],
            [
              ['uLesson', 'Largest Nigerian edtech — ops to their content', '$2M-$5M'],
              ['AltSchool', 'School network — AFCS as internal OS', '$1M-$3M'],
              ['Interswitch', 'Payments into education vertical', '$3M-$5M'],
              ['Federal Government', 'National OS for Unity Colleges', '$5M-$10M'],
              ['Global edtech', 'Entry into African school ops', '$5M-$15M'],
            ]
          ),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          heading('Exit Timeline', 2),
          p(txt('Year 3-4: '), txt('Strategic acquisition by edtech platform.', { color: '555555' })),
          p(txt('Year 5+: '), txt('NGN 120M+ ARR → Series A at 5-8x ARR ($500K-$800K).', { color: '555555' })),
          p(txt('Year 7+: '), txt('1,000+ schools → IPO or large exit ($5M-$20M).', { color: '555555' })),
        ],
      },
      // SECTION 15: CONTACT
      {
        properties: {},
        children: [
          new Paragraph({ children: [new PageBreak()] }),
          heading('15. Contact & Next Steps', 1),
          p(txt('Thank you for your time and consideration. We invite you to:')),
          p(txt('1. View a live demo at afcs-smart-campus.vercel.app')),
          p(txt('2. Schedule a call to discuss the opportunity in detail')),
          p(txt('3. Request a pilot deployment at a school of your choice')),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          p(txt('Email: ', { bold: true }), txt('dewaleprotocols@gmail.com')),
          p(txt('Location: ', { bold: true }), txt('Air Force Comprehensive School, Igbara-Oke, Ondo State, Nigeria')),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          p(txt('What You Get As An Investor:', { bold: true, size: 22, color: DARK_BLUE })),
          p(txt('• 15% equity in a production-ready, revenue-generating product')),
          p(txt('• Path to 7x return on investment within 5 years (base case)')),
          p(txt('• First-mover advantage in a $40M+ pan-African market')),
          p(txt('• Built-in distribution through the AFCS command network')),
          p(txt('• A product that genuinely improves education outcomes for thousands')),
          new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
            txt('AFCS Smart Campus — Investment Proposal v3.0 — July 2026', { size: 16, color: '999999' }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [
            txt('Nigerian-built. Nigerian-tested. Ready for the world.', { size: 16, color: '999999', italics: true }),
          ]}),
          new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
            txt('This document contains proprietary and confidential information.', { size: 16, color: 'aaaaaa' }),
          ]}),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const outputPath = path.join(__dirname, '..', 'docs', 'AFCS_Smart_Campus_Investment_Proposal.docx')
  fs.writeFileSync(outputPath, buffer)
  console.log(`DOCX generated: ${outputPath}`)
}

generateProposal().catch(console.error)
