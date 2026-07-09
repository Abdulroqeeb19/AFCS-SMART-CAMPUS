-- Table for class teachers to report student activities
CREATE TABLE IF NOT EXISTS student_activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities_done TEXT NOT NULL,
  challenges TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one report per staff per class per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_report_staff_class_date
  ON student_activity_reports (staff_id, class_id, date);

-- Enable RLS
ALTER TABLE student_activity_reports ENABLE ROW LEVEL SECURITY;

-- RLS: teachers can insert/update their own reports
CREATE POLICY "Teachers manage own reports"
  ON student_activity_reports FOR ALL
  USING (
    staff_id IN (SELECT id FROM staff WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant'))
  );

-- RLS: admins/commandants can view all
CREATE POLICY "Admins view all reports"
  ON student_activity_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant'))
  );
