-- AFCS Smart Campus - Parade Seed Data
-- Run AFTER 007_parade_schema.sql

-- Create today's parade session
INSERT INTO parade_sessions (date, type, status, notes)
VALUES (CURRENT_DATE, 'morning', 'scheduled', 'Morning muster parade for staff and students');

-- Add briefing items for today's parade
INSERT INTO parade_briefings (parade_id, title, content, priority, category, created_by)
SELECT
  ps.id,
  b.title,
  b.content,
  b.priority,
  b.category,
  s.id
FROM parade_sessions ps
CROSS JOIN (
  VALUES
    ('Attendance Compliance', 'All staff must ensure 100% attendance this week. Latecomers will be noted.', 'high', 'discipline'),
    ('Academic Progress Review', 'Mid-term assessments to be submitted by Friday. Class teachers must compile results.', 'high', 'academic'),
    ('Facility Maintenance', 'Report any damaged windows or furniture to the admin office immediately.', 'normal', 'administrative'),
    ('PTA Meeting Reminder', 'PTA meeting scheduled for Friday at 2PM in the school hall. All staff must attend.', 'normal', 'general'),
    ('Security Alert', 'Remain vigilant. Report suspicious persons to the guard post. Students must not leave premises without permission.', 'urgent', 'discipline')
) AS b(title, content, priority, category)
CROSS JOIN staff s
WHERE ps.date = CURRENT_DATE
  AND s.role IN ('admin', 'commandant')
LIMIT 5;

-- Create follow-up tasks from briefings
INSERT INTO parade_tasks (parade_id, description, assigned_to, priority, deadline, status)
SELECT
  ps.id,
  t.description,
  s.id,
  t.priority,
  CURRENT_DATE + t.deadline_offset,
  'pending'
FROM parade_sessions ps
CROSS JOIN (
  VALUES
    ('Compile mid-term assessment results for submission', 3, 'high'),
    ('Inspect all classroom windows and furniture for damage', 5, 'normal'),
    ('Prepare attendance compliance report for the week', 2, 'high'),
    ('Confirm PTA meeting venue and seating arrangements', 1, 'normal')
) AS t(description, deadline_offset, priority)
CROSS JOIN staff s
WHERE ps.date = CURRENT_DATE
  AND s.role IN ('admin', 'commandant')
LIMIT 4;
