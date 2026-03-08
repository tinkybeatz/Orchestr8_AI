import type { PgPool } from '../../../infrastructure/db/pool.js';
import type {
  Checkpoint,
  OutboxEntry,
  StateStorePort,
} from '../../../application/ports/outbound/state-store.port.js';

export class PostgresStateStore implements StateStorePort {
  constructor(private readonly pool: PgPool) {}

  async saveCheckpointAndOutbox(
    checkpoint: Omit<Checkpoint, 'createdAt'>,
    events: Omit<OutboxEntry, 'id' | 'createdAt'>[],
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert checkpoint (UNIQUE on run_id + step_index)
      await client.query(
        `INSERT INTO run_checkpoints (run_id, step_index, state)
         VALUES ($1, $2, $3)
         ON CONFLICT (run_id, step_index) DO UPDATE SET state = $3`,
        [checkpoint.runId, checkpoint.stepIndex, JSON.stringify(checkpoint.state)],
      );

      // Insert outbox events in same transaction (DBS-101-R03)
      for (const event of events) {
        await client.query(
          `INSERT INTO outbox (event_type, payload, correlation_id)
           VALUES ($1, $2, $3)`,
          [event.eventType, JSON.stringify(event.payload), event.correlationId],
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async loadCheckpoint(runId: string): Promise<Checkpoint | null> {
    const { rows } = await this.pool.query<{
      run_id: string;
      step_index: number;
      state: Record<string, unknown>;
      created_at: Date;
    }>(
      `SELECT run_id, step_index, state, created_at
       FROM run_checkpoints
       WHERE run_id = $1
       ORDER BY step_index DESC
       LIMIT 1`,
      [runId],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      runId: row.run_id,
      stepIndex: row.step_index,
      state: row.state,
      createdAt: row.created_at,
    };
  }

  async fetchPendingOutbox(limit: number): Promise<OutboxEntry[]> {
    const { rows } = await this.pool.query<{
      id: string;
      event_type: string;
      payload: Record<string, unknown>;
      correlation_id: string;
      created_at: Date;
    }>(
      `SELECT id, event_type, payload, correlation_id, created_at
       FROM outbox
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
    );

    return rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      payload: row.payload,
      correlationId: row.correlation_id,
      createdAt: row.created_at,
    }));
  }

  async markDispatched(outboxIds: string[]): Promise<void> {
    if (outboxIds.length === 0) return;

    await this.pool.query(
      `UPDATE outbox
       SET status = 'dispatched', dispatched_at = now()
       WHERE id = ANY($1::uuid[])`,
      [outboxIds],
    );
  }
}
