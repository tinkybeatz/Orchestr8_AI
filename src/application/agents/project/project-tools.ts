import { tool } from 'ai';
import { z } from 'zod';
import type { ProjectDocumentsPort } from '../../ports/outbound/project-documents.port.js';
import type { ConversationContextPort } from '../../ports/outbound/conversation-context.port.js';
import type { ProjectRecord } from '../../ports/outbound/project-registry.port.js';

export function buildProjectTools(deps: {
  documents: ProjectDocumentsPort;
  conversationContext: ConversationContextPort;
  project: ProjectRecord;
  userId: string;
}) {
  const { documents, conversationContext, project, userId } = deps;

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
  };
}
