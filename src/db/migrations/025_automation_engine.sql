-- AFCS Smart Campus - Automation Engine: New rules, tracking, scheduled broadcasts

-- Add last_run_at to notification_rules for duplicate prevention
ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- Scheduled broadcasts (future-dated messages)
CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  content TEXT NOT NULL,
  target_roles TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES staff(id),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "All authenticated can view scheduled_broadcasts"
  ON scheduled_broadcasts FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage scheduled_broadcasts"
  ON scheduled_broadcasts FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

CREATE INDEX IF NOT EXISTS idx_scheduled_broadcasts_status ON scheduled_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_broadcasts_time ON scheduled_broadcasts(scheduled_for);

-- Add new automation rules (idempotent)
INSERT INTO notification_rules (key, label, description, channel, cron_schedule, config) VALUES
  ('assembly_talk_reminder', 'Assembly Talk Reminder', 'Notify staff assigned to Morning Talk duty on Mon & Fri at 7:00 AM', 'telegram', '0 7 * * 1,5', '{"duty_type": "Morning Talk"}'),
  ('daily_report_reminder', 'Daily Report Reminder', 'Remind the Inspection/Report duty staff to submit daily report by 12:00 PM', 'telegram', '0 12 * * 1-5', '{"duty_type": "Inspection/Report Duty"}'),
  ('duty_auto_assign', 'Auto-Assign Duty Rosters', 'Automatically rotate duty assignments daily or weekly', 'telegram', '0 6 * * 1-5', '{"rotation": "daily", "advance_days": 1}'),
  ('parade_auto_close', 'Auto-Close Completed Parades', 'Auto-close parade sessions past scheduled end time (14:30)', 'telegram', '30 14 * * 1-5', '{}'),
  ('scheduled_broadcast_processor', 'Scheduled Broadcast Processor', 'Send any due scheduled broadcasts', 'telegram', '*/15 * * * *', '{}'),
  ('end_of_day_digest', 'End-of-Day Summary Digest', 'Send comprehensive daily stats to commandant at 15:00', 'telegram', '0 15 * * 1-5', '{}'),
  ('assembly_discussion_reminder', 'Assembly Discussion Reminder', 'Notify assigned staff for student discussion session on Mon & Fri after assembly', 'telegram', '0 8 * * 1,5', '{}')
ON CONFLICT (key) DO NOTHING;
