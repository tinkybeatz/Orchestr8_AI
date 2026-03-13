CREATE TABLE IF NOT EXISTS workflows (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id   TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  content       JSONB       NOT NULL DEFAULT '{}',
  documentation JSONB,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_workflow UNIQUE (project_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows (project_id);
