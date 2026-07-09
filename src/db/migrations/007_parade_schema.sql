-- AFCS Smart Campus - Phase 4: Muster Parade Automation

-- PARADE SESSIONS
CREATE TABLE IF NOT EXISTS parade_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  conducted_by UUID REFERENCES staff(id),
  type VARCHAR(50) DEFAULT 'morning',
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PARADE BRIEFINGS
CREATE TABLE IF NOT EXISTS parade_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parade_id UUID REFERENCES parade_sessions(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  category VARCHAR(50) DEFAULT 'general',
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PARADE TASKS
CREATE TABLE IF NOT EXISTS parade_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parade_id UUID REFERENCES parade_sessions(id) NOT NULL,
  briefing_id UUID REFERENCES parade_briefings(id),
  assigned_to UUID REFERENCES staff(id),
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  deadline DATE,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PARADE ACKNOWLEDGEMENTS
CREATE TABLE IF NOT EXISTS parade_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parade_id UUID REFERENCES parade_sessions(id) NOT NULL,
  staff_id UUID REFERENCES staff(id) NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parade_id, staff_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_parade_date ON parade_sessions(date);
CREATE INDEX IF NOT EXISTS idx_parade_status ON parade_sessions(status);
CREATE INDEX IF NOT EXISTS idx_parade_briefing_parade ON parade_briefings(parade_id);
CREATE INDEX IF NOT EXISTS idx_parade_task_parade ON parade_tasks(parade_id);
CREATE INDEX IF NOT EXISTS idx_parade_task_assigned ON parade_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_parade_task_status ON parade_tasks(status);
CREATE INDEX IF NOT EXISTS idx_parade_ack_parade ON parade_acknowledgements(parade_id);

-- ROW LEVEL SECURITY
ALTER TABLE parade_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parade_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parade_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE parade_acknowledgements ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY IF NOT EXISTS "All staff can view parades"
  ON parade_sessions FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage parades"
  ON parade_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "All staff can view briefings"
  ON parade_briefings FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage briefings"
  ON parade_briefings FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "Staff can view their tasks"
  ON parade_tasks FOR SELECT
  USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant', 'teacher')));

CREATE POLICY IF NOT EXISTS "Admins can manage tasks"
  ON parade_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant')));

CREATE POLICY IF NOT EXISTS "Staff can view acknowledgements"
  ON parade_acknowledgements FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Staff can acknowledge parades"
  ON parade_acknowledgements FOR INSERT
  WITH CHECK (staff_id = auth.uid());
