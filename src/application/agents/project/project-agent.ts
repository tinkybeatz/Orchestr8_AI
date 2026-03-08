import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiAgentPort } from '../../ports/outbound/ai-agent.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';
import type { ProjectRecord } from '../../ports/outbound/project-registry.port.js';
import type { ProjectDocumentsPort } from '../../ports/outbound/project-documents.port.js';
import { buildProjectTools } from './project-tools.js';

const CONTEXT_WINDOW = 40;

const ROLE_PROFILES: Record<string, string> = {
  expert: 'N8N_EXPERT.md',
  fixer: 'FIXER.md',
  tasker: 'TASKER.md',
  documentor: 'DOCUMENTOR.md',
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

function parseRole(message: string): { profileFile: string; content: string; isExpert: boolean } {
  const match = /^\/(\w+)\s+/.exec(message);
  if (match) {
    const prefix = match[1]!.toLowerCase();
    const profileFile = ROLE_PROFILES[prefix];
    if (profileFile) {
      return { profileFile, content: message.slice(match[0].length), isExpert: prefix === 'expert' };
    }
  }
  return { profileFile: 'N8N_EXPERT.md', content: message, isExpert: true };
}

export class ProjectAgent {
  constructor(
    private readonly aiAgent: AiAgentPort,
    private readonly context: ConversationContextPort,
    private readonly documents: ProjectDocumentsPort,
    private readonly docsDir: string,
  ) {}

  async handle(project: ProjectRecord, userMessage: string, userId: string): Promise<string> {
    const { profileFile, content, isExpert } = parseRole(userMessage);

    const init = readFileSync(join(this.docsDir, 'INIT.md'), 'utf8');
    const profile = readFileSync(join(this.docsDir, 'profiles', profileFile), 'utf8');

    const skillsText = isExpert
      ? SKILL_FILES.map((f) => readFileSync(join(this.docsDir, 'skills', f), 'utf8')).join('\n\n---\n\n')
      : '';

    const system = [init, profile, ...(isExpert ? [skillsText] : [])].join('\n\n---\n\n');

    const history = await this.context.load(project.channelId, CONTEXT_WINDOW);
    const messages = [
      ...history,
      { role: 'user' as const, content },
    ];

    const tools = buildProjectTools({ documents: this.documents, projectId: project.id, userId });
    const reply = await this.aiAgent.run({ system, messages, tools, n8nConfig: project.n8nConfig });

    await this.context.append(project.channelId, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: reply },
    ]);

    return reply;
  }
}
