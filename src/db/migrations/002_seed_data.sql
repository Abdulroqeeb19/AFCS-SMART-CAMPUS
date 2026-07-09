-- AFCS Smart Campus - Seed Data for Testing
-- Run this AFTER 001_staff_schema.sql

-- Insert sample staff records
INSERT INTO staff (staff_id, full_name, email, phone, department_id, role) VALUES
  ('AFC-0001', 'Commandant Ibrahim Abdullahi', 'commandant@afcs.edu.ng', '+2348012345601',
    (SELECT id FROM departments WHERE code = 'ADM'), 'commandant'),
  ('AFC-0002', 'Mrs. Grace Okonkwo', 'grace.okonkwo@afcs.edu.ng', '+2348012345602',
    (SELECT id FROM departments WHERE code = 'ADM'), 'admin'),
  ('AFC-0003', 'Mr. Peter Adeyemi', 'peter.adeyemi@afcs.edu.ng', '+2348012345603',
    (SELECT id FROM departments WHERE code = 'SCI'), 'teacher'),
  ('AFC-0004', 'Ms. Fatima Bello', 'fatima.bello@afcs.edu.ng', '+2348012345604',
    (SELECT id FROM departments WHERE code = 'MTH'), 'teacher'),
  ('AFC-0005', 'Mr. Chidi Okafor', 'chidi.okafor@afcs.edu.ng', '+2348012345605',
    (SELECT id FROM departments WHERE code = 'ENG'), 'teacher'),
  ('AFC-0006', 'Mrs. Ngozi Eze', 'ngozi.eze@afcs.edu.ng', '+2348012345606',
    (SELECT id FROM departments WHERE code = 'ART'), 'teacher'),
  ('AFC-0007', 'Lt. Col. Musa Dantata', 'musa.dantata@afcs.edu.ng', '+2348012345607',
    (SELECT id FROM departments WHERE code = 'MLT'), 'teacher'),
  ('AFC-0008', 'Mr. Kunle Ogunleye', 'kunle.ogunleye@afcs.edu.ng', '+2348012345608',
    (SELECT id FROM departments WHERE code = 'ICT'), 'teacher'),
  ('AFC-0009', 'Mrs. Sarah John', 'sarah.john@afcs.edu.ng', '+2348012345609',
    (SELECT id FROM departments WHERE code = 'GNC'), 'teacher'),
  ('AFC-0010', 'Mr. Emeka Nwosu', 'emeka.nwosu@afcs.edu.ng', '+2348012345610',
    (SELECT id FROM departments WHERE code = 'SCI'), 'teacher'),
  ('AFC-0011', 'Ms. Amina Suleiman', 'amina.suleiman@afcs.edu.ng', '+2348012345611',
    (SELECT id FROM departments WHERE code = 'MTH'), 'teacher'),
  ('AFC-0012', 'Mr. Tunde Bakare', 'tunde.bakare@afcs.edu.ng', '+2348012345612',
    (SELECT id FROM departments WHERE code = 'ENG'), 'teacher'),
  ('AFC-0013', 'Mrs. Chioma Obi', 'chioma.obi@afcs.edu.ng', '+2348012345613',
    (SELECT id FROM departments WHERE code = 'SCI'), 'teacher'),
  ('AFC-0014', 'Sgt. Sunday Eze', 'sunday.eze@afcs.edu.ng', '+2348012345614',
    (SELECT id FROM departments WHERE code = 'MLT'), 'support'),
  ('AFC-0015', 'Mr. Segun Ogunbayo', 'segun.ogunbayo@afcs.edu.ng', '+2348012345615',
    (SELECT id FROM departments WHERE code = 'ICT'), 'support'),
  ('AFC-0016', 'Admin Dewale', 'dewaleprotocols@gmail.com', '+2348012345616',
    (SELECT id FROM departments WHERE code = 'ADM'), 'admin'),
  ('AFC-0017', 'Admin Test', 'admin@afcs.edu.ng', '+2348012345617',
    (SELECT id FROM departments WHERE code = 'ADM'), 'admin');

-- Insert sample attendance for today (some staff already checked in)
INSERT INTO staff_attendance (staff_id, date, check_in, status, check_in_method)
SELECT id, CURRENT_DATE, now() - interval '2 hours', 'present', 'manual'
FROM staff WHERE staff_id IN ('AFC-0001', 'AFC-0002', 'AFC-0003', 'AFC-0004', 'AFC-0005',
                              'AFC-0006', 'AFC-0008', 'AFC-0009', 'AFC-0012', 'AFC-0014');

-- One staff marked as late
INSERT INTO staff_attendance (staff_id, date, check_in, status, check_in_method)
SELECT id, CURRENT_DATE, now() - interval '15 minutes', 'late', 'manual'
FROM staff WHERE staff_id = 'AFC-0010';
