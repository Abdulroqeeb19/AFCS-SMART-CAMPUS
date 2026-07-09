-- AFCS Smart Campus - Student Seed Data
-- Run AFTER 003_student_schema.sql

-- Insert sample students
INSERT INTO students (student_id, full_name, class_id, parent_name, parent_phone, parent_email, parent_whatsapp) VALUES
  ('STU-0001', 'Adebayo Olamide', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'A'), 'Mr. Adebayo', '+2348012345701', 'adebayo@example.com', '+2348012345701'),
  ('STU-0002', 'Chukwuemeka Ifeanyi', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'A'), 'Dr. Chukwuemeka', '+2348012345702', 'chukwuemeka@example.com', '+2348012345702'),
  ('STU-0003', 'Bello Aisha', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'A'), 'Alh. Bello', '+2348012345703', 'bello@example.com', '+2348012345703'),
  ('STU-0004', 'Okonkwo Chiamaka', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'A'), 'Mr. Okonkwo', '+2348012345704', 'okonkwo@example.com', '+2348012345704'),
  ('STU-0005', 'Ogunleye Tunde', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'B'), 'Mrs. Ogunleye', '+2348012345705', 'ogunleye@example.com', '+2348012345705'),
  ('STU-0006', 'Ezeugo Ngozi', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'B'), 'Chief Ezeugo', '+2348012345706', 'ezeugo@example.com', '+2348012345706'),
  ('STU-0007', 'Suleiman Fatima', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'B'), 'Alh. Suleiman', '+2348012345707', 'suleiman@example.com', '+2348012345707'),
  ('STU-0008', 'Dantata Musa', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'C'), 'Lt. Col. Dantata', '+2348012345708', 'dantata@example.com', '+2348012345708'),
  ('STU-0009', 'Adeyemi Funke', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'C'), 'Mr. Adeyemi', '+2348012345709', 'adeyemi@example.com', '+2348012345709'),
  ('STU-0010', 'Obi Chioma', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'C'), 'Dr. Obi', '+2348012345710', 'obi@example.com', '+2348012345710'),
  ('STU-0011', 'Nwosu Emeka', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'A'), 'Chief Nwosu', '+2348012345711', 'nwosu@example.com', '+2348012345711'),
  ('STU-0012', 'John Sarah', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'A'), 'Mrs. John', '+2348012345712', 'john@example.com', '+2348012345712'),
  ('STU-0013', 'Bakare Tunde', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'A'), 'Alh. Bakare', '+2348012345713', 'bakare@example.com', '+2348012345713'),
  ('STU-0014', 'Okafor Chidi', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'B'), 'Dr. Okafor', '+2348012345714', 'okafor@example.com', '+2348012345714'),
  ('STU-0015', 'Eze Nkem', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'B'), 'Mr. Eze', '+2348012345715', 'eze@example.com', '+2348012345715'),
  ('STU-0016', 'Ogunbayo Segun', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'B'), 'Mrs. Ogunbayo', '+2348012345716', 'ogunbayo@example.com', '+2348012345716'),
  ('STU-0017', 'Bello Amina', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'C'), 'Alh. Bello', '+2348012345717', 'amina.bello@example.com', '+2348012345717'),
  ('STU-0018', 'Adeyemi Kunle', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'C'), 'Mr. Adeyemi', '+2348012345718', 'kunle.adeyemi@example.com', '+2348012345718'),
  ('STU-0019', 'Okonkwo Ada', (SELECT id FROM classes WHERE name = 'JS2' AND arm = 'C'), 'Chief Okonkwo', '+2348012345719', 'ada.okonkwo@example.com', '+2348012345719'),
  ('STU-0020', 'Chukwu Kenechi', (SELECT id FROM classes WHERE name = 'JS1' AND arm = 'A'), 'Dr. Chukwu', '+2348012345720', 'chukwu@example.com', '+2348012345720');

-- Sample attendance
INSERT INTO student_attendance (student_id, date, check_in, status, check_in_method)
SELECT id, CURRENT_DATE, now() - interval '3 hours', 'present', 'manual'
FROM students WHERE student_id IN ('STU-0001', 'STU-0002', 'STU-0003', 'STU-0004', 'STU-0005',
                                   'STU-0006', 'STU-0008', 'STU-0009', 'STU-0011', 'STU-0012',
                                   'STU-0013', 'STU-0014', 'STU-0016', 'STU-0017', 'STU-0020');

INSERT INTO student_attendance (student_id, date, check_in, status, check_in_method)
SELECT id, CURRENT_DATE, now() - interval '1 hour', 'late', 'manual'
FROM students WHERE student_id IN ('STU-0007', 'STU-0015', 'STU-0018');
