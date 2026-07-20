-- Add is_read tracking to notification_logs for in-app notification bell
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_unread ON notification_logs(recipient_id, is_read) WHERE is_read = false;
