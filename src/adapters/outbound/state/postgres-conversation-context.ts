import type { PgPool } from '../../../infrastructure/db/pool.js';
import type {
  ContextMessage,
  ConversationContextPort,
} from '../../../application/ports/outbound/conversation-context.port.js';

const MAX_CONTEXT_ROWS = 40;

export class PostgresConversationContext implements ConversationContextPort {
  constructor(private readonly pool: PgPool) {}

  async load(channelId: string, limit: number): Promise<ContextMessage[]> {
    const { rows } = await this.pool.query<{ role: string; content: string }>(
      `SELECT role, content FROM (
         SELECT role, content, created_at
         FROM conversation_context
         WHERE channel_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       ) sub ORDER BY created_at ASC`,
      [channelId, limit],
    );
    return rows.map((r) => ({ role: r.role as ContextMessage['role'], content: r.content }));
  }

  async append(channelId: string, messages: ContextMessage[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const msg of messages) {
        await client.query(
          `INSERT INTO conversation_context (channel_id, role, content) VALUES ($1, $2, $3)`,
          [channelId, msg.role, msg.content],
        );
      }
      // Prune to last MAX_CONTEXT_ROWS rows
      await client.query(
        `DELETE FROM conversation_context
         WHERE channel_id = $1
           AND id NOT IN (
             SELECT id FROM conversation_context
             WHERE channel_id = $1
             ORDER BY created_at DESC
             LIMIT $2
           )`,
        [channelId, MAX_CONTEXT_ROWS],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
