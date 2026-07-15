-- AFCS Smart Campus - Friday 30-min periods, earlier breaks, close at 13:00
-- School closes at 1PM GMT on Friday, making each period 30 mins (Mon-Thu are 40 mins).
-- Short Break and Long Break come earlier compared to other days.

-- Remove existing Friday slots
DELETE FROM time_slots WHERE day_of_week = 5;

-- Insert Friday 30-min schedule (11 slots: Assembly + 8 teaching periods + 2 breaks)
INSERT INTO time_slots (day_of_week, period_number, start_time, end_time, is_assembly, is_break, period_label) VALUES
  (5, 1, '07:30', '07:50', true, false, 'Assembly'),
  (5, 2, '08:00', '08:30', false, false, 'Period 1'),
  (5, 3, '08:30', '09:00', false, false, 'Period 2'),
  (5, 4, '09:00', '09:10', false, true, 'Short Break'),
  (5, 5, '09:10', '09:40', false, false, 'Period 3'),
  (5, 6, '09:40', '10:10', false, false, 'Period 4'),
  (5, 7, '10:10', '10:40', false, false, 'Period 5'),
  (5, 8, '10:40', '11:10', false, false, 'Period 6'),
  (5, 9, '11:10', '11:40', false, true, 'Long Break'),
  (5, 10, '11:40', '12:10', false, false, 'Period 7'),
  (5, 11, '12:10', '12:40', false, false, 'Period 8')
ON CONFLICT (day_of_week, period_number) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_assembly = EXCLUDED.is_assembly,
  is_break = EXCLUDED.is_break,
  period_label = EXCLUDED.period_label;

-- Morning periods for hard-subject placement on Friday:
-- periods 2,3,5,6,7,8 (before Long Break at P9)
-- This matches the same set as Mon-Thu (before Long Break at P10)
