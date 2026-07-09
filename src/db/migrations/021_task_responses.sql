-- Task responses for Telegram two-way communication
-- Teachers can acknowledge, mark complete, or report issues via Telegram inline buttons
-- Commandant/Admin see live responses on dashboard

CREATE TABLE IF NOT EXISTS task_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES parade_tasks(id) NOT NULL,
  staff_id UUID REFERENCES staff(id) NOT NULL,
  response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('acknowledged', 'completed', 'issue_reported')),
  message TEXT,
  telegram_message_id BIGINT,
  responded_at TIMESTAMPTZ DEFAULT now()
);

-- Telegram message → task mapping so we know which task a reply/callback refers to
CREATE TABLE IF NOT EXISTS telegram_task_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_message_id BIGINT NOT NULL,
  task_id UUID REFERENCES parade_tasks(id) NOT NULL,
  chat_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_responses_task ON task_responses(task_id);
CREATE INDEX IF NOT EXISTS idx_task_responses_staff ON task_responses(staff_id);
CREATE INDEX IF NOT EXISTS idx_task_responses_type ON task_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_telegram_task_msg_msgid ON telegram_task_messages(telegram_message_id);

ALTER TABLE task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_task_messages ENABLE ROW LEVEL SECURITY;

-- Allow all staff to view responses (for their own tasks) and admins to view all
CREATE POLICY "Staff can view own responses, admins view all"
  ON task_responses FOR SELECT
  USING (
    staff_id = auth.uid() OR
    EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role IN ('admin', 'commandant'))
  );

CREATE POLICY "System can insert responses"
  ON task_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can insert message mappings"
  ON telegram_task_messages FOR ALL
  USING (true)
  WITH CHECK (true);
