import type { Pool } from 'pg';
import type { ProjectDocumentRecord, ProjectDocumentsPort } from '../../../application/ports/outbound/project-documents.port.js';

export class PostgresProjectDocuments implements ProjectDocumentsPort {
  constructor(private readonly pool: Pool) {}

  async upsert(
    projectId: string,
    docType: string,
    slug: string,
    content: string,
    createdBy?: string,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO project_documents (project_id, doc_type, slug, content, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, doc_type, slug)
       DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [projectId, docType, slug, content, createdBy ?? null],
    );
  }

  async list(projectId: string): Promise<ProjectDocumentRecord[]> {
    const result = await this.pool.query<{
      doc_type: string;
      slug: string;
      content: string;
      updated_at: Date;
    }>(
      `SELECT doc_type, slug, content, updated_at
       FROM project_documents
       WHERE project_id = $1
       ORDER BY doc_type, slug`,
      [projectId],
    );
    return result.rows.map((r) => ({
      docType: r.doc_type,
      slug: r.slug,
      content: r.content,
      updatedAt: r.updated_at,
    }));
  }
}
