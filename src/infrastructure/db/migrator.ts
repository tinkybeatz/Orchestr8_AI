import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { PgPool } from './pool.js';

interface MigrationFile {
  version: number;
  name: string;
  sql: string;
}

export function loadMigrations(migrationsDir: string): MigrationFile[] {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match?.[1] || !match[2]) {
      throw new Error(`Invalid migration filename: ${file}. Expected format: NNN_name.sql`);
    }
    return {
      version: parseInt(match[1], 10),
      name: match[2],
      sql: readFileSync(join(migrationsDir, file), 'utf-8'),
    };
  });
}

export async function migrate(pool: PgPool, migrationsDir: string): Promise<number> {
  const client = await pool.connect();
  try {
    // Ensure schema_versions exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        version     INTEGER PRIMARY KEY,
        name        TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ version: number }>(
      'SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1',
    );
    const currentVersion = rows[0]?.version ?? 0;

    const migrations = loadMigrations(migrationsDir);
    const pending = migrations.filter((m) => m.version > currentVersion);

    if (pending.length === 0) {
      console.info('[migrator] No pending migrations.');
      return currentVersion;
    }

    for (const migration of pending) {
      console.info(`[migrator] Applying migration ${migration.version}: ${migration.name}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_versions (version, name) VALUES ($1, $2)',
          [migration.version, migration.name],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    const lastApplied = pending[pending.length - 1]!;
    console.info(`[migrator] Applied ${pending.length} migration(s). Current version: ${lastApplied.version}`);
    return lastApplied.version;
  } finally {
    client.release();
  }
}
