/**
 * Inspect the raw n8n MCP tool schemas
 */
import 'dotenv/config';
import { loadEnvConfig } from '../src/infrastructure/config/env-config.js';
import { createN8nTools } from '../src/adapters/outbound/ai/n8n-mcp-client.js';
import crypto from 'node:crypto';
import pg from 'pg';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

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

async function main() {
  const config = loadEnvConfig();
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  const { rows } = await pool.query(`SELECT n8n_url, n8n_key_enc FROM projects LIMIT 1`);
  await pool.end();

  const n8nApiKey = decrypt(rows[0].n8n_key_enc, config.encryptionKey);
  const n8nConfig = { apiUrl: rows[0].n8n_url, apiKey: n8nApiKey };

  const { tools, close } = await createN8nTools(n8nConfig);

  // Print all tool schemas to see the structure
  const toolNames = Object.keys(tools);
  console.log(`Total tools: ${toolNames.length}`);

  for (const name of toolNames) {
    const tool = tools[name] as any;
    // Try to find the schema
    const schema = tool?.parameters;
    console.log(`\n=== Tool: ${name} ===`);
    console.log(`Keys in tool object: ${Object.keys(tool).join(', ')}`);
    if (schema) {
      console.log(`Schema type: ${typeof schema}`);
      console.log(`Schema keys: ${Object.keys(schema).join(', ')}`);
      // For the 4th (index 3), 7th (index 6), and 8th (index 7) tools, print the full schema
      const idx = toolNames.indexOf(name);
      if ([3, 6, 7].includes(idx)) {
        console.log(`FULL SCHEMA: ${JSON.stringify(schema, null, 2)}`);
      }
    }
  }

  await close();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
