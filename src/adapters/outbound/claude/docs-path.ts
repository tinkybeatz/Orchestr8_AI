import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

/**
 * Absolute path to the docs/ directory.
 * Single source of truth — used by agents to read profile and skill files at runtime.
 *
 * Layout from this file:
 *   src/adapters/outbound/claude/docs-path.ts
 *   → ../../../../docs
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DOCS_DIR = join(__dirname, '../../../../docs');
