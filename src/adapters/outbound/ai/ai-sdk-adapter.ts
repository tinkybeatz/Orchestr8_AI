import { generateText } from 'ai';
import type { LanguageModel, CoreMessage, Tool } from 'ai';
import { createN8nTools } from './n8n-mcp-client.js';
import type { AiAgentPort, AiRunOptions } from '../../../application/ports/outbound/ai-agent.port.js';

/**
 * Recursively patches bare object-type properties in a JSON schema by adding
 * `additionalProperties: true`. Without this, the @ai-sdk/google provider strips
 * bare objects (objects without a `properties` sub-field), which causes Gemini to
 * reject requests with "required property is not defined" errors.
 *
 * Safe for all other providers — `additionalProperties: true` is the default
 * semantics for an unspecified object anyway.
 */
function patchBareObjects(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema;

  const s = schema as Record<string, unknown>;
  const result: Record<string, unknown> = { ...s };

  // Patch: bare object with no properties → add additionalProperties: true
  if (
    result['type'] === 'object' &&
    result['additionalProperties'] === undefined &&
    (!result['properties'] ||
      Object.keys(result['properties'] as object).length === 0)
  ) {
    result['additionalProperties'] = true;
  }

  if (result['properties'] && typeof result['properties'] === 'object') {
    const props = result['properties'] as Record<string, unknown>;
    result['properties'] = Object.fromEntries(
      Object.entries(props).map(([k, v]) => [k, patchBareObjects(v)]),
    );
  }

  if (result['items']) {
    result['items'] = Array.isArray(result['items'])
      ? (result['items'] as unknown[]).map(patchBareObjects)
      : patchBareObjects(result['items']);
  }

  return result;
}

/** Apply patchBareObjects to all tools' JSON schemas. */
function sanitizeTools(tools: Record<string, Tool>): Record<string, Tool> {
  const out: Record<string, Tool> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const t = tool as unknown as Record<string, unknown>;
    const params = t['parameters'] as Record<string, unknown> | undefined;
    // MCP tools expose { jsonSchema, validate } (no _type), Zod tools have _type:'zod'.
    // Patch any tool that has a jsonSchema field.
    if (params && typeof params['jsonSchema'] === 'object' && params['jsonSchema'] !== null) {
      out[name] = {
        ...tool,
        parameters: {
          ...params,
          jsonSchema: patchBareObjects(params['jsonSchema']),
        },
      } as unknown as Tool;
    } else {
      out[name] = tool;
    }
  }
  return out;
}

export class AiSdkAdapter implements AiAgentPort {
  constructor(private readonly model: LanguageModel) {}

  async run(options: AiRunOptions): Promise<string> {
    const { system, messages, tools, n8nConfig, maxSteps = 5 } = options;

    let n8nTools: Record<string, Tool> = {};
    let closeMcp: (() => Promise<void>) | undefined;

    if (n8nConfig) {
      const result = await createN8nTools(n8nConfig);
      n8nTools = result.tools;
      closeMcp = result.close;
    }

    try {
      const combined = { ...(tools as Record<string, Tool>), ...n8nTools };
      const allTools = sanitizeTools(combined);
      // Pass system as the first message with Anthropic cache_control so the
      // large system prompt (27k+ tokens) is cached after the first step.
      // Other providers silently ignore the anthropic-namespaced metadata.
      const systemMessage: CoreMessage = {
        role: 'system',
        content: system,
        experimental_providerMetadata: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
      };
      const result = await generateText({
        model: this.model,
        messages: [systemMessage, ...(messages as CoreMessage[])],
        tools: Object.keys(allTools).length > 0 ? allTools : undefined,
        maxSteps,
      });
      return result.text;
    } finally {
      if (closeMcp) await closeMcp();
    }
  }
}
