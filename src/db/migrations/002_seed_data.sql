-- AFCS Smart Campus - Seed Data for Testing
-- Run this AFTER 001_staff_schema.sql

-- Only the commandant account is seeded. All other staff must be added via the admin UI.
INSERT INTO staff (staff_id, full_name, email, phone, department_id, role) VALUES
  ('AFC-0001', 'Commandant', 'commandant@afcs.edu.ng', '+2348012345601',
    (SELECT id FROM departments WHERE code = 'ADM'), 'commandant')
ON CONFLICT (staff_id) DO NOTHING;
