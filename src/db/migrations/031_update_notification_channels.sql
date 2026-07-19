-- Redirect automation notifications from WhatsApp/SMS to Telegram
-- The automation engine already sends via Telegram; this updates the display channel in the UI.

UPDATE notification_rules
SET channel = 'telegram',
    description = 'Send Telegram notification when a task is assigned'
WHERE key = 'task_assigned'
  AND channel != 'telegram';

UPDATE notification_rules
SET channel = 'telegram',
    description = 'Send Telegram alert to commandant if absentee rate > 30%'
WHERE key = 'absentee_alert'
  AND channel != 'telegram';

UPDATE notification_rules
SET channel = 'telegram',
    description = 'Send end-of-day Telegram summary to commandant & admin'
WHERE key = 'daily_summary_broadcast'
  AND channel != 'telegram';

UPDATE notification_rules
SET channel = 'telegram',
    description = 'Remind staff via Telegram who haven''t checked in by 8:30 AM'
WHERE key = 'checkin_reminder'
  AND channel != 'telegram';

UPDATE notification_rules
SET channel = 'telegram',
    description = 'Remind teachers via Telegram of upcoming class period'
WHERE key = 'next_period_notify'
  AND channel != 'telegram';

UPDATE notification_rules
SET channel = 'telegram',
    description = 'Send Telegram notification when duty roster is generated'
WHERE key = 'duty_roster_notify'
  AND channel != 'telegram';
