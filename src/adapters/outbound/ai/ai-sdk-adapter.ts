import { generateText } from 'ai';
import type { LanguageModel, CoreMessage, Tool } from 'ai';
import { createN8nTools } from './n8n-mcp-client.js';
import type { AiAgentPort, AiRunOptions } from '../../../application/ports/outbound/ai-agent.port.js';

export class AiSdkAdapter implements AiAgentPort {
  constructor(private readonly model: LanguageModel) {}

  async run(options: AiRunOptions): Promise<string> {
    const { system, messages, tools, n8nConfig, maxSteps = 20 } = options;

    let n8nTools: Record<string, Tool> = {};
    let closeMcp: (() => Promise<void>) | undefined;

    if (n8nConfig) {
      const result = await createN8nTools(n8nConfig);
      n8nTools = result.tools;
      closeMcp = result.close;
    }

    try {
      const allTools = { ...(tools as Record<string, Tool>), ...n8nTools };
      const result = await generateText({
        model: this.model,
        system,
        messages: messages as CoreMessage[],
        tools: Object.keys(allTools).length > 0 ? allTools : undefined,
        maxSteps,
      });
      return result.text;
    } finally {
      if (closeMcp) await closeMcp();
    }
  }
}
