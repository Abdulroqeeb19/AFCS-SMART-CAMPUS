-- AFCS Smart Campus - Fix RLS policy for staff table
-- The staff table has RLS enabled but no SELECT policy, blocking:
--   1. Login page staff lookup (client-side Supabase query)
--   2. Dev mode quick login (/api/staff fetch)
--   3. Signup duplicate email/ID checks
-- Run this in your Supabase SQL editor

-- Allow anyone (including anonymous) to read staff data.
-- This is necessary because staff lookup happens BEFORE authentication (login page).
CREATE POLICY IF NOT EXISTS "Anyone can read staff"
    ON staff FOR SELECT
    USING (true);

-- Allow authenticated staff to read other staff (for dashboards, assignments, etc.)
CREATE POLICY IF NOT EXISTS "Authenticated users can read staff"
    ON staff FOR SELECT
    USING (auth.role() = 'authenticated');
