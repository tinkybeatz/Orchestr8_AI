import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import type { Tool } from 'ai';
import type { N8nMcpConfig } from '../../../application/ports/outbound/ai-agent.port.js';

export async function createN8nTools(n8nConfig: N8nMcpConfig): Promise<{
  tools: Record<string, Tool>;
  close: () => Promise<void>;
}> {
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
  return { tools, close: () => client.close() };
}
