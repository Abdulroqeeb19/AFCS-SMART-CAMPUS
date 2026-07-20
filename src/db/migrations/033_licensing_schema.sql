-- Annual licensing system for school deployments
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(64) UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'essential' CHECK (tier IN ('essential', 'professional', 'enterprise')),
  school_name VARCHAR(255) NOT NULL DEFAULT '',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_active ON licenses(is_active);

-- Tier feature definitions
COMMENT ON TABLE licenses IS 'School license keys for annual subscription management';
