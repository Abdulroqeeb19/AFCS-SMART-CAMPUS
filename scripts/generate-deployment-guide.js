/* eslint-disable @typescript-eslint/no-require-imports */
const PptxGenJS = require('pptxgenjs')
const path = require('path')

const pptx = new PptxGenJS()

const NAF_BLUE = '001A4D'
const NAF_GOLD = 'C9A84C'

const WHITE = 'FFFFFF'
const DARK = '1A1A2E'
const GRAY = '666666'

pptx.author = 'AFCS Smart Campus'
pptx.company = 'Air Force Comprehensive School, Igbara-Oke'
pptx.subject = 'Deployment Guide'
pptx.title = 'Smart Campus OS — Deployment Guide'
pptx.layout = 'LAYOUT_WIDE'

function addSlideNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 5.5, w: 1.5, h: 0.4,
    fontSize: 8, color: GRAY, align: 'right',
    fontFace: 'Calibri',
  })
}

function addFooterLine(slide) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.5, y: 5.3, w: 9, h: 0,
    line: { color: NAF_GOLD, width: 1.5 },
  })
  slide.addText('AFCS Smart Campus — Deployment Guide', {
    x: 0.5, y: 5.4, w: 9, h: 0.3,
    fontSize: 7, color: GRAY, fontFace: 'Calibri',
  })
}

// ==================== SLIDE 1: Title ====================
const s1 = pptx.addSlide()
s1.background = { fill: NAF_BLUE }
s1.addText('AFCS Smart Campus', { x: 0.5, y: 1.0, w: 9, h: 0.8, fontSize: 36, color: WHITE, fontFace: 'Calibri', bold: true })
s1.addText('Step-by-Step Deployment Guide', { x: 0.5, y: 1.8, w: 9, h: 0.6, fontSize: 20, color: NAF_GOLD, fontFace: 'Calibri' })
s1.addText('From Zero to Production — Complete Setup Walkthrough', { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 14, color: WHITE, fontFace: 'Calibri' })
s1.addText('Air Force Comprehensive School, Igbara-Oke\nOndo State, Nigeria', { x: 0.5, y: 4.0, w: 9, h: 0.6, fontSize: 12, color: GRAY, fontFace: 'Calibri', align: 'center' })
addSlideNumber(s1, 1, 14)

