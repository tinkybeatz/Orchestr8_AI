import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiAgentPort } from '../../ports/outbound/ai-agent.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';
import type { ProjectRecord } from '../../ports/outbound/project-registry.port.js';
import type { ProjectDocumentsPort } from '../../ports/outbound/project-documents.port.js';
import type { WorkflowRegistryPort } from '../../ports/outbound/workflow-registry.port.js';
import { buildProjectTools } from './project-tools.js';

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

const CONTEXT_WINDOW = 20;

const ROLE_PROFILES: Record<string, string> = {
  expert: 'N8N_EXPERT.md',
  fixer: 'FIXER.md',
  tasker: 'TASKER.md',
  documentor: 'DOCUMENTOR.md',
  researcher: 'RESEARCHER.md',
  improver: 'IMPROVER.md',
  product: 'PRODUCT_MANAGER.md',
};

const SKILL_FILES = [
  'n8n-mcp-tools-expert.md',
  'n8n-workflow-patterns.md',
  'n8n-node-configuration.md',
  'n8n-validation-expert.md',
  'n8n-expression-syntax.md',
  'n8n-code-javascript.md',
  'n8n-code-python.md',
];

function parseRole(message: string): { profileFile: string; content: string; withSkills: boolean } {
  const match = /^\/(\w+)\s+/.exec(message);
  if (match) {
    const prefix = match[1]!.toLowerCase();
    const profileFile = ROLE_PROFILES[prefix];
    if (profileFile) {
      return { profileFile, content: message.slice(match[0].length), withSkills: prefix === 'expert' };
    }
  }
  return { profileFile: 'N8N_BASE.md', content: message, withSkills: false };
}

export class ProjectAgent {
  constructor(
    private readonly aiAgent: AiAgentPort,
    private readonly context: ConversationContextPort,
    private readonly documents: ProjectDocumentsPort,
    private readonly workflows: WorkflowRegistryPort,
    private readonly docsDir: string,
  ) {}

  async handle(project: ProjectRecord, userMessage: string, userId: string): Promise<string> {
    const { profileFile, content, withSkills } = parseRole(userMessage);

    const init = readFileSync(join(this.docsDir, 'INIT.md'), 'utf8');
    const profile = readFileSync(join(this.docsDir, 'profiles', profileFile), 'utf8');
    const skillsText = withSkills
      ? SKILL_FILES.map((f) => readFileSync(join(this.docsDir, 'skills', f), 'utf8')).join('\n\n---\n\n')
      : '';

    const system = [init, profile, ...(withSkills ? [skillsText] : [])].join('\n\n---\n\n');

    const history = await this.context.load(project.channelId, CONTEXT_WINDOW);
    const messages = [
      ...history,
      { role: 'user' as const, content },
    ];

    const tools = buildProjectTools({
      documents: this.documents,
      workflows: this.workflows,
      conversationContext: this.context,
      project,
      userId,
    });
    const { text, usage } = await this.aiAgent.run({ system, messages, tools, n8nConfig: project.n8nConfig });

    const total = usage.inputTokens + usage.outputTokens;
    const reply = `${text}\n\n*(${formatTokens(total)} tokens, ${formatCost(usage.costUsd)})*`;

    // Only persist the assistant turn if there is actual text — an empty string
    // (tool-only response) stored in context crashes Gemini on the next request.
    const toAppend: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: userMessage },
    ];
    if (text.trim()) toAppend.push({ role: 'assistant', content: text });
    await this.context.append(project.channelId, toAppend);

    return reply;
  }
}
