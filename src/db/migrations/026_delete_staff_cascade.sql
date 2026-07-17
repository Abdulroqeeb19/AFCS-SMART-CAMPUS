-- AFCS Smart Campus - Cascade delete for staff
-- Run this in your Supabase SQL editor
-- Creates a function to safely delete a staff member and all related records

CREATE OR REPLACE FUNCTION delete_staff_cascade(p_staff_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM staff_attendance WHERE staff_id = p_staff_id;
  DELETE FROM parade_acknowledgements WHERE staff_id = p_staff_id;
  DELETE FROM duty_rosters WHERE staff_id = p_staff_id;
  DELETE FROM daily_reports WHERE staff_id = p_staff_id;
  DELETE FROM task_responses WHERE staff_id = p_staff_id;
  DELETE FROM audit_logs WHERE staff_id = p_staff_id;

  UPDATE classes SET class_teacher_id = NULL WHERE class_teacher_id = p_staff_id;
  UPDATE parade_sessions SET conducted_by = NULL WHERE conducted_by = p_staff_id;
  UPDATE parade_briefings SET created_by = NULL WHERE created_by = p_staff_id;
  UPDATE parade_tasks SET assigned_to = NULL WHERE assigned_to = p_staff_id;
  UPDATE parade_tasks SET completed_by = NULL WHERE completed_by = p_staff_id;
  UPDATE staff_attendance SET overridden_by = NULL WHERE overridden_by = p_staff_id;
  UPDATE duty_rosters SET completed_by = NULL WHERE completed_by = p_staff_id;
  UPDATE notification_logs SET recipient_id = NULL WHERE recipient_id = p_staff_id;
  UPDATE timetable_generations SET generated_by = NULL WHERE generated_by = p_staff_id;

  DELETE FROM staff WHERE id = p_staff_id;
END;
$$;
