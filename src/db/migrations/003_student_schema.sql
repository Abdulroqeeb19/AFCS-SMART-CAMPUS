-- AFCS Smart Campus - Phase 2: Student Attendance Automation

-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(10) NOT NULL,
  arm VARCHAR(5) NOT NULL DEFAULT 'A',
  class_teacher_id UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, arm)
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  class_id UUID REFERENCES classes(id) NOT NULL,
  parent_name VARCHAR(255),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(255),
  parent_whatsapp VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STUDENT ATTENDANCE
CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'absent',
  check_in_method VARCHAR(20) DEFAULT 'manual',
  period VARCHAR(20) DEFAULT 'morning',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date, period)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_status ON student_attendance(status);
CREATE INDEX IF NOT EXISTS idx_student_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_student_active ON students(is_active);

-- ROW LEVEL SECURITY
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Teachers can view their class students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = students.class_id
      AND (classes.class_teacher_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM staff WHERE role IN ('admin', 'commandant')
      ))
    )
  );

CREATE POLICY IF NOT EXISTS "Teachers can view their class attendance"
  ON student_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN classes ON classes.id = students.class_id
      WHERE students.id = student_attendance.student_id
      AND (classes.class_teacher_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM staff WHERE role IN ('admin', 'commandant')
      ))
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage students"
  ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage student attendance"
  ON student_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid() AND staff.role IN ('admin', 'commandant')
    )
  );

-- DEFAULT CLASSES (JS1-JS2 per current school structure)
INSERT INTO classes (name, arm) VALUES
  ('JS1', 'A'), ('JS1', 'B'), ('JS1', 'C'),
  ('JS2', 'A'), ('JS2', 'B'), ('JS2', 'C');
