import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiAgentPort } from '../../ports/outbound/ai-agent.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';
import { buildOrchestratorTools, type OrchestratorToolDeps } from './orchestrator-tools.js';

const CONTEXT_WINDOW = 20;

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

    const reply = await this.aiAgent.run({ system, messages, tools });

    await this.context.append(this.channelId, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: reply },
    ]);

    return reply;
  }
}
