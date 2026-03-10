import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import type { Tool } from 'ai';
import type { N8nMcpConfig } from '../../../application/ports/outbound/ai-agent.port.js';

interface CachedClient {
  client: Awaited<ReturnType<typeof experimental_createMCPClient>>;
  tools: Record<string, Tool>;
  lastUsed: number;
}

/** Per-process cache: one MCP client (= one n8n-mcp process) per n8n instance. */
const clientCache = new Map<string, CachedClient>();

/** Evict idle clients after 10 minutes. */
const IDLE_TTL_MS = 10 * 60 * 1000;

function cacheKey(cfg: N8nMcpConfig): string {
  return `${cfg.apiUrl}::${cfg.apiKey.slice(0, 16)}`;
}

async function getOrCreateClient(n8nConfig: N8nMcpConfig): Promise<CachedClient> {
  const key = cacheKey(n8nConfig);
  const cached = clientCache.get(key);

  if (cached) {
    cached.lastUsed = Date.now();
    return cached;
  }

  const client = await experimental_createMCPClient({
    transport: new Experimental_StdioMCPTransport({
      command: 'npx',
      args: ['-y', 'n8n-mcp'],
      env: {
        ...process.env,
        N8N_API_URL: n8nConfig.apiUrl,
        N8N_API_KEY: n8nConfig.apiKey,
      },
    }),
  });

  const tools = await client.tools();
  const entry: CachedClient = { client, tools, lastUsed: Date.now() };
  clientCache.set(key, entry);
  return entry;
}

/** Evict clients idle longer than IDLE_TTL_MS. */
function evictStaleClients(): void {
  const now = Date.now();
  for (const [key, entry] of clientCache) {
    if (now - entry.lastUsed > IDLE_TTL_MS) {
      entry.client.close().catch(() => undefined);
      clientCache.delete(key);
    }
  }
}

// Periodic cleanup every 5 minutes
setInterval(evictStaleClients, 5 * 60 * 1000).unref();

// Close all clients on shutdown
process.on('exit', () => {
  for (const entry of clientCache.values()) {
    try { entry.client.close(); } catch { /* ignore */ }
  }
});

export async function createN8nTools(n8nConfig: N8nMcpConfig): Promise<{
  tools: Record<string, Tool>;
  close: () => Promise<void>;
}> {
  const entry = await getOrCreateClient(n8nConfig);
  // Return a no-op close: we keep the client alive for reuse
  return { tools: entry.tools, close: async () => undefined };
}
