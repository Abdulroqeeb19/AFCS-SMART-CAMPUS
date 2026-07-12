-- AFCS Smart Campus - Phase 2.5: Commandant Daily To-Do Rule
-- Adds the commandant_todo automation rule

INSERT INTO notification_rules (key, label, description, channel, is_active, cron_schedule, config)
VALUES (
  'commandant_todo',
  'Commandant Daily Briefing',
  'Sends a morning briefing to the Commandant via Telegram with pending tasks, attendance stats, duty rosters, and parade schedule.',
  'telegram',
  true,
  '30 6 * * 1-5',
  '{"tolerance_minutes": 10}'
)
ON CONFLICT (key) DO NOTHING;
