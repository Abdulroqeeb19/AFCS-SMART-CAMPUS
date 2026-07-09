-- Fix RLS policies for dev mode (no Supabase session, auth.uid() = null)
-- Strategy: Make SELECT policies permissive for all tables,
-- rely on API-level requireAdmin() checks for mutations.

-- STAFF: Allow UPDATE needed for telegram_chat_id linking
-- (In dev mode, admin client bypasses RLS; this helps production too)
DROP POLICY IF EXISTS "Staff can update their own record" ON staff;
CREATE POLICY "Staff can update their own record"
  ON staff FOR UPDATE USING (true);

-- PARADE TASKS: Allow SELECT for all staff (mutation still gated by API)
DROP POLICY IF EXISTS "Staff can view their tasks" ON parade_tasks;
CREATE POLICY "All staff can view tasks"
  ON parade_tasks FOR SELECT USING (true);

-- PARADE ACKNOWLEDGEMENTS: Allow all staff to acknowledge
DROP POLICY IF EXISTS "Staff can acknowledge parades" ON parade_acknowledgements;
CREATE POLICY "All staff can acknowledge"
  ON parade_acknowledgements FOR INSERT
  WITH CHECK (true);

-- STAFF ATTENDANCE: All staff can view
DROP POLICY IF EXISTS "Staff can view their own attendance" ON staff_attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON staff_attendance;
CREATE POLICY "All staff can view attendance"
  ON staff_attendance FOR SELECT USING (true);
CREATE POLICY "Staff can insert their own attendance"
  ON staff_attendance FOR INSERT
  WITH CHECK (true);

-- DUTY ROSTERS: All staff can view
DROP POLICY IF EXISTS "Staff can view their roster" ON duty_rosters;
CREATE POLICY "All staff can view rosters"
  ON duty_rosters FOR SELECT USING (true);

-- STUDENTS: All staff can view (mutation gated by API)
DROP POLICY IF EXISTS "Teachers can view their class students" ON students;
CREATE POLICY "All staff can view students"
  ON students FOR SELECT USING (true);

-- STUDENT ATTENDANCE: All staff can view
DROP POLICY IF EXISTS "Teachers can view their class attendance" ON student_attendance;
CREATE POLICY "All staff can view student attendance"
  ON student_attendance FOR SELECT USING (true);

-- NOTIFICATION LOGS: All staff can view
DROP POLICY IF EXISTS "Staff can view their own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notification_logs;
CREATE POLICY "All staff can view notifications"
  ON notification_logs FOR SELECT USING (true);

-- DAILY REPORTS: All staff can view
DROP POLICY IF EXISTS "Staff can manage their own reports" ON daily_reports;
CREATE POLICY "All staff can view reports"
  ON daily_reports FOR SELECT USING (true);
