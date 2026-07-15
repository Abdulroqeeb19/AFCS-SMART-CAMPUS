-- Migration 028: Add rate_limit_logs table for serverless-friendly rate limiting
-- Creates a table used by the updated rate-limit.ts utility

CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by key within time windows
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_key_created ON rate_limit_logs (key, created_at DESC);

-- Auto-cleanup old entries after 1 hour (reduces table bloat)
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_cleanup ON rate_limit_logs (created_at) WHERE created_at < NOW() - INTERVAL '1 hour';

-- Auto-vacuum handles cleanup of old rows
COMMENT ON TABLE rate_limit_logs IS 'Rate limiting logs for API endpoints. Old rows are cleaned up by auto-vacuum.';
