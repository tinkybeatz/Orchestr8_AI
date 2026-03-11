import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiAgentPort } from '../../ports/outbound/ai-agent.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';
import { buildOrchestratorTools, type OrchestratorToolDeps } from './orchestrator-tools.js';

const CONTEXT_WINDOW = 20;

function formatTokens(n: number): string {
  if (n < 1_000) return `${n}`;
  return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0)}k`;
}

function formatCost(usd: number | null): string {
  if (usd === null) return '?';
  if (usd < 0.0001) return '<$0.0001';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export class OrchestratorAgent {
  constructor(
    private readonly aiAgent: AiAgentPort,
    private readonly toolDeps: OrchestratorToolDeps,
    private readonly context: ConversationContextPort,
    private readonly channelId: string,
    private readonly docsDir: string,
  ) {}

  async handle(userMessage: string, guildId: string, userId: string): Promise<string> {
    const init = readFileSync(join(this.docsDir, 'INIT.md'), 'utf8');
    const profile = readFileSync(join(this.docsDir, 'profiles', 'ORCHESTRATOR.md'), 'utf8');
    const system = [init, '---', profile].join('\n\n');

    const history = await this.context.load(this.channelId, CONTEXT_WINDOW);
    const messages = [
      ...history,
      { role: 'user' as const, content: userMessage },
    ];

    const tools = buildOrchestratorTools({ toolDeps: this.toolDeps, guildId, userId });

    const { text, usage } = await this.aiAgent.run({ system, messages, tools });

    const total = usage.inputTokens + usage.outputTokens;
    const reply = `${text}\n\n*(${formatTokens(total)} tokens, ${formatCost(usage.costUsd)})*`;

    // Only persist the assistant turn if there is actual text — an empty string
    // (tool-only response) stored in context crashes Gemini on the next request.
    const toAppend: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: userMessage },
    ];
    if (text.trim()) toAppend.push({ role: 'assistant', content: text });
    await this.context.append(this.channelId, toAppend);

    return reply;
  }
}
