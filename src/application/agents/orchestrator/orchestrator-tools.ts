import { tool } from 'ai';
import { z } from 'zod';
import type { ChannelManagementPort } from '../../ports/outbound/channel-management.port.js';
import type { ProjectRegistryPort, UpdateProjectInput } from '../../ports/outbound/project-registry.port.js';
import type { EventBusPort } from '../../ports/outbound/event-bus.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';

export interface OrchestratorToolDeps {
  channelManagement: ChannelManagementPort;
  projectRegistry: ProjectRegistryPort;
  eventBus: EventBusPort;
  conversationContext: ConversationContextPort;
  projectsCategoryId?: string;
}

export function buildOrchestratorTools(deps: {
  toolDeps: OrchestratorToolDeps;
  guildId: string;
  userId: string;
}) {
  const { toolDeps, guildId, userId } = deps;
  const encoder = new TextEncoder();

  return {
    list_projects: tool({
      description: 'List all n8n projects in this Discord server',
      parameters: z.object({}),
      execute: async () => {
        const projects = await toolDeps.projectRegistry.listAll(guildId);
        return projects.map((p) => ({
          name: p.name,
          channelId: p.channelId,
          n8nUrl: p.n8nConfig.apiUrl,
          purpose: p.purpose,
          status: p.status,
        }));
      },
    }),

    create_project: tool({
      description: 'Create a new n8n project with its own Discord channel. Always run list_projects first to check for duplicates. Collect all four required fields before calling.',
      parameters: z.object({
        projectName: z.string().describe('Human-readable project name (e.g. "Acme Corp")'),
        channelName: z.string().describe('Discord channel slug (lowercase, hyphenated, max 32 chars)'),
        n8nUrl: z.string().describe('n8n API base URL including /api/v1 suffix'),
        n8nApiKey: z.string().describe('n8n API key for the project'),
        purpose: z.string().optional().describe('What this project automates (1-2 sentences)'),
      }),
      execute: async ({ projectName, channelName, n8nUrl, n8nApiKey, purpose }) => {
        const { channelId } = await toolDeps.channelManagement.createTextChannel(
          guildId,
          channelName,
          toolDeps.projectsCategoryId,
          `n8n workspace for ${projectName}`,
        );

        const project = await toolDeps.projectRegistry.create({
          channelId,
          guildId,
          name: projectName,
          purpose,
          n8nConfig: { apiUrl: n8nUrl, apiKey: n8nApiKey },
          createdBy: userId,
        });

        await toolDeps.eventBus.publish({
          subject: 'orchestr8ai.discord.project.created',
          data: encoder.encode(JSON.stringify({ channelId, projectName, guildId, projectId: project.id })),
          msgId: project.id,
        });

        return { success: true, channelId, projectId: project.id, message: `Project "${projectName}" created. Channel: <#${channelId}>` };
      },
    }),

    update_project_status: tool({
      description: 'Update the status of a project (active, paused, archived)',
      parameters: z.object({
        channelId: z.string().describe('Discord channel ID of the project to update'),
        status: z.enum(['active', 'paused', 'archived']),
      }),
      execute: async ({ channelId, status }) => {
        await toolDeps.projectRegistry.updateStatus(channelId, status);
        return { success: true, message: `Project status updated to ${status}` };
      },
    }),

    update_project: tool({
      description:
        'Update one or more properties of an existing project. All fields are optional — only supply the ones that need changing. Always run list_projects first to confirm the target channelId.',
      parameters: z.object({
        channelId: z.string().describe('Discord channel ID of the project to update'),
        name: z.string().optional().describe('New human-readable project name'),
        purpose: z.string().nullable().optional().describe('New purpose/description (pass null to clear)'),
        channelName: z
          .string()
          .optional()
          .describe('New Discord channel slug (lowercase, hyphenated, max 32 chars)'),
        channelTopic: z
          .string()
          .optional()
          .describe('New Discord channel topic shown in Discord UI'),
        n8nUrl: z.string().optional().describe('New n8n API base URL including /api/v1 suffix'),
        n8nApiKey: z.string().optional().describe('New n8n API key for the project'),
      }),
      execute: async ({ channelId, name, purpose, channelName, channelTopic, n8nUrl, n8nApiKey }) => {
        const dbInput: UpdateProjectInput = {
          ...(name !== undefined ? { name } : {}),
          ...(purpose !== undefined ? { purpose } : {}),
          ...(n8nUrl !== undefined || n8nApiKey !== undefined
            ? {
                n8nConfig: {
                  ...(n8nUrl !== undefined ? { apiUrl: n8nUrl } : {}),
                  ...(n8nApiKey !== undefined ? { apiKey: n8nApiKey } : {}),
                },
              }
            : {}),
        };

        const updated = await toolDeps.projectRegistry.update(channelId, dbInput);

        if (channelName) {
          await toolDeps.channelManagement.renameChannel(channelId, channelName);
        }
        if (channelTopic) {
          await toolDeps.channelManagement.setChannelTopic(channelId, channelTopic);
        }

        const updatedFields = [
          ...(name !== undefined ? ['name'] : []),
          ...(purpose !== undefined ? ['purpose'] : []),
          ...(n8nUrl !== undefined ? ['n8nUrl'] : []),
          ...(n8nApiKey !== undefined ? ['n8nApiKey'] : []),
          ...(channelName ? ['channelName'] : []),
          ...(channelTopic ? ['channelTopic'] : []),
        ];

        return {
          success: true,
          message: `Project "${updated.name}" updated.`,
          updatedFields,
        };
      },
    }),

    delete_project: tool({
      description:
        'Permanently delete a project: removes all DB records (project, documents, conversation history) and deletes the Discord channel. This is irreversible — always confirm with the user before calling.',
      parameters: z.object({
        channelId: z.string().describe('Discord channel ID of the project to delete'),
      }),
      execute: async ({ channelId }) => {
        await toolDeps.projectRegistry.delete(channelId);
        await toolDeps.conversationContext.deleteByChannel(channelId);
        await toolDeps.channelManagement.deleteChannel(channelId);
        return { success: true, message: 'Project deleted and channel removed.' };
      },
    }),
  };
}
