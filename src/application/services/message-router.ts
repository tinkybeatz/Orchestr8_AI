import type { TextMessage } from '../ports/inbound/text-conversation.port.js';
import type { ConversationContextPort } from '../ports/outbound/conversation-context.port.js';
import type { AiAgentPort } from '../ports/outbound/ai-agent.port.js';
import type { ProjectRegistryPort } from '../ports/outbound/project-registry.port.js';
import type { ProjectDocumentsPort } from '../ports/outbound/project-documents.port.js';
import type { TelemetryPort } from '../ports/outbound/telemetry.port.js';
import type { TextConversationPort } from '../ports/inbound/text-conversation.port.js';
import { OrchestratorAgent } from '../agents/orchestrator/orchestrator-agent.js';
import type { OrchestratorToolDeps } from '../agents/orchestrator/orchestrator-tools.js';
import { ProjectAgent } from '../agents/project/project-agent.js';

export interface MessageRouterDeps {
  orchestratorChannelId: string;
  guildId: string;
  docsDir: string;
  projectRegistry: ProjectRegistryPort;
  projectDocuments: ProjectDocumentsPort;
  conversationContext: ConversationContextPort;
  aiAgent: AiAgentPort;
  orchestratorToolDeps: OrchestratorToolDeps;
  conversation: TextConversationPort;
  telemetry: TelemetryPort;
}

/** Convert an error into a human-friendly Discord message. */
function userFacingError(err: unknown): string {
  const msg = String(err);
  if (msg.includes('Resource exhausted') || msg.includes('Too Many Requests') || msg.includes('rate limit') || msg.includes('429')) {
    return '⏳ The AI provider is rate-limited right now. Please wait 30–60 seconds and try again.';
  }
  if (msg.includes('high demand') || msg.includes('overloaded') || msg.includes('capacity')) {
    return '⏳ The AI model is experiencing high demand. Please try again in a moment.';
  }
  return '❌ Something went wrong while processing your request. Please try again.';
}

export class MessageRouter {
  private readonly orchestratorAgent: OrchestratorAgent;
  private readonly projectAgent: ProjectAgent;

  constructor(private readonly deps: MessageRouterDeps) {
    this.orchestratorAgent = new OrchestratorAgent(
      deps.aiAgent,
      deps.orchestratorToolDeps,
      deps.conversationContext,
      deps.orchestratorChannelId,
      deps.docsDir,
    );
    this.projectAgent = new ProjectAgent(
      deps.aiAgent,
      deps.conversationContext,
      deps.projectDocuments,
      deps.docsDir,
    );
  }

  async handle(message: TextMessage): Promise<void> {
    if (message.channelId === this.deps.orchestratorChannelId) {
      this.deps.telemetry.log('info', 'OrchestratorAgent handling message', { userId: message.userId });
      try {
        const reply = await this.orchestratorAgent.handle(
          message.content,
          this.deps.guildId,
          message.userId,
        );
        await this.deps.conversation.sendReply(message.channelId, reply);
        this.deps.telemetry.log('info', 'OrchestratorAgent replied', { userId: message.userId });
      } catch (err) {
        this.deps.telemetry.log('error', 'OrchestratorAgent error', { err: String(err) });
        await this.deps.conversation.sendReply(message.channelId, userFacingError(err));
      }
      return;
    }

    const project = await this.deps.projectRegistry.findByChannelId(message.channelId);
    if (!project) return;

    if (project.status !== 'active') {
      await this.deps.conversation.sendReply(
        message.channelId,
        `This project is currently **${project.status}**. Contact the orchestrator to reactivate it.`,
      );
      return;
    }

    this.deps.telemetry.log('info', 'ProjectAgent handling message', { project: project.name, userId: message.userId });
    try {
      const reply = await this.projectAgent.handle(project, message.content, message.userId);
      await this.deps.conversation.sendReply(message.channelId, reply);
      this.deps.telemetry.log('info', 'ProjectAgent replied', { project: project.name });
    } catch (err) {
      this.deps.telemetry.log('error', 'ProjectAgent error', {
        channelId: message.channelId,
        project: project.name,
        err: String(err),
      });
      await this.deps.conversation.sendReply(message.channelId, userFacingError(err));
    }
  }
}
