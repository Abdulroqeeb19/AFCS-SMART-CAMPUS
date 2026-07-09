-- AFCS Smart Campus - Phase 5: AI Timetable Generator
-- Run this in your Supabase SQL editor after 001-008

-- ===================== ACADEMIC CALENDAR =====================

CREATE TABLE IF NOT EXISTS academic_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academic_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint idempotently (CREATE TABLE IF NOT EXISTS ignores constraints on existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_terms_session_name_key') THEN
    ALTER TABLE academic_terms ADD CONSTRAINT academic_terms_session_name_key UNIQUE(session_id, name);
  END IF;
END $$;

-- Clean up duplicate terms that may exist from previous runs without the constraint
DELETE FROM academic_terms a USING academic_terms b
WHERE a.id < b.id AND a.session_id = b.session_id AND a.name = b.name;

-- ===================== SUBJECTS =====================

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  department_id UUID REFERENCES departments(id),
  class_level VARCHAR(20),
  periods_per_week INTEGER NOT NULL DEFAULT 3,
  is_compulsory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  difficulty_tier SMALLINT DEFAULT 3 CHECK (difficulty_tier BETWEEN 1 AND 5),
  needs_double_period BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subject_code ON subjects(code);

CREATE TABLE IF NOT EXISTS teacher_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  max_periods_per_day INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

-- ===================== TIME SLOTS =====================

CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  period_number SMALLINT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN DEFAULT false,
  is_assembly BOOLEAN DEFAULT false,
  period_label VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(day_of_week, period_number)
);

ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS period_label VARCHAR(30);

-- ===================== ROOMS =====================

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  capacity INTEGER DEFAULT 40,
  room_type VARCHAR(30) DEFAULT 'classroom',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== TIMETABLE ENTRIES =====================

CREATE TABLE IF NOT EXISTS timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  period_number SMALLINT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  room_id UUID REFERENCES rooms(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(term_id, day_of_week, period_number, room_id),
  UNIQUE(term_id, class_id, day_of_week, period_number),
  UNIQUE(term_id, teacher_id, day_of_week, period_number)
);

-- ===================== GENERATION LOG =====================

CREATE TABLE IF NOT EXISTS timetable_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  algorithm_used VARCHAR(50) DEFAULT 'constraint-sat',
  total_periods INTEGER DEFAULT 0,
  assigned_periods INTEGER DEFAULT 0,
  conflict_count INTEGER DEFAULT 0,
  conflicts JSONB,
  generated_by UUID REFERENCES staff(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- ===================== CLASS-SUBJECT ASSIGNMENTS =====================

CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  periods_per_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- ===================== RLS POLICIES =====================

ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;

-- academic_sessions
DROP POLICY IF EXISTS "All authenticated can view sessions" ON public.academic_sessions;
CREATE POLICY "All authenticated can view sessions"
ON public.academic_sessions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage sessions" ON academic_sessions;
CREATE POLICY "Admins can manage sessions"
ON academic_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- academic_terms
DROP POLICY IF EXISTS "All authenticated can view terms" ON academic_terms;
CREATE POLICY "All authenticated can view terms"
ON academic_terms
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage terms" ON academic_terms;
CREATE POLICY "Admins can manage terms"
ON academic_terms
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- subjects
DROP POLICY IF EXISTS "All authenticated can view subjects" ON subjects;
CREATE POLICY "All authenticated can view subjects"
ON subjects
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
ON subjects
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- teacher_subjects
DROP POLICY IF EXISTS "All authenticated can view teacher_subjects" ON teacher_subjects;
CREATE POLICY "All authenticated can view teacher_subjects"
ON teacher_subjects
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage teacher_subjects" ON teacher_subjects;
CREATE POLICY "Admins can manage teacher_subjects"
ON teacher_subjects
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- time_slots
DROP POLICY IF EXISTS "All authenticated can view time_slots" ON time_slots;
CREATE POLICY "All authenticated can view time_slots"
ON time_slots
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage time_slots" ON time_slots;
CREATE POLICY "Admins can manage time_slots"
ON time_slots
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- rooms
DROP POLICY IF EXISTS "All authenticated can view rooms" ON rooms;
CREATE POLICY "All authenticated can view rooms"
ON rooms
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
CREATE POLICY "Admins can manage rooms"
ON rooms
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- timetable_entries
DROP POLICY IF EXISTS "All authenticated can view timetable" ON timetable_entries;
CREATE POLICY "All authenticated can view timetable"
ON timetable_entries
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage timetable" ON timetable_entries;
CREATE POLICY "Admins can manage timetable"
ON timetable_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- timetable_generations
DROP POLICY IF EXISTS "All authenticated can view generations" ON timetable_generations;
CREATE POLICY "All authenticated can view generations"
ON timetable_generations
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage generations" ON timetable_generations;
CREATE POLICY "Admins can manage generations"
ON timetable_generations
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- class_subjects
DROP POLICY IF EXISTS "All authenticated can view class_subjects" ON class_subjects;
CREATE POLICY "All authenticated can view class_subjects"
ON class_subjects
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage class_subjects" ON class_subjects;
CREATE POLICY "Admins can manage class_subjects"
ON class_subjects
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM staff
    WHERE staff.id = auth.uid()
      AND staff.role IN ('admin', 'commandant')
  )
);

