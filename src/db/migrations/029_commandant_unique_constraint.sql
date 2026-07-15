-- Prevent TOCTOU race condition on commandant signup
-- Ensures only one staff record can have role = 'commandant'

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_unique_commandant
  ON staff ((TRUE))
  WHERE role = 'commandant';
