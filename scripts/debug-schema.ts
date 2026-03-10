import 'dotenv/config';
import { loadEnvConfig } from '../src/infrastructure/config/env-config.js';
import { createN8nTools } from '../src/adapters/outbound/ai/n8n-mcp-client.js';
import crypto from 'node:crypto';
import pg from 'pg';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function decrypt(c: string, k: string): string {
  const key = Buffer.from(k, 'hex');
  const buf = Buffer.from(c, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, buf.subarray(0, IV_LENGTH));
  decipher.setAuthTag(buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
  return decipher.update(buf.subarray(IV_LENGTH + TAG_LENGTH)).toString('utf8') + decipher.final('utf8');
}

async function main() {
  const config = loadEnvConfig();
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  const { rows } = await pool.query('SELECT n8n_url, n8n_key_enc FROM projects LIMIT 1');
  await pool.end();
  const { tools, close } = await createN8nTools({
    apiUrl: rows[0].n8n_url,
    apiKey: decrypt(rows[0].n8n_key_enc, config.encryptionKey),
  });

  // Inspect the validate_node tool (index 3)
  const t = tools['validate_node'] as any;
  console.log('\n=== validate_node tool ===');
  console.log('tool keys:', Object.keys(t));
  console.log('parameters type:', typeof t.parameters);
  console.log('parameters keys:', Object.keys(t.parameters));
  console.log('parameters._type:', t.parameters._type);
  console.log('parameters has jsonSchema:', 'jsonSchema' in t.parameters);
  if (t.parameters.jsonSchema) {
    console.log('\nFull jsonSchema:');
    console.log(JSON.stringify(t.parameters.jsonSchema, null, 2));
  }

  // Inspect n8n_create_workflow (index 7) - specifically nodes items
  const t2 = tools['n8n_create_workflow'] as any;
  const js2 = t2.parameters.jsonSchema;
  console.log('\n=== n8n_create_workflow nodes items ===');
  console.log(JSON.stringify(js2.properties.nodes.items, null, 2));

  await close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
