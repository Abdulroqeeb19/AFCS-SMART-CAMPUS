-- AFCS Smart Campus - Duty Roster Seed Data
-- Run AFTER 005_duty_schema.sql

-- Assign duties for the current week
INSERT INTO duty_rosters (staff_id, duty_type_id, date, status)
SELECT
  s.id,
  dt.id,
  CURRENT_DATE + (n || ' days')::INTERVAL,
  'pending'
FROM staff s
CROSS JOIN duty_types dt
CROSS JOIN generate_series(0, 6) AS n
WHERE s.staff_id IN ('AFC-0003', 'AFC-0004', 'AFC-0005', 'AFC-0006', 'AFC-0007', 'AFC-0008')
   AND dt.name IN ('Morning Talk', 'Parade Duty', 'Assembly Duty', 'Inspection/Report Duty')
  AND n < 5
ORDER BY n, dt.sort_order
LIMIT 30;

-- Mark some as completed
UPDATE duty_rosters
SET status = 'completed', completed_at = now()
WHERE date < CURRENT_DATE;

-- Sample daily reports
INSERT INTO daily_reports (staff_id, date, activities_done, challenges, notes)
SELECT
  id,
  CURRENT_DATE,
  'Conducted morning lessons, graded assignments, supervised exam',
  'Some students arrived late to class',
  'Overall productive day'
FROM staff
WHERE staff_id IN ('AFC-0003', 'AFC-0004', 'AFC-0005')
LIMIT 3;

-- AI summary
INSERT INTO report_summaries (date, summary, ai_insights)
VALUES (
  CURRENT_DATE,
  'Today saw active participation across all departments. Three staff submitted reports highlighting productive classroom activities. Late arrivals noted in some classes. Morning parade had full attendance.',
  '{"staff_present": 12, "reports_submitted": 3, "key_issues": ["student lateness"], "recommendations": ["Reinforce punctuality policy"]}'
);