// ==================== SLIDE 2: Prerequisites ====================
const s2 = pptx.addSlide()
s2.background = { fill: WHITE }
addFooterLine(s2)
s2.addText('Prerequisites', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
const prereqs = [
  'Vercel Account (or Railway, Render, Fly.io)',
  'Supabase Project (free tier)',
  'Meta Business Account (WhatsApp Cloud API)',
  'Termii Account (optional — SMS fallback)',
  'Domain Name (optional, recommended)',
  'Node.js 18+ installed locally',
]
s2.addText(prereqs.map((p, i) => `${i + 1}. ${p}`).join('\n'), {
  x: 0.5, y: 1.2, w: 9, h: 3.5, fontSize: 14, color: DARK, fontFace: 'Calibri', lineSpacing: 26,
})
addSlideNumber(s2, 2, 14)

// ==================== SLIDE 3: Supabase Setup ====================
const s3 = pptx.addSlide()
s3.background = { fill: WHITE }
addFooterLine(s3)
s3.addText('Step 1: Supabase Setup', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s3.addText([
  '1. Go to https://supabase.com → Create new project',
  '2. Copy project URL + anon key from Settings → API',
  '3. Open SQL Editor → Run migrations in order:',
  '    001_staff_schema.sql through 013_offline_notifications.sql',
  '4. Verify tables: academic_sessions, staff, classes',
  '',
  'Migration files are in: src/db/migrations/',
  'All CREATE statements use IF NOT EXISTS — safe to re-run.',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.5, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s3, 3, 14)

// ==================== SLIDE 4: Environment Variables ====================
const s4 = pptx.addSlide()
s4.background = { fill: WHITE }
addFooterLine(s4)
s4.addText('Step 2: Environment Variables', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s4.addText([
  'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key',
  'NEXT_PUBLIC_DEV_MODE=false',
  '',
  '# WhatsApp Cloud API',
  'WHATSAPP_API_TOKEN=your-permanent-token',
  'WHATSAPP_PHONE_NUMBER_ID=your-phone-id',
  '',
  '# SMS Fallback (optional)',
  'TERMII_API_KEY=         # or',
  'AFRICAS_TALKING_API_KEY=',
  'AFRICAS_TALKING_USERNAME=',
].join('\n'), { x: 0.5, y: 1.2, w: 5.5, h: 3.8, fontSize: 11, color: DARK, fontFace: 'Consolas', lineSpacing: 18 })

s4.addShape(pptx.ShapeType.roundRect, {
  x: 6.5, y: 1.2, w: 3.2, h: 2.0, fill: { color: 'FFF8E1' },
  line: { color: NAF_GOLD, width: 1 },
})
s4.addText('Copy from\n.env.example', {
  x: 6.7, y: 1.4, w: 2.8, h: 0.8, fontSize: 11, color: NAF_BLUE, fontFace: 'Calibri', bold: true,
})
s4.addText('Rename to .env.local\nand fill in your values.', {
  x: 6.7, y: 2.2, w: 2.8, h: 0.8, fontSize: 10, color: GRAY, fontFace: 'Calibri',
})
addSlideNumber(s4, 4, 14)

// ==================== SLIDE 5: Deploy to Vercel ====================
const s5 = pptx.addSlide()
s5.background = { fill: WHITE }
addFooterLine(s5)
s5.addText('Step 3: Deploy to Vercel', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s5.addText([
  'npm i -g vercel',
  'vercel login',
  'vercel --prod',
  '',
  'Then in Vercel Dashboard:',
  '  Project → Settings → Environment Variables',
  '  Add all vars from .env.local',
  '',
  'Alternative hosts: Railway, Render, Fly.io',
  'Same steps — just set env vars in their UI.',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s5, 5, 14)

// ==================== SLIDE 6: WhatsApp Setup ====================
const s6 = pptx.addSlide()
s6.background = { fill: WHITE }
addFooterLine(s6)
s6.addText('Step 4: WhatsApp Cloud API', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s6.addText([
  '1. Create Meta Business Account',
  '   https://business.facebook.com',
  '',
  '2. Register phone number',
  '   https://business.whatsapp.com',
  '',
  '3. Generate permanent access token',
  '',
  '4. Find Phone Number ID in WhatsApp Manager',
  '',
  '5. Set in Vercel:',
  '   WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s6, 6, 14)

// ==================== SLIDE 7: First Login & Seed Data ====================
const s7 = pptx.addSlide()
s7.background = { fill: WHITE }
addFooterLine(s7)
s7.addText('Step 5: First Login & Data Setup', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s7.addText([
  '1. Log in as commandant (email on seed data)',
  '',
  '2. Go to Timetable → Setup → Subjects',
  '   Add all subjects with codes (MTH, ENG, PHY)',
  '   Set difficulty: Maths/English = 1, Sciences = 2',
  '   Check "2x period" for practical subjects',
  '',
  '3. Teacher Assignments → Assign teachers to subjects',
  '',
  '4. Classes → Assign subjects to each class',
  '   (JSS1A-C, JSS2A-C, etc.)',
  '',
  '5. Timetable → Generate → Select term → Generate',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s7, 7, 14)

// ==================== SLIDE 8: Automation Hub ====================
const s8 = pptx.addSlide()
s8.background = { fill: WHITE }
addFooterLine(s8)
s8.addText('Step 6: Configure Automation', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s8.addText([
  'Automation Hub (/automation):',
  '',
  'Toggle ON:',
  '  • Duty Roster Assignment Alert',
  '  • Task Assignment Notification',
  '',
  'System Config (/settings/prompts):',
  '  • Edit WhatsApp message templates',
  '  • Create broadcast messages',
  '  • Set up task templates',
  '',
  'These two fire automatically when rosters',
  'are generated or tasks are assigned.',
  'No cron job needed for auto-trigger rules.',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s8, 8, 14)

// ==================== SLIDE 9: Cron Jobs ====================
const s9 = pptx.addSlide()
s9.background = { fill: WHITE }
addFooterLine(s9)
s9.addText('Step 7: Cron Jobs (Scheduled Tasks)', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 20, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s9.addText([
  'Option A: Vercel Cron (Pro)',
  '  vercel.json with schedule definitions',
  '',
  'Option B: cron-job.org (Free)',
  '  URL: POST /api/timetable/next-period',
  '  Schedule: Every 30 min, Mon-Fri 8:00-14:00',
  '',
  'Option C: GitHub Actions',
  '  .github/workflows/cron.yml',
  '  Schedule with cron expressions',
  '',
  'Typical schedules:',
  '  • 07:45 Mon-Fri → Check-in reminder',
  '  • 08:00-14:00 every 30min → Period alerts',
  '  • 14:00 Mon-Fri → Daily summary',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 12, color: DARK, fontFace: 'Calibri', lineSpacing: 22 })
addSlideNumber(s9, 9, 14)

// ==================== SLIDE 10: Role Access Matrix ====================
const s10 = pptx.addSlide()
s10.background = { fill: WHITE }
addFooterLine(s10)
s10.addText('Role-Based Access', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })

const roles = [
  ['Page', 'Cmd', 'Admin', 'Tchr', 'Supp'],
  ['Cmd Dashboard', 'Y', '—', '—', '—'],
  ['Admin Dashboard', '—', 'Y', '—', '—'],
  ['My Tasks', 'Y', 'Y', 'Y', 'Y'],
  ['Check In/Out', 'Y', 'Y', 'Y', 'Y'],
  ['Manage Staff', 'Y', 'Y', '—', '—'],
  ['Student Attendance', 'Y', 'Y', 'Y', '—'],
  ['Timetable', 'Y', 'Y', 'Y', '—'],
  ['Timetable Setup', 'Y', 'Y', '—', '—'],
  ['Duty Roster', 'Y', 'Y', 'Y', '—'],
  ['Automation Hub', 'Y', 'Y', '—', '—'],
  ['Notifications', 'Y', 'Y', '—', '—'],
]

const tableOpts = { x: 0.5, y: 1.1, w: 9, fontSize: 11, fontFace: 'Calibri', border: { type: 'solid', color: 'CCCCCC', pt: 0.5 } }
s10.addTable(roles, {
  ...tableOpts,
  rowHeaders: [0],
  colHeaderRows: 1,
  autoPage: false,
  rowH: [0.35, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  cols: [
    { w: 3.5, align: 'left' },
    { w: 1.1, align: 'center' },
    { w: 1.1, align: 'center' },
    { w: 1.1, align: 'center' },
    { w: 1.1, align: 'center' },
  ],
})
addSlideNumber(s10, 10, 14)

// ==================== SLIDE 11: SMS & Offline ====================
const s11 = pptx.addSlide()
s11.background = { fill: WHITE }
addFooterLine(s11)
s11.addText('SMS Fallback & Offline Mode', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s11.addText([
  'Notification Priority Chain:',
  '',
  '  1. WhatsApp Cloud API',
  '  2. SMS (Termii / Africa\'s Talking)',
  '  3. Queue + Retry (3 attempts)',
  '  4. Print Queue (for notice boards)',
  '',
  'Configure SMS in .env.local:',
  '  TERMII_API_KEY=your-key',
  '  AFRICAS_TALKING_API_KEY=your-key',
  '',
  'Print Queue available at:',
  '  /notifications/print',
  '  (Printable page for physical distribution)',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s11, 11, 14)

// ==================== SLIDE 12: Automation Prompts ====================
const s12 = pptx.addSlide()
s12.background = { fill: WHITE }
addFooterLine(s12)
s12.addText('Automation Prompt Templates', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s12.addText([
  'Commandant\'s WhatsApp Prompt:',
  '"🏫 AFCS Smart Campus — Hello {{name}},...',
  '  You have been assigned: {{task}}. Please update.',
  '  — Commandant, AFCS Igbara-Oke"',
  '',
  'Admin Officer\'s WhatsApp Prompt:',
  '"🏫 AFCS Smart Campus — Admin — Hello {{name}},...',
  '  Admin notification: {{description}}.',
  '  Please acknowledge on the portal."',
  '',
  'SMS Fallback (plain text):',
  '"AFCS Campus: {{name}}, {{task}}. Date {{date}}.',
  '  Login to update. - AFCS Igbara-Oke"',
  '',
  'Edit these at /settings/prompts',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 11, color: DARK, fontFace: 'Calibri', lineSpacing: 20 })
addSlideNumber(s12, 12, 14)

// ==================== SLIDE 13: Troubleshooting ====================
const s13 = pptx.addSlide()
s13.background = { fill: WHITE }
addFooterLine(s13)
s13.addText('Common Issues & Fixes', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 22, color: NAF_BLUE, fontFace: 'Calibri', bold: true })
s13.addText([
  'Duplicate term dropdown → Re-run migration 011',
  '  (UNIQUE constraint added via ALTER TABLE)',
  '',
  'Timetable skips classes → Add class_subjects entries',
  '  Check diagnostics in generation result toast',
  '',
  'WhatsApp not sending → Verify API token + phone ID',
  '  Check /notifications for error details',
  '',
  'SMS not sending → Set TERMII_API_KEY in env vars',
  '',
  'Login loop → Clear browser cookies, re-login',
  '',
  'Page not found → Run build again: npm run build',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.8, fontSize: 13, color: DARK, fontFace: 'Calibri', lineSpacing: 24 })
addSlideNumber(s13, 13, 14)

// ==================== SLIDE 14: Quick Reference ====================
const s14 = pptx.addSlide()
s14.background = { fill: NAF_BLUE }
s14.addText('Quick Reference', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, color: NAF_GOLD, fontFace: 'Calibri', bold: true })
s14.addText([
  'Supabase: https://supabase.com',
  'Vercel: https://vercel.com',
  'WhatsApp: https://business.whatsapp.com',
  'Termii: https://termii.com',
  'Cron Jobs: https://cron-job.org',
  '',
  'GitHub: github.com/your-org/afcs-smart-campus',
  'Docs: docs/DEPLOYMENT.md',
  'Pitch: scripts/generate-pitch-ppt.js',
  '',
  'Built with Next.js 16 + Supabase + WhatsApp Cloud API',
].join('\n'), { x: 0.5, y: 1.2, w: 9, h: 3.5, fontSize: 14, color: WHITE, fontFace: 'Calibri', lineSpacing: 28 })
addSlideNumber(s14, 14, 14)

// ==================== SAVE ====================
const outPath = path.join(__dirname, '..', 'AFCS_Deployment_Guide.pptx')
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Deployment guide created:', outPath)
  console.log('Open in PowerPoint and use File → Export → PDF to save as PDF.')
}).catch((err) => {
  console.error('Error:', err)
})
