import type { Pool } from 'pg';
import type {
  WorkflowDocumentation,
  WorkflowRecord,
  WorkflowRegistryPort,
  WorkflowSummary,
} from '../../../application/ports/outbound/workflow-registry.port.js';

export class PostgresWorkflowRegistry implements WorkflowRegistryPort {
  constructor(private readonly pool: Pool) {}

  async upsert(
    projectId: string,
    workflowId: string,
    name: string,
    content: Record<string, unknown>,
  ): Promise<WorkflowRecord> {
    const result = await this.pool.query(
      `INSERT INTO workflows (project_id, workflow_id, name, content, synced_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (project_id, workflow_id) DO UPDATE
         SET name = EXCLUDED.name,
             content = EXCLUDED.content,
             synced_at = now(),
             updated_at = now()
       RETURNING *`,
      [projectId, workflowId, name, JSON.stringify(content)],
    );
    return this.toRecord(result.rows[0]);
  }

  async setDocumentation(
    projectId: string,
    workflowId: string,
    doc: WorkflowDocumentation,
  ): Promise<void> {
    await this.pool.query(
      `UPDATE workflows SET documentation = $3, updated_at = now()
       WHERE project_id = $1 AND workflow_id = $2`,
      [projectId, workflowId, JSON.stringify(doc)],
    );
  }

  async list(projectId: string): Promise<WorkflowSummary[]> {
    const result = await this.pool.query(
      `SELECT workflow_id, name, documentation, synced_at
       FROM workflows WHERE project_id = $1 ORDER BY name`,
      [projectId],
    );
    return result.rows.map((r) => ({
      workflowId: r.workflow_id as string,
      name: r.name as string,
      documentation: (r.documentation as WorkflowDocumentation | null) ?? null,
      syncedAt: new Date(r.synced_at as string),
    }));
  }

  async get(projectId: string, workflowId: string): Promise<WorkflowRecord | null> {
    const result = await this.pool.query(
      `SELECT * FROM workflows WHERE project_id = $1 AND workflow_id = $2`,
      [projectId, workflowId],
    );
    if (result.rows.length === 0) return null;
    return this.toRecord(result.rows[0]);
  }

  async delete(projectId: string, workflowId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM workflows WHERE project_id = $1 AND workflow_id = $2`,
      [projectId, workflowId],
    );
  }

  private toRecord(row: Record<string, unknown>): WorkflowRecord {
    return {
      id: row['id'] as string,
      projectId: row['project_id'] as string,
      workflowId: row['workflow_id'] as string,
      name: row['name'] as string,
      content: row['content'] as Record<string, unknown>,
      documentation: (row['documentation'] as WorkflowDocumentation | null) ?? null,
      syncedAt: new Date(row['synced_at'] as string),
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
    };
  }
}
