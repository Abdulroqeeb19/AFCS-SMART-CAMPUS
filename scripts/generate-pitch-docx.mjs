import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, ShadingType } from 'docx';
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

function highlightBox(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, bold: true, color: DARK_BLUE })],
    spacing: { before: 200, after: 200 },
    indent: { left: 200 },
    shading: { type: ShadingType.SOLID, color: 'e8f0fe' },
    border: { left: { color: DARK_BLUE, size: 6, style: BorderStyle.SINGLE } },
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
      children: [new TextRun({ text: 'Investment Pitching Document', size: 28, color: '666666' })],
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

// ============ DOCUMENT ============
const doc = new Document({
  title: 'AFCS Smart Campus Investment Pitch',
  description: 'Investment pitch for AFCS Smart Campus school management operating system',
  styles: { default: { document: { run: { font: 'Segoe UI', size: 21 } } } },
  sections: [
    {
      children: [
        ...coverPage(),

        // Executive Summary
        h2('Executive Summary'),
        para('AFCS Smart Campus is a comprehensive school management operating system purpose-built for Nigerian secondary schools. Developed at Air Force Comprehensive School, Igbara-Oke (AFCS), it replaces fragmented paper-based processes with an integrated digital platform covering attendance, duty rosters, timetable generation, muster parades, daily reporting, and multi-channel communications.'),
        para('The system serves 80+ staff members and 3000+ students in production, processing hundreds of daily check-ins and delivering automated notifications via Telegram, WhatsApp, and SMS. It has been live since early 2026 and is fully operational.'),
        para('AFCS Smart Campus represents a Nigerian-built, Nigerian-tested solution that addresses the acute need for digital transformation in Africa\'s educational sector.'),
        highlightBox('The Ask: Investment to productize, scale, and deploy AFCS Smart Campus to 100+ Nigerian schools within 24 months.'),
        new Paragraph({ children: [new PageBreak()] }),

        // Problem
        h2('The Problem'),
        para('Nigerian schools face critical operational challenges:'),
        bullet('Paper-based record keeping — Attendance, duties, and reports are handwritten, lost easily, and nearly impossible to audit'),
        bullet('No real-time visibility — School administrators lack live data on who is present, who is on duty, or what tasks are pending'),
        bullet('Manual timetable generation — Creating conflict-free timetables for 30+ teachers across multiple classes takes days and frequently contains errors'),
        bullet('Inefficient communication — Broadcasting urgent announcements requires physical notice boards or unreliable SMS blasts'),
        bullet('No accountability framework — Task assignment and follow-up are informal; there is no audit trail'),
        bullet('Limited oversight — Proprietors and regulators cannot access school performance data remotely'),
        h3('Market Gap'),
        para('Existing solutions (Edusuite, SchoolTry, SkoolMedia) focus on academic records (grades, transcripts, fees). None provide integrated operations management — the daily workflow of running a boarding school: attendance tracking, duty rotations, parade management, real-time staff communication, and automated reporting. AFCS Smart Campus uniquely fills this gap.'),
        new Paragraph({ children: [new PageBreak()] }),

        // Solution
        h2('The Solution'),
        para('AFCS Smart Campus is a mobile-first, cloud-native school operating system with eight integrated modules:'),
        bullet('Smart Attendance — QR code and manual check-in/out with late detection, department and class breakdowns, real-time dashboard'),
        bullet('Duty Roster Engine — 8 duty types, auto-rotation algorithm, status tracking, Telegram notifications for daily assignments'),
        bullet('AI Timetable Generator — Constraint-satisfaction algorithm producing optimized, conflict-free timetables'),
        bullet('Muster Parade Management — Digital session tracking, briefing delivery, task assignment with acknowledgement workflow'),
        bullet('Daily Intelligence Reports — Structured reporting with AI-generated summaries and trend analysis'),
        bullet('Multi-Channel Communications — Telegram bot (25+ commands), WhatsApp Cloud API, SMS (Termii + Africa\'s Talking)'),
        bullet('Automation Engine — 13 scheduled rules handling duty notification, check-in reminders, absentee alerts, period reminders, and daily digests'),
        bullet('AI Assistant — Natural language query interface with database function calling for instant insights'),
        new Paragraph({ children: [new PageBreak()] }),

        // Technology
        h2('Technology & Architecture'),
        makeTable(
          ['Layer', 'Technology', 'Benefit'],
          [['Frontend', 'Next.js 16 + React 19 + Tailwind v4', 'Modern, fast, responsive UI'],
           ['Backend', 'Next.js API Routes', 'Serverless, auto-scaling, low cost'],
           ['Database', 'Supabase PostgreSQL', 'Real-time capable, built-in auth, RLS'],
           ['Hosting', 'Vercel', 'Global CDN, free tier, edge functions'],
           ['AI', 'OpenAI / Gemini', 'Industry-leading LLM integration'],
           ['Telegram', 'Bot API', 'Free, reliable, ubiquitous in Nigeria'],
           ['WhatsApp', 'Cloud API (Meta)', 'Most-used messaging platform'],
           ['SMS', 'Termii / Africa\'s Talking', 'Nigerian and pan-African gateways']]
        ),

        // Market
        h2('Market Opportunity'),
        h3('Target Market'),
        makeTable(
          ['Segment', 'Count', 'Potential (est.)'],
          [['Federal Unity Colleges', '115', 'NGN 173M/yr'],
           ['State Government Secondary Schools', '> 6,000', 'NGN 3.6B/yr'],
           ['Private Secondary Schools (Nigeria)', '> 15,000', 'NGN 9B/yr'],
           ['Pan-African Schools (Ghana, Kenya, SA)', '~30,000', 'NGN 18B/yr']]
        ),
        para('At a conservative NGN 600,000/school/year license fee.'),
        h3('Competitive Advantage'),
        bullet('Only platform combining operations management + academic scheduling + communications'),
        bullet('Built by educators, for educators — developed by AFCS staff, refined through daily use'),
        bullet('Offline-resilient — Telegram bot works on basic phones with minimal data'),
        bullet('Lowest total cost of ownership — serverless architecture keeps infrastructure costs near zero'),
        bullet('Nigerian-built — complies with local data regulations, understands local school culture'),
        new Paragraph({ children: [new PageBreak()] }),

        // Business Model
        h2('Business Model'),
        makeTable(
          ['Tier', 'Features', 'Annual Fee'],
          [['Essential', 'Attendance + Duty Roster + Reports', 'NGN 350,000'],
           ['Professional', 'All modules + AI Timetable + Telegram + Automation', 'NGN 600,000'],
           ['Enterprise', 'All modules + WhatsApp/SMS + Dedicated Support + SLA', 'NGN 1,200,000']]
        ),
        h3('Additional Revenue Streams'),
        bullet('Deployment & Training — NGN 250,000 one-time setup fee per school'),
        bullet('Hardware Bundles — QR scanners, tablets, biometric devices (10-15% margin)'),
        bullet('Annual Maintenance — 15% of license fee for priority support'),
        bullet('SMS Credits — Volume-based SMS pricing (buy bulk, resell per message)'),
        bullet('Data Analytics — Premium reporting dashboard for education boards/ministries'),

        // Financials
        h2('Financial Projections'),
        makeTable(
          ['Metric', 'Year 1', 'Year 2', 'Year 3', 'Year 5'],
          [['Schools Deployed', '10', '35', '80', '200'],
           ['Avg Revenue per School', 'NGN 750K', 'NGN 700K', 'NGN 650K', 'NGN 600K'],
           ['Annual Recurring Revenue', 'NGN 7.5M', 'NGN 24.5M', 'NGN 52M', 'NGN 120M'],
           ['Setup Fees (one-time)', 'NGN 2.5M', 'NGN 6.25M', 'NGN 11.25M', 'NGN 3.75M'],
           ['Gross Revenue', 'NGN 10M', 'NGN 30.75M', 'NGN 63.25M', 'NGN 123.75M'],
           ['Operating Costs', 'NGN 8M', 'NGN 15M', 'NGN 25M', 'NGN 40M'],
           ['Net Profit', 'NGN 2M', 'NGN 15.75M', 'NGN 38.25M', 'NGN 83.75M']]
        ),
        new Paragraph({ children: [new PageBreak()] }),

        // Use of Funds
        h2('Use of Funds'),
        makeTable(
          ['Category', 'Allocation', 'Details'],
          [['Product Development', '40%', 'Multi-tenancy, white-labeling, mobile apps, analytics dashboard'],
           ['Sales & Marketing', '30%', 'Sales team, school visits, demo events, digital marketing'],
           ['Operations', '20%', 'Support team, infrastructure, compliance'],
           ['Reserves', '10%', 'Working capital buffer']]
        ),

        // Risk
        h2('Risk Mitigation'),
        makeTable(
          ['Risk', 'Mitigation'],
          [['Slow school adoption', 'Free pilot program for first 10 schools; testimonial-driven sales'],
           ['Internet reliability', 'Telegram bot works on 2G; offline check-in queue; SMS fallback'],
           ['Competition', 'Unique ops-management focus; first-mover in this niche'],
           ['Staff turnover', 'Self-paced training portal; admin delegation built into product'],
           ['Data security', 'Supabase RLS plus service-role isolation; regular security audits'],
           ['Regulatory changes', 'NDPR-compliant architecture']]
        ),

        // Ask
        h2('Investment Ask'),
        highlightBox('Investment Amount: NGN 50,000,000 (~$32,000 USD)'),
        bullet('Use: Product development (multi-tenancy, mobile apps), sales team, 10-school pilot deployment'),
        bullet('Timeline: 24 months to 100 schools'),
        bullet('ROI for Schools: 10x reduction in admin time, 100% audit trail, real-time operational visibility'),
        bullet('ROI for Investors: Path to NGN 120M ARR by Year 5 with 68% net margins'),

        // Why Now
        h2('Why Now?'),
        bullet('Proven product — Live at AFCS with 80+ staff and 3000+ students since early 2026'),
        bullet('Growing demand — Nigerian edtech market projected to reach $3.1B by 2028 (GSMA)'),
        bullet('Government push — Federal Ministry of Education digital transformation initiatives'),
        bullet('Mobile-first — 85%+ of Nigerian teachers use WhatsApp/Telegram daily'),
        bullet('First-mover advantage — No competitor offers integrated operations management for schools'),
        bullet('Scalable architecture — Serverless stack scales from 50 to 50,000 users without re-architecture'),

        // Team
        h2('The Team'),
        bullet('Built by educators and technologists at Air Force Comprehensive School, Igbara-Oke'),
        bullet('Deep domain expertise — understands boarding school operations, military precision, duty culture'),
        bullet('Technical excellence — Modern stack (Next.js, Supabase, Telegram API, AI integration)'),
        bullet('User-driven development — Every feature requested and tested by actual school administrators'),

        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          children: [new TextRun({ text: 'AFCS Smart Campus — Investment Pitch v1.0 © 2026', size: 18, color: '999999' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

async function main() {
  const buffer = await Packer.toBuffer(doc);
  writeFileSync('docs/AFCS_Smart_Campus_Pitch.docx', buffer);
  console.log('Pitch DOCX generated: docs/AFCS_Smart_Campus_Pitch.docx');
}
main().catch(console.error);
