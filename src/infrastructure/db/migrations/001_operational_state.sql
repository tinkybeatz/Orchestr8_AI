-- 001_operational_state.sql
-- Foundation operational state tables for Joe Personal Assistant
-- Standards: DBS-101, ARCH-001-R03, ADR-0002

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_versions (
  version     INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status        TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  correlation_id UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_runs_status ON agent_runs (status);
CREATE INDEX idx_agent_runs_correlation ON agent_runs (correlation_id);

-- Run checkpoints (immutable append-only per run)
CREATE TABLE IF NOT EXISTS run_checkpoints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES agent_runs(id),
  step_index  INTEGER NOT NULL CHECK (step_index >= 0),
  state       JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_index)
);

CREATE INDEX idx_run_checkpoints_run ON run_checkpoints (run_id);

-- Idempotency keys (deduplication for side-effecting operations)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key         TEXT PRIMARY KEY,
  result      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys (expires_at);

-- Transactional outbox (DBS-101-R03: state write + event intent in single TX)
CREATE TABLE IF NOT EXISTS outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  correlation_id  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at   TIMESTAMPTZ
);

-- Partial index for efficient polling of pending entries
CREATE INDEX idx_outbox_pending ON outbox (created_at) WHERE status = 'pending';
