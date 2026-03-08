import type { ChannelManagementPort } from '../../ports/outbound/channel-management.port.js';
import type { ProjectRegistryPort } from '../../ports/outbound/project-registry.port.js';
import type { EventBusPort } from '../../ports/outbound/event-bus.port.js';

export interface OrchestratorToolDeps {
  channelManagement: ChannelManagementPort;
  projectRegistry: ProjectRegistryPort;
  eventBus: EventBusPort;
  projectsCategoryId?: string;
}

export interface CreateProjectParams {
  guild_id: string;
  project_name: string;
  channel_name: string;
  n8n_url: string;
  n8n_api_key: string;
  purpose?: string;
  user_id: string;
}

export interface ListProjectsParams {
  guild_id: string;
}

export interface UpdateProjectStatusParams {
  channel_id: string;
  status: 'active' | 'paused' | 'archived';
}

export async function createProject(
  deps: OrchestratorToolDeps,
  params: CreateProjectParams,
): Promise<string> {
  const { channelId } = await deps.channelManagement.createTextChannel(
    params.guild_id,
    params.channel_name,
    deps.projectsCategoryId,
    `n8n workspace for ${params.project_name}`,
  );

  const project = await deps.projectRegistry.create({
    channelId,
    guildId: params.guild_id,
    name: params.project_name,
    purpose: params.purpose,
    n8nConfig: { apiUrl: params.n8n_url, apiKey: params.n8n_api_key },
    createdBy: params.user_id,
  });

  const encoder = new TextEncoder();
  await deps.eventBus.publish({
    subject: 'orchestr8ai.discord.project.created',
    data: encoder.encode(
      JSON.stringify({
        channelId,
        projectName: params.project_name,
        guildId: params.guild_id,
        projectId: project.id,
      }),
    ),
    msgId: project.id,
  });

  return JSON.stringify({
    success: true,
    channelId,
    channelName: params.channel_name,
    projectId: project.id,
    message: `Project "${params.project_name}" created. Channel ID: ${channelId}`,
  });
}

export async function listProjects(
  deps: OrchestratorToolDeps,
  params: ListProjectsParams,
): Promise<string> {
  const projects = await deps.projectRegistry.listAll(params.guild_id);
  return JSON.stringify(
    projects.map((p) => ({
      name: p.name,
      channelId: p.channelId,
      n8nUrl: p.n8nConfig.apiUrl,
      purpose: p.purpose,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
  );
}

export async function updateProjectStatus(
  deps: OrchestratorToolDeps,
  params: UpdateProjectStatusParams,
): Promise<string> {
  await deps.projectRegistry.updateStatus(params.channel_id, params.status);
  return JSON.stringify({
    success: true,
    message: `Project status updated to ${params.status}`,
  });
}
