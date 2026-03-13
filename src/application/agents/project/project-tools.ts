import { tool } from 'ai';
import { z } from 'zod';
import type { ProjectDocumentsPort } from '../../ports/outbound/project-documents.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';
import type { ProjectRecord } from '../../ports/outbound/project-registry.port.js';
import type { WorkflowRegistryPort } from '../../ports/outbound/workflow-registry.port.js';

export function buildProjectTools(deps: {
  documents: ProjectDocumentsPort;
  conversationContext: ConversationContextPort;
  workflows: WorkflowRegistryPort;
  project: ProjectRecord;
  userId: string;
}) {
  const { documents, conversationContext, workflows, project, userId } = deps;

  return {
    save_doc: tool({
      description:
        'Save documentation about this project to persistent storage. Use for workflow overviews, runbooks, research notes, or any content that should persist across sessions.',
      parameters: z.object({
        type: z.string().describe('Document category: workflows, notes, architecture, runbook, research'),
        slug: z.string().describe('Unique name within the category, e.g. overview, telegram-handler'),
        content: z.string().describe('Markdown content to save'),
      }),
      execute: async ({ type, slug, content }) => {
        await documents.upsert(project.id, type, slug, content, userId);
        return { saved: true, type, slug };
      },
    }),

    get_project_info: tool({
      description: 'Get metadata about this project: name, purpose, status, and n8n URL.',
      parameters: z.object({}),
      execute: async () => ({
        name: project.name,
        purpose: project.purpose ?? null,
        status: project.status,
        n8nUrl: project.n8nConfig.apiUrl,
        createdAt: project.createdAt.toISOString(),
      }),
    }),

    list_docs: tool({
      description:
        'List all documents saved for this project. Returns type, slug, and last updated timestamp.',
      parameters: z.object({}),
      execute: async () => {
        const docs = await documents.list(project.id);
        return docs.map((d) => ({
          type: d.docType,
          slug: d.slug,
          updatedAt: d.updatedAt.toISOString(),
        }));
      },
    }),

    get_doc: tool({
      description: 'Retrieve the full content of a specific saved document.',
      parameters: z.object({
        type: z.string().describe('Document category, e.g. workflows, notes'),
        slug: z.string().describe('Document slug, e.g. overview'),
      }),
      execute: async ({ type, slug }) => {
        const doc = await documents.get(project.id, type, slug);
        if (!doc) return { found: false, content: null };
        return {
          found: true,
          type: doc.docType,
          slug: doc.slug,
          content: doc.content,
          updatedAt: doc.updatedAt.toISOString(),
        };
      },
    }),

    delete_doc: tool({
      description:
        'Permanently delete a saved document. Always confirm with the user before calling.',
      parameters: z.object({
        type: z.string().describe('Document category'),
        slug: z.string().describe('Document slug to delete'),
      }),
      execute: async ({ type, slug }) => {
        await documents.delete(project.id, type, slug);
        return { deleted: true, type, slug };
      },
    }),

    clear_conversation_history: tool({
      description:
        'Wipe all conversation history for this project channel. Use when the user wants a clean slate. Always confirm with the user before calling.',
      parameters: z.object({}),
      execute: async () => {
        await conversationContext.deleteByChannel(project.channelId);
        return { cleared: true };
      },
    }),

    save_workflow: tool({
      description:
        'Save or update a workflow\'s raw JSON content from n8n into persistent storage. Call this after fetching a workflow via n8n MCP tools.',
      parameters: z.object({
        workflowId: z.string().describe('The n8n workflow ID'),
        name: z.string().describe('The workflow name'),
        content: z.record(z.unknown()).describe('The raw workflow JSON object from n8n'),
      }),
      execute: async ({ workflowId, name, content }) => {
        await workflows.upsert(project.id, workflowId, name, content);
        return { saved: true, workflowId, name };
      },
    }),

    document_workflow: tool({
      description:
        'Save or update the structured documentation for a workflow. Call after save_workflow with a fully populated documentation object.',
      parameters: z.object({
        workflowId: z.string().describe('The n8n workflow ID'),
        documentation: z.object({
          overview: z.string().describe('2-4 sentences: what this workflow does end-to-end'),
          trigger: z.string().describe('How/when the workflow starts (webhook URL, cron, manual)'),
          dataFlow: z.string().describe('Narrative of how data moves through the workflow'),
          nodes: z.array(z.object({
            name: z.string(),
            type: z.string(),
            role: z.string().describe('What this node does in THIS workflow, not generic'),
            configSummary: z.string().optional(),
          })).describe('Every node in execution order'),
          errorHandling: z.string().describe('Error handling strategy, or "none" if absent'),
          externalDeps: z.array(z.string()).describe('External services, APIs, credential names'),
          notes: z.string().optional().describe('Edge cases, known issues, or other context'),
        }),
      }),
      execute: async ({ workflowId, documentation }) => {
        await workflows.setDocumentation(project.id, workflowId, documentation);
        return { documented: true, workflowId };
      },
    }),

    list_workflows: tool({
      description: 'List all workflows saved for this project.',
      parameters: z.object({}),
      execute: async () => {
        const list = await workflows.list(project.id);
        return list.map((w) => ({
          workflowId: w.workflowId,
          name: w.name,
          hasDocumentation: w.documentation !== null,
          syncedAt: w.syncedAt.toISOString(),
        }));
      },
    }),

    get_workflow: tool({
      description: 'Retrieve a saved workflow\'s full JSON content and documentation.',
      parameters: z.object({
        workflowId: z.string().describe('The n8n workflow ID'),
      }),
      execute: async ({ workflowId }) => {
        const wf = await workflows.get(project.id, workflowId);
        if (!wf) return { found: false };
        return {
          found: true,
          workflowId: wf.workflowId,
          name: wf.name,
          content: wf.content,
          documentation: wf.documentation,
          syncedAt: wf.syncedAt.toISOString(),
        };
      },
    }),

    delete_workflow: tool({
      description:
        'Permanently delete a saved workflow record. Always confirm with the user before calling.',
      parameters: z.object({
        workflowId: z.string().describe('The n8n workflow ID to delete'),
      }),
      execute: async ({ workflowId }) => {
        await workflows.delete(project.id, workflowId);
        return { deleted: true, workflowId };
      },
    }),
  };
}
