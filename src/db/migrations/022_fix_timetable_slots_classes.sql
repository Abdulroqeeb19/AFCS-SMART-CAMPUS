-- AFCS Smart Campus - Fix timetable slots & add JS3 classes

-- ===================== ADD JS3 CLASSES =====================
INSERT INTO classes (name, arm) VALUES
  ('JS3', 'A'),
  ('JS3', 'B'),
  ('JS3', 'C')
ON CONFLICT (name, arm) DO NOTHING;

-- ===================== FIX TIME SLOTS: 2 breaks (short + long), closing 14:20 =====================

-- P4 → Short Break (label only)
UPDATE time_slots SET period_label = 'Short Break' WHERE period_number = 4;

-- P7: convert from 10-min break (10:50-11:00) to 40-min Period 5 (10:50-11:30)
UPDATE time_slots SET
  start_time = '10:50',
  end_time = '11:30',
  is_break = false,
  period_label = 'Period 5'
WHERE period_number = 7;

-- P8: shift to 11:30-12:10 → Period 6
UPDATE time_slots SET
  start_time = '11:30',
  end_time = '12:10',
  period_label = 'Period 6'
WHERE period_number = 8;

-- Delete P9 (was Period 6, 11:40-12:20) — natural transition gap
DELETE FROM time_slots WHERE period_number = 9;

-- P10 → Long Break
UPDATE time_slots SET period_label = 'Long Break' WHERE period_number = 10;

-- Copy updated Monday slots to Tue-Fri
DO $$
DECLARE
  d SMALLINT;
BEGIN
  FOR d IN 2..5 LOOP
    INSERT INTO time_slots (day_of_week, period_number, start_time, end_time, is_assembly, is_break, period_label)
    SELECT d, period_number, start_time, end_time, is_assembly, is_break, period_label
    FROM time_slots WHERE day_of_week = 1
    ON CONFLICT (day_of_week, period_number) DO UPDATE SET
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      is_assembly = EXCLUDED.is_assembly,
      is_break = EXCLUDED.is_break,
      period_label = EXCLUDED.period_label;
  END LOOP;
END $$;

-- Morning periods for hard-subject placement: periods 2,3,5,6 (before lunch at P10)
-- Note: P8-P9 are after P7 (which is now Period 5), before Long Break (P10)
-- Hard subjects go in 2,3,5,6 (morning), easier ones in the afternoon post-lunch

-- ===================== FIX GENERATE ROUTE'S morningPeriods =====================
-- The generate route at src/app/api/timetable/generate/route.ts line ~210 has:
--   const morningPeriods = [2, 3, 5, 6]
-- This is already correct: periods before Long Break (P10) since P7+ are now afternoon
