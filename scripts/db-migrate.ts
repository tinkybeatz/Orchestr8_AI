/**
 * CLI entry point for database migrations.
 */
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { createPool } from '../src/infrastructure/db/pool.js';
import { migrate } from '../src/infrastructure/db/migrator.js';

dotenv.config();

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const migrationsDir = resolve(import.meta.dirname, '..', 'src', 'infrastructure', 'db', 'migrations');

const pool = createPool(DATABASE_URL);
try {
  const version = await migrate(pool, migrationsDir);
  console.info(`[db-migrate] Database at version ${version}.`);
} finally {
  await pool.end();
}
