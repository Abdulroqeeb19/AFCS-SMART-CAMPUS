-- Restore strict RLS policies for production
-- Run this on production DB only (undoes migration 019's permissive policies)
-- In dev mode, server uses service_role key (bypasses RLS) + API-level requireAdmin()

-- 1. STAFF
DROP POLICY IF EXISTS "Staff can update their own record" ON staff;
CREATE POLICY "Staff can update their own record"
  ON staff FOR UPDATE
  USING (auth.uid() = id);

-- 2. PARADE TASKS
DROP POLICY IF EXISTS "All staff can view tasks" ON parade_tasks;
CREATE POLICY IF NOT EXISTS "Staff can view their tasks"
  ON parade_tasks FOR SELECT
  USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant', 'teacher')));

-- 3. PARADE ACKNOWLEDGEMENTS
DROP POLICY IF EXISTS "All staff can acknowledge" ON parade_acknowledgements;
CREATE POLICY IF NOT EXISTS "Staff can acknowledge parades"
  ON parade_acknowledgements FOR INSERT
  WITH CHECK (staff_id = auth.uid());

-- 4. STAFF ATTENDANCE
DROP POLICY IF EXISTS "All staff can view attendance" ON staff_attendance;
DROP POLICY IF EXISTS "Staff can insert their own attendance" ON staff_attendance;
CREATE POLICY IF NOT EXISTS "Staff can view their own attendance"
  ON staff_attendance FOR SELECT
  USING (auth.uid() = staff_id);
CREATE POLICY IF NOT EXISTS "Staff can insert their own attendance"
  ON staff_attendance FOR INSERT
  WITH CHECK (auth.uid() = staff_id);
CREATE POLICY IF NOT EXISTS "Admins can view all attendance"
  ON staff_attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));

-- 5. DUTY ROSTERS
DROP POLICY IF EXISTS "All staff can view rosters" ON duty_rosters;
CREATE POLICY IF NOT EXISTS "Staff can view their roster"
  ON duty_rosters FOR SELECT
  USING (staff_id = auth.uid() OR EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant', 'teacher')));

-- 6. STUDENTS
DROP POLICY IF EXISTS "All staff can view students" ON students;
CREATE POLICY IF NOT EXISTS "Teachers can view their class students"
  ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND (classes.class_teacher_id = auth.uid() OR auth.uid() IN (SELECT id FROM staff WHERE role IN ('admin', 'commandant')))));

-- 7. STUDENT ATTENDANCE
DROP POLICY IF EXISTS "All staff can view student attendance" ON student_attendance;
CREATE POLICY IF NOT EXISTS "Teachers can view their class attendance"
  ON student_attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM students JOIN classes ON classes.id = students.class_id WHERE students.id = student_attendance.student_id AND (classes.class_teacher_id = auth.uid() OR auth.uid() IN (SELECT id FROM staff WHERE role IN ('admin', 'commandant')))));

-- 8. NOTIFICATION LOGS
DROP POLICY IF EXISTS "All staff can view notifications" ON notification_logs;
CREATE POLICY IF NOT EXISTS "Admins can view all notifications"
  ON notification_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')));
CREATE POLICY IF NOT EXISTS "Staff can view their own notifications"
  ON notification_logs FOR SELECT
  USING (recipient_id = auth.uid());

-- 9. DAILY REPORTS
DROP POLICY IF EXISTS "All staff can view reports" ON daily_reports;
CREATE POLICY IF NOT EXISTS "Staff can manage their own reports"
  ON daily_reports FOR ALL
  USING (staff_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all reports"
  ON daily_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant', 'teacher')));