-- ===================== SEED DATA =====================

-- Seed standard Nigerian time slots (8 x 40min periods + assembly + breaks + lunch)
INSERT INTO time_slots (day_of_week, period_number, start_time, end_time, is_assembly, is_break, period_label) VALUES
  (1, 1, '07:30', '07:50', true, false, 'Assembly'),
  (1, 2, '08:00', '08:40', false, false, 'Period 1'),
  (1, 3, '08:40', '09:20', false, false, 'Period 2'),
  (1, 4, '09:20', '09:30', false, true, 'Break'),
  (1, 5, '09:30', '10:10', false, false, 'Period 3'),
  (1, 6, '10:10', '10:50', false, false, 'Period 4'),
  (1, 7, '10:50', '11:00', false, true, 'Break'),
  (1, 8, '11:00', '11:40', false, false, 'Period 5'),
  (1, 9, '11:40', '12:20', false, false, 'Period 6'),
  (1, 10, '12:20', '13:00', false, true, 'Lunch'),
  (1, 11, '13:00', '13:40', false, false, 'Period 7'),
  (1, 12, '13:40', '14:20', false, false, 'Period 8')
ON CONFLICT (day_of_week, period_number) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_assembly = EXCLUDED.is_assembly,
  is_break = EXCLUDED.is_break,
  period_label = EXCLUDED.period_label;

-- Copy Monday slots to Tue-Fri
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

-- Seed academic sessions and terms
INSERT INTO academic_sessions (name, start_date, end_date, is_current) VALUES
  ('2025/2026', '2025-09-15', '2026-07-17', true)
ON CONFLICT (name) DO NOTHING;

-- Remove any duplicate academic_sessions (safety net)
DELETE FROM academic_sessions a USING academic_sessions b
WHERE a.id < b.id AND a.name = b.name;

-- Remove any duplicate academic_terms (post-constraint safety net)
DELETE FROM academic_terms a USING academic_terms b
WHERE a.id < b.id AND a.session_id = b.session_id AND a.name = b.name;

-- Seed terms using a single session_id lookup to avoid UNION ALL multiplication
DO $$
DECLARE
  sid UUID;
BEGIN
  SELECT id INTO sid FROM academic_sessions WHERE name = '2025/2026' LIMIT 1;
  IF sid IS NOT NULL THEN
    INSERT INTO academic_terms (session_id, name, start_date, end_date, is_current) VALUES
      (sid, '1st Term', '2025-09-15'::date, '2025-12-19'::date, true),
      (sid, '2nd Term', '2026-01-06'::date, '2026-04-03'::date, false),
      (sid, '3rd Term', '2026-04-20'::date, '2026-07-17'::date, false)
    ON CONFLICT (session_id, name) DO NOTHING;
  END IF;
END $$;
