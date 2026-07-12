-- AFCS Smart Campus - Automation Engine DDL (run after rules are seeded)
-- Copy and paste this into Supabase SQL Editor and click Run

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
