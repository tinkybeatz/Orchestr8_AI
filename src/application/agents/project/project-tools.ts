import { tool } from 'ai';
import { z } from 'zod';
import type { ProjectDocumentsPort } from '../../ports/outbound/project-documents.port.js';

export function buildProjectTools(deps: {
  documents: ProjectDocumentsPort;
  projectId: string;
  userId: string;
}) {
  return {
    save_doc: tool({
      description: 'Save documentation about this project to persistent storage. Use for workflow overviews, runbooks, research notes, or any content that should persist across sessions.',
      parameters: z.object({
        type: z.string().describe('Document category: workflows, notes, architecture, runbook, research'),
        slug: z.string().describe('Unique name within the category, e.g. overview, telegram-handler'),
        content: z.string().describe('Markdown content to save'),
      }),
      execute: async ({ type, slug, content }) => {
        await deps.documents.upsert(deps.projectId, type, slug, content, deps.userId);
        return { saved: true, type, slug };
      },
    }),
  };
}
