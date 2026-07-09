-- AFCS Smart Campus - System Prompts, Broadcasts & Task Templates

CREATE TABLE IF NOT EXISTS system_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  label VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  default_text TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  target_roles TEXT[],
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  default_priority VARCHAR(20) DEFAULT 'normal',
  default_deadline_days INTEGER DEFAULT 7,
  auto_assign_duty_type_id UUID REFERENCES duty_types(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default prompts
INSERT INTO system_prompts (key, category, label, description, prompt_text, default_text) VALUES
  ('whatsapp_task_assigned', 'whatsapp',
   'WhatsApp Task Assignment Template',
   'Template for notifying staff when a task/duty is assigned',
   '🏫 *AFCS Smart Campus*\n─────────────────\n\nHello *{{staff_name}}*,\n\nYou have been assigned a new task:\n\n📋 *{{task_type}}*\n📌 {{task_description}}\n📅 {{task_date}}\n━━━━━━━━━━━━━━━\n\nPlease log in to update your task status.',
   '🏫 *AFCS Smart Campus*\n─────────────────\n\nHello *{{staff_name}}*,\n\nYou have been assigned a new task:\n\n📋 *{{task_type}}*\n📌 {{task_description}}\n📅 {{task_date}}\n━━━━━━━━━━━━━━━\n\nPlease log in to update your task status.'),

  ('whatsapp_duty_roster', 'whatsapp',
   'WhatsApp Duty Roster Template',
   'Template for duty roster assignments',
   '🏫 *AFCS Smart Campus*\n─────────────────\n\nDear *{{staff_name}}*,\n\nYou have been assigned duty for {{date_range}}.\n\nPlease check your task list on the Smart Campus portal for details.',
   '🏫 *AFCS Smart Campus*\n─────────────────\n\nDear *{{staff_name}}*,\n\nYou have been assigned duty for {{date_range}}.\n\nPlease check your task list on the Smart Campus portal for details.'),

  ('ai_insight_absentee_warning', 'ai_insights',
   'AI Insight: High Absentee Alert',
   'Prompt for commandant AI insight card when absentee rate is high',
   'Alert: {{absent_pct}}% absentee rate detected today. Investigate and address.',
   'Alert: {{absent_pct}}% absentee rate detected today. Investigate and address.'),

  ('broadcast_daily_summary', 'broadcast',
   'Daily Summary Broadcast Template',
   'Template for the daily summary broadcast sent to staff',
   '📊 *AFCS Daily Summary*\n📅 {{date}}\n\n👥 Staff: {{staff_present}}/{{staff_total}} present\n🎒 Students: {{students_present}}/{{students_total}} present\n\nThank you for your service.',
   '📊 *AFCS Daily Summary*\n📅 {{date}}\n\n👥 Staff: {{staff_present}}/{{staff_total}} present\n🎒 Students: {{students_present}}/{{students_total}} present\n\nThank you for your service.')

ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "All authenticated can view prompts"
  ON system_prompts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Commandant/admin can manage prompts"
  ON system_prompts FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "All authenticated can view broadcasts"
  ON broadcast_messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Commandant/admin can manage broadcasts"
  ON broadcast_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "All authenticated can view task templates"
  ON task_templates FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Commandant/admin can manage task templates"
  ON task_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));
