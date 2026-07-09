-- AFCS Smart Campus - Phase 1: Staff Attendance Automation
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STAFF
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id UUID REFERENCES departments(id),
  role VARCHAR(50) NOT NULL DEFAULT 'teacher',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STAFF ATTENDANCE
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'absent',
  check_in_method VARCHAR(20) DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_attendance_date ON staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON staff_attendance(status);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- ROW LEVEL SECURITY
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read staff data (needed for login lookup before auth)
CREATE POLICY IF NOT EXISTS "Anyone can read staff"
  ON staff FOR SELECT
  USING (true);

-- Allow anyone to read departments (needed for forms and filters)
CREATE POLICY IF NOT EXISTS "Anyone can read departments"
  ON departments FOR SELECT
  USING (true);

-- Policies for authenticated users
CREATE POLICY IF NOT EXISTS "Staff can view their own attendance"
  ON staff_attendance FOR SELECT
  USING (auth.uid() = staff_id);

CREATE POLICY IF NOT EXISTS "Staff can insert their own attendance"
  ON staff_attendance FOR INSERT
  WITH CHECK (auth.uid() = staff_id);

CREATE POLICY IF NOT EXISTS "Staff can update their own check-out"
  ON staff_attendance FOR UPDATE
  USING (auth.uid() = staff_id);

CREATE POLICY IF NOT EXISTS "Admins can view all attendance"
  ON staff_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')
    )
  );

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cutoff_hour INTEGER NOT NULL DEFAULT 8,
  cutoff_minute INTEGER NOT NULL DEFAULT 0,
  closing_hour INTEGER NOT NULL DEFAULT 16,
  closing_minute INTEGER NOT NULL DEFAULT 0,
  school_name VARCHAR(255) NOT NULL DEFAULT 'Air Force Comprehensive School, Igbara-Oke',
  enable_whatsapp_notifications BOOLEAN DEFAULT false,
  enable_qr_checkin BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can manage settings"
  ON settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')
    )
  );

-- DEFAULT DEPARTMENTS
INSERT INTO departments (name, code) VALUES
  ('Administration', 'ADM'),
  ('Science', 'SCI'),
  ('Arts', 'ART'),
  ('Mathematics', 'MTH'),
  ('English', 'ENG'),
  ('Military Training', 'MLT'),
  ('ICT', 'ICT'),
  ('Guidance & Counseling', 'GNC');

-- DEFAULT SETTINGS
INSERT INTO settings (cutoff_hour, cutoff_minute) VALUES (8, 0);
