-- Prefect roles system
-- Adds a prefect_roles lookup table and a FK on students

CREATE TABLE IF NOT EXISTS prefect_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS prefect_role_id UUID REFERENCES prefect_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_prefect_role ON students(prefect_role_id);

INSERT INTO prefect_roles (name, display_order) VALUES
  ('Head Boy', 1),
  ('Head Girl', 2),
  ('Senior Prefect (Boy)', 3),
  ('Senior Prefect (Girl)', 4),
  ('Dining Hall Prefect (Boy)', 5),
  ('Dining Hall Prefect (Girl)', 6),
  ('Mosque/Chapel Prefect (Boy)', 7),
  ('Mosque/Chapel Prefect (Girl)', 8),
  ('Laboratory Prefect (Boy)', 9),
  ('Laboratory Prefect (Girl)', 10),
  ('Library Prefect (Boy)', 11),
  ('Library Prefect (Girl)', 12),
  ('Sports Prefect (Boy)', 13),
  ('Sports Prefect (Girl)', 14),
  ('Health Prefect (Boy)', 15),
  ('Health Prefect (Girl)', 16),
  ('Time Prefect (Boy)', 17),
  ('Time Prefect (Girl)', 18)
ON CONFLICT DO NOTHING;
