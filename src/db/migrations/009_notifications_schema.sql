-- AFCS Smart Campus - Notifications & Message History

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES staff(id),
  recipient_phone VARCHAR(20),
  recipient_name VARCHAR(255),
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  message_type VARCHAR(50) NOT NULL,
  message_body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider_response JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_recipient ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification_logs(created_at);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view all notifications"
  ON notification_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "Staff can view their own notifications"
  ON notification_logs FOR SELECT
  USING (recipient_id = auth.uid());
