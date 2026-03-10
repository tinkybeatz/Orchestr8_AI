/**
 * Diagnostic: runs the full ProjectAgent flow against the real DB/n8n
 * Usage: npx tsx scripts/diagnose-project-agent.ts
 */
import 'dotenv/config';
import { generateText } from 'ai';
import type { Tool } from 'ai';
import pg from 'pg';
import { buildModel } from '../src/adapters/outbound/ai/model-factory.js';
import { createN8nTools } from '../src/adapters/outbound/ai/n8n-mcp-client.js';
import { loadEnvConfig } from '../src/infrastructure/config/env-config.js';
import crypto from 'node:crypto';

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

function patchBareObjects(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema;
  const s = schema as Record<string, unknown>;
  const result: Record<string, unknown> = { ...s };
  if (
    result['type'] === 'object' &&
    result['additionalProperties'] === undefined &&
    (!result['properties'] || Object.keys(result['properties'] as object).length === 0)
  ) {
    result['additionalProperties'] = true;
  }
  if (result['properties'] && typeof result['properties'] === 'object') {
    const props = result['properties'] as Record<string, unknown>;
    result['properties'] = Object.fromEntries(
      Object.entries(props).map(([k, v]) => [k, patchBareObjects(v)]),
    );
  }
  if (result['items']) {
    result['items'] = Array.isArray(result['items'])
      ? (result['items'] as unknown[]).map(patchBareObjects)
      : patchBareObjects(result['items']);
  }
  return result;
}

function sanitizeTools(tools: Record<string, Tool>): Record<string, Tool> {
  const out: Record<string, Tool> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const t = tool as unknown as Record<string, unknown>;
    const params = t['parameters'] as Record<string, unknown> | undefined;
    if (params && typeof params['jsonSchema'] === 'object' && params['jsonSchema'] !== null) {
      out[name] = {
        ...tool,
        parameters: {
          ...params,
          jsonSchema: patchBareObjects(params['jsonSchema']),
        },
      } as unknown as Tool;
    } else {
      out[name] = tool;
    }
  }
  return out;
}

async function main() {
  console.log('\n=== Orchestr8_AI Project Agent Diagnostic ===\n');

  const config = loadEnvConfig();
  console.log(`✓ Config loaded — provider: ${config.aiProvider}, model: ${config.aiModel}`);

  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  const { rows } = await pool.query(
    `SELECT id, channel_id, name, n8n_url, n8n_key_enc, status FROM projects ORDER BY created_at DESC LIMIT 1`
  );

  if (rows.length === 0) {
    console.error('✗ No projects found in DB');
    await pool.end();
    process.exit(1);
  }

  const row = rows[0];
  console.log(`✓ Found project: "${row.name}" (status: ${row.status})`);

  let n8nApiKey: string;
  try {
    n8nApiKey = decrypt(row.n8n_key_enc, config.encryptionKey);
    console.log(`✓ Decrypted n8n API key (length: ${n8nApiKey.length})`);
  } catch (e) {
    console.error(`✗ Failed to decrypt n8n API key: ${e}`);
    await pool.end();
    process.exit(1);
  }

  const n8nConfig = { apiUrl: row.n8n_url, apiKey: n8nApiKey };
  console.log(`✓ AI model built`);

  console.log('\n--- Step 2: Creating n8n MCP tools ---');
  const { tools: rawTools, close } = await createN8nTools(n8nConfig);
  console.log(`✓ MCP connected — ${Object.keys(rawTools).length} tools`);

  // Verify patch is working
  const vn = rawTools['validate_node'] as any;
  const configBefore = vn?.parameters?.jsonSchema?.properties?.config;
  console.log(`  validate_node.config.additionalProperties BEFORE patch: ${configBefore?.additionalProperties}`);

  const sanitized = sanitizeTools(rawTools as Record<string, Tool>);

  const vnAfter = sanitized['validate_node'] as any;
  const configAfter = vnAfter?.parameters?.jsonSchema?.properties?.config;
  console.log(`  validate_node.config.additionalProperties AFTER  patch: ${configAfter?.additionalProperties}`);

  console.log('\n--- Step 3: generateText WITHOUT sanitization ---');
  try {
    await generateText({
      model: buildModel(config),
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hello.' }],
      tools: rawTools as Record<string, Tool>,
      maxSteps: 1,
    });
    console.log(`✓ Passed without sanitization`);
  } catch (e: any) {
    console.log(`✗ Failed without sanitization (expected on Gemini): ${e.message.split('\n')[0]}`);
  }

  console.log('\n--- Step 4: generateText WITH sanitization ---');
  try {
    const result = await generateText({
      model: buildModel(config),
      system: 'You are a helpful assistant. Reply briefly.',
      messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
      tools: sanitized,
      maxSteps: 3,
    });
    console.log(`\n✓ generateText WITH sanitization SUCCEEDED!`);
    console.log(`  reply: "${result.text}"`);
    console.log(`  finishReason: ${result.finishReason}`);
  } catch (e: any) {
    console.error(`\n✗ generateText WITH sanitization FAILED:`);
    console.error(`  ${e.message}`);
    if (e.stack) console.error(e.stack);
  }

  await close();
  await pool.end();
  console.log('\n=== Diagnostic complete ===\n');
  process.exit(0);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
