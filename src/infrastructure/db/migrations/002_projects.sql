-- 002_projects.sql
-- Project registry: one Discord channel = one n8n client project
-- Standards: DBS-101, ARCH-006

CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   TEXT NOT NULL UNIQUE,
  guild_id     TEXT NOT NULL,
  name         TEXT NOT NULL,
  purpose      TEXT,
  n8n_url      TEXT NOT NULL,
  n8n_key_enc  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'paused', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   TEXT NOT NULL
);

CREATE INDEX idx_projects_channel ON projects (channel_id);
CREATE INDEX idx_projects_guild   ON projects (guild_id);
CREATE INDEX idx_projects_status  ON projects (status);
