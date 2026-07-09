-- AFCS Smart Campus - Security Hardening

-- 1. Add audit columns to critical tables
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES staff(id);
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS override_reason TEXT;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

ALTER TABLE duty_rosters ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES staff(id);
ALTER TABLE duty_rosters ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE parade_tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES staff(id);

-- 2. Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_staff ON audit_logs(staff_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

-- 3. Rate limiting support table (optional — for token-bucket implementation)
CREATE TABLE IF NOT EXISTS rate_limits (
  key_hash TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '15 minutes'
);
