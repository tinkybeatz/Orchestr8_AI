-- 004_project_documents.sql
-- Persistent storage for Claude-generated project documentation
-- Replaces local file writes — content stored in DB for API access and VPS deployability

CREATE TABLE IF NOT EXISTS project_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id),
  doc_type    TEXT NOT NULL,
  slug        TEXT NOT NULL DEFAULT 'default',
  content     TEXT NOT NULL,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, doc_type, slug)
);

CREATE INDEX idx_project_docs ON project_documents (project_id, doc_type);
