import crypto from 'node:crypto';
import type { PgPool } from '../../../infrastructure/db/pool.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectRecord,
  ProjectRegistryPort,
} from '../../../application/ports/outbound/project-registry.port.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString('utf8') + decipher.final('utf8');
}

interface ProjectRow {
  id: string;
  channel_id: string;
  guild_id: string;
  name: string;
  purpose: string | null;
  n8n_url: string;
  n8n_key_enc: string;
  status: string;
  created_at: Date;
  created_by: string;
}

function rowToRecord(row: ProjectRow, encryptionKey: string): ProjectRecord {
  return {
    id: row.id,
    channelId: row.channel_id,
    guildId: row.guild_id,
    name: row.name,
    purpose: row.purpose,
    n8nConfig: {
      apiUrl: row.n8n_url,
      apiKey: decrypt(row.n8n_key_enc, encryptionKey),
    },
    status: row.status as ProjectRecord['status'],
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export class PostgresProjectRegistry implements ProjectRegistryPort {
  constructor(
    private readonly pool: PgPool,
    private readonly encryptionKey: string,
  ) {}

  async findByChannelId(channelId: string): Promise<ProjectRecord | null> {
    const { rows } = await this.pool.query<ProjectRow>(
      `SELECT id, channel_id, guild_id, name, purpose, n8n_url, n8n_key_enc, status, created_at, created_by
       FROM projects WHERE channel_id = $1`,
      [channelId],
    );
    const row = rows[0];
    if (!row) return null;
    return rowToRecord(row, this.encryptionKey);
  }

  async listAll(guildId: string): Promise<ProjectRecord[]> {
    const { rows } = await this.pool.query<ProjectRow>(
      `SELECT id, channel_id, guild_id, name, purpose, n8n_url, n8n_key_enc, status, created_at, created_by
       FROM projects WHERE guild_id = $1 AND status != 'archived' ORDER BY created_at ASC`,
      [guildId],
    );
    return rows.map((r) => rowToRecord(r, this.encryptionKey));
  }

  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const encryptedKey = encrypt(input.n8nConfig.apiKey, this.encryptionKey);
    const { rows } = await this.pool.query<ProjectRow>(
      `INSERT INTO projects (channel_id, guild_id, name, purpose, n8n_url, n8n_key_enc, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, channel_id, guild_id, name, purpose, n8n_url, n8n_key_enc, status, created_at, created_by`,
      [
        input.channelId,
        input.guildId,
        input.name,
        input.purpose ?? null,
        input.n8nConfig.apiUrl,
        encryptedKey,
        input.createdBy,
      ],
    );
    return rowToRecord(rows[0]!, this.encryptionKey);
  }

  async update(channelId: string, input: UpdateProjectInput): Promise<ProjectRecord> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.name !== undefined) {
      sets.push(`name = $${idx++}`);
      values.push(input.name);
    }
    if ('purpose' in input) {
      sets.push(`purpose = $${idx++}`);
      values.push(input.purpose ?? null);
    }
    if (input.n8nConfig?.apiUrl !== undefined) {
      sets.push(`n8n_url = $${idx++}`);
      values.push(input.n8nConfig.apiUrl);
    }
    if (input.n8nConfig?.apiKey !== undefined) {
      sets.push(`n8n_key_enc = $${idx++}`);
      values.push(encrypt(input.n8nConfig.apiKey, this.encryptionKey));
    }

    if (sets.length === 0) {
      const existing = await this.findByChannelId(channelId);
      if (!existing) throw new Error(`Project not found for channel ${channelId}`);
      return existing;
    }

    values.push(channelId);
    const { rows } = await this.pool.query<ProjectRow>(
      `UPDATE projects SET ${sets.join(', ')} WHERE channel_id = $${idx}
       RETURNING id, channel_id, guild_id, name, purpose, n8n_url, n8n_key_enc, status, created_at, created_by`,
      values,
    );
    if (!rows[0]) throw new Error(`Project not found for channel ${channelId}`);
    return rowToRecord(rows[0], this.encryptionKey);
  }

  async updateStatus(channelId: string, status: ProjectRecord['status']): Promise<void> {
    await this.pool.query(`UPDATE projects SET status = $1 WHERE channel_id = $2`, [
      status,
      channelId,
    ]);
  }

  async delete(channelId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: string }>(
        'SELECT id FROM projects WHERE channel_id = $1',
        [channelId],
      );
      if (rows[0]) {
        await client.query('DELETE FROM project_documents WHERE project_id = $1', [rows[0].id]);
      }
      await client.query('DELETE FROM projects WHERE channel_id = $1', [channelId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
