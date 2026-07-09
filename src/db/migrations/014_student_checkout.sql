-- AFCS Smart Campus - Phase: Student Check-Out Support
-- Adds check_out column to student_attendance for period-based check-out

ALTER TABLE IF EXISTS student_attendance
  ADD COLUMN IF NOT EXISTS check_out TIMESTAMPTZ;

-- Update index to cover check_out queries
CREATE INDEX IF NOT EXISTS idx_student_attendance_checkout
  ON student_attendance(student_id, date);
