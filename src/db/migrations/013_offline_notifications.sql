-- AFCS Smart Campus - Offline/Alternative Notification Channels

-- Staff notification preferences
ALTER TABLE staff ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp": true, "sms": false, "print": false}';

-- Notification queue for offline/retry handling
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES staff(id),
  recipient_phone VARCHAR(20),
  recipient_name VARCHAR(255),
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  message_type VARCHAR(50) NOT NULL,
  message_body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count SMALLINT DEFAULT 0,
  max_retries SMALLINT DEFAULT 3,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_next_attempt ON notification_queue(next_attempt_at);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view queue"
  ON notification_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "Admins can manage queue"
  ON notification_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

-- Scheduled notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  is_active BOOLEAN DEFAULT true,
  cron_schedule VARCHAR(100),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO notification_rules (key, label, description, channel, cron_schedule, config) VALUES
  ('duty_roster_notify', 'Duty Roster Notification', 'Send WhatsApp/SMS when duty roster is generated', 'whatsapp', null, '{"auto_trigger": true}'),
  ('task_assigned', 'Task Assignment Notification', 'Send WhatsApp/SMS when a task is assigned', 'whatsapp', null, '{"auto_trigger": true}'),
  ('absentee_alert', 'Daily Absentee Alert', 'Send SMS alert to commandant if absentee rate > 30%', 'sms', '0 10 * * 1-5', '{"absentee_threshold": 30}'),
  ('checkin_reminder', 'Daily Check-in Reminder', 'Remind staff who haven''t checked in by 8:30 AM', 'whatsapp', '30 8 * * 1-5', '{}'),
  ('next_period_notify', 'Next Period Reminder', 'Remind teachers of upcoming class period', 'whatsapp', null, '{"auto_trigger": true}'),
  ('daily_summary_broadcast', 'Daily Summary Broadcast', 'Send end-of-day attendance summary to all staff', 'whatsapp', '0 14 * * 1-5', '{}'),
  ('sms_fallback', 'SMS Fallback Channel', 'Send via SMS when WhatsApp fails after 3 retries', 'sms', null, '{"auto_trigger": true}'),
  ('print_queue', 'Print Queue for Offline Distribution', 'Queue notifications for physical notice board printing', 'print', '0 7 * * 1', '{}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "All authenticated can view rules"
  ON notification_rules FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can manage rules"
  ON notification_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));
