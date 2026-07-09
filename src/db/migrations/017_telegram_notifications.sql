-- AFCS Smart Campus - Telegram Notification Support
-- Run this in your Supabase SQL editor after 016_staff_rls_select_policy.sql

-- Add telegram_chat_id to staff table for linking Telegram accounts
ALTER TABLE staff ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT UNIQUE;

-- Add index for quick lookup by telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_staff_telegram ON staff(telegram_chat_id);
