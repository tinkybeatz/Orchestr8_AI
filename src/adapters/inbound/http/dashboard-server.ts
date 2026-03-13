import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type { Pool } from 'pg';
import { renderDashboard } from './dashboard-template.js';

export interface DashboardProject {
  id: string;
  name: string;
  status: string;
  n8n_url: string;
  created_at: Date;
}

export interface DashboardWorkflow {
  workflow_id: string;
  project_name: string;
  name: string;
  has_doc: boolean;
  synced_at: Date;
}

export interface DashboardDoc {
  doc_type: string;
  slug: string;
  project_name: string;
  updated_at: Date;
}

export interface DashboardData {
  projects: DashboardProject[];
  workflows: DashboardWorkflow[];
  docs: DashboardDoc[];
  totalChannels: number;
  generatedAt: Date;
}

export class DashboardServer {
  private readonly expected: Buffer;

  constructor(
    private readonly pool: Pool,
    private readonly user: string,
    private readonly password: string,
    private readonly port: number,
  ) {
    const token = Buffer.from(`${user}:${password}`).toString('base64');
    this.expected = Buffer.from(`Basic ${token}`);
  }

  start(): void {
    createServer((req, res) => void this.handle(req, res)).listen(this.port, () => {
      console.info(`[Dashboard] Listening at http://localhost:${this.port}/dashboard`);
    });
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!this.isAuthorized(req)) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Orchestr8_AI"',
        'Content-Type': 'text/plain',
      });
      res.end('Unauthorized');
      return;
    }

    const url = req.url ?? '/';
    if (url !== '/dashboard' && url !== '/dashboard/') {
      res.writeHead(302, { Location: '/dashboard' });
      res.end();
      return;
    }

    try {
      const data = await this.fetchData();
      const html = renderDashboard(data);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Dashboard error: ${String(err)}`);
    }
  }

  private isAuthorized(req: IncomingMessage): boolean {
    const header = req.headers['authorization'] ?? '';
    const a = Buffer.from(header);
    const b = this.expected;
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async fetchData(): Promise<DashboardData> {
    const [projects, workflows, docs, channels] = await Promise.all([
      this.pool.query<DashboardProject>(
        `SELECT id, name, status, n8n_url, created_at FROM projects ORDER BY created_at DESC`,
      ),
      this.pool.query<DashboardWorkflow>(
        `SELECT w.workflow_id, p.name AS project_name, w.name,
                (w.documentation IS NOT NULL) AS has_doc, w.synced_at
         FROM workflows w JOIN projects p ON w.project_id = p.id
         ORDER BY p.name, w.name`,
      ),
      this.pool.query<DashboardDoc>(
        `SELECT d.doc_type, d.slug, p.name AS project_name, d.updated_at
         FROM project_documents d JOIN projects p ON d.project_id = p.id
         ORDER BY p.name, d.doc_type, d.slug`,
      ),
      this.pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT channel_id)::text AS count FROM projects`,
      ),
    ]);

    return {
      projects: projects.rows,
      workflows: workflows.rows,
      docs: docs.rows,
      totalChannels: parseInt(channels.rows[0]?.count ?? '0', 10),
      generatedAt: new Date(),
    };
  }
}
