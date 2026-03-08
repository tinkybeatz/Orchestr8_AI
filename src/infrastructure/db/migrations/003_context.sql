-- 003_context.sql
-- Per-channel conversation context for project agents
-- Standards: DBS-101, ARCH-006

CREATE TABLE IF NOT EXISTS conversation_context (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_context_channel_time ON conversation_context (channel_id, created_at DESC);
