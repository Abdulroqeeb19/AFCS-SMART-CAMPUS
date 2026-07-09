-- Add telegram_bot_token to settings table for persistent storage
ALTER TABLE settings ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT DEFAULT '';

-- Create settings table if it doesn't exist yet, then add telegram_bot_token column
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cutoff_hour INTEGER NOT NULL DEFAULT 8,
  cutoff_minute INTEGER NOT NULL DEFAULT 0,
  closing_hour INTEGER NOT NULL DEFAULT 16,
  closing_minute INTEGER NOT NULL DEFAULT 0,
  school_name VARCHAR(255) NOT NULL DEFAULT 'Air Force Comprehensive School, Igbara-Oke',
  enable_whatsapp_notifications BOOLEAN DEFAULT false,
  enable_qr_checkin BOOLEAN DEFAULT true,
  telegram_bot_token TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- If table already existed, just add the column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'telegram_bot_token'
  ) THEN
    ALTER TABLE settings ADD COLUMN telegram_bot_token TEXT DEFAULT '';
  END IF;
END $$;

-- Insert default row if settings table is empty
INSERT INTO settings (cutoff_hour, cutoff_minute)
SELECT 8, 0
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Enable RLS (safe to run multiple times)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Remove existing policy if present
DROP POLICY IF EXISTS "Anyone can read settings"
ON settings;

-- Allow authenticated users to read settings
CREATE POLICY "Anyone can read settings"
ON settings
FOR SELECT
TO authenticated
USING (true);
