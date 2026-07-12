-- AFCS Smart Campus - Seed JS3 classes and 5 sample students
-- Run this in Supabase SQL Editor or via: node scripts/run-migration.js src/db/migrations/027_seed_js3_and_sample_students.sql

-- JS3 Classes
INSERT INTO classes (name, arm) VALUES
  ('JS3', 'A'), ('JS3', 'B'), ('JS3', 'C')
ON CONFLICT (name, arm) DO NOTHING;

-- 5 sample students with parent info
INSERT INTO students (student_id, full_name, class_id, parent_name, parent_phone, parent_email, parent_whatsapp) VALUES
  ('STU-0021', 'Ogunbiyi Tolani', (SELECT id FROM classes WHERE name = 'JS3' AND arm = 'A'), 'Mr. Ogunbiyi', '+2348012345721', 'ogunbiyi@example.com', '+2348012345721'),
  ('STU-0022', 'Ezechi Nneka', (SELECT id FROM classes WHERE name = 'JS3' AND arm = 'A'), 'Dr. Ezechi', '+2348012345722', 'ezechi@example.com', '+2348012345722'),
  ('STU-0023', 'Abdulsalam Ibrahim', (SELECT id FROM classes WHERE name = 'JS3' AND arm = 'A'), 'Alh. Abdulsalam', '+2348012345723', 'abdulsalam@example.com', '+2348012345723'),
  ('STU-0024', 'Afolabi Yetunde', (SELECT id FROM classes WHERE name = 'JS3' AND arm = 'B'), 'Mrs. Afolabi', '+2348012345724', 'afolabi@example.com', '+2348012345724'),
  ('STU-0025', 'Okoro Emmanuel', (SELECT id FROM classes WHERE name = 'JS3' AND arm = 'B'), 'Chief Okoro', '+2348012345725', 'okoro@example.com', '+2348012345725')
ON CONFLICT (student_id) DO NOTHING;
