-- AFCS Smart Campus - Phase 3: Duty Roster & Reporting Automation

-- DUTY TYPES
CREATE TABLE IF NOT EXISTS duty_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6',
  icon VARCHAR(50) DEFAULT 'calendar',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DUTY ROSTERS
CREATE TABLE IF NOT EXISTS duty_rosters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) NOT NULL,
  duty_type_id UUID REFERENCES duty_types(id) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, duty_type_id, date)
);

-- DAILY REPORTS
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities_done TEXT NOT NULL,
  challenges TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- REPORT SUMMARIES (AI-generated)
CREATE TABLE IF NOT EXISTS report_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  ai_insights JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_roster_date ON duty_rosters(date);
CREATE INDEX IF NOT EXISTS idx_roster_staff ON duty_rosters(staff_id);
CREATE INDEX IF NOT EXISTS idx_roster_status ON duty_rosters(status);
CREATE INDEX IF NOT EXISTS idx_report_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_report_staff ON daily_reports(staff_id);

-- ROW LEVEL SECURITY
ALTER TABLE duty_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_summaries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "All staff can view duty types"
  ON duty_types FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage duty types"
  ON duty_types FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "Staff can view their roster"
  ON duty_rosters FOR SELECT
  USING (staff_id = auth.uid() OR EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant', 'teacher')));

CREATE POLICY IF NOT EXISTS "Admins can manage rosters"
  ON duty_rosters FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "Staff can manage their own reports"
  ON daily_reports FOR ALL
  USING (staff_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can view all reports"
  ON daily_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant', 'teacher')));

-- DEFAULT DUTY TYPES
INSERT INTO duty_types (name, description, color, icon, sort_order) VALUES
  ('Morning Talk', 'Deliver the morning motivational talk at parade', '#3b82f6', 'sunrise', 1),
  ('Parade Duty', 'Supervise the daily muster parade', '#8b5cf6', 'shield', 2),
  ('Assembly Duty', 'Oversee school assembly', '#06b6d4', 'users', 3),
  ('Inspection/Report Duty', 'Conduct morning inspection of dorms/classrooms and submit daily report', '#f59e0b', 'search', 4),
  ('Sports Duty', 'Supervise sports and physical training', '#10b981', 'activity', 5),
  ('Library Duty', 'Manage library during open hours', '#ec4899', 'book', 6),
  ('Dining Hall Duty', 'Supervise meals in the dining hall', '#ef4444', 'utensils', 7),
  ('Guard Duty', 'Oversee security checkpoint', '#6366f1', 'lock', 8);
