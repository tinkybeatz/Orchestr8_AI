import { generateText } from 'ai';
import type { LanguageModel, CoreMessage, Tool } from 'ai';
import { createN8nTools } from './n8n-mcp-client.js';
import type { AiAgentPort, AiRunOptions, AiRunResult } from '../../../application/ports/outbound/ai-agent.port.js';

/**
 * Built-in price table ($/MTok for input and output).
 * Used when no env-var override is provided.
 * Add entries here as new models become commonly used.
 */
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash':           { input: 0.10,  output: 0.40  },
  'gemini-2.5-flash':           { input: 0.30,  output: 2.50  },
  'gemini-1.5-flash':           { input: 0.075, output: 0.30  },
  'claude-haiku-4-5-20251001':  { input: 1.00,  output: 5.00  },
  'claude-sonnet-4-5-20251001': { input: 3.00,  output: 15.00 },
  'gpt-4o-mini':                { input: 0.60,  output: 2.40  },
  'gpt-4o':                     { input: 5.00,  output: 20.00 },
  'llama-3.3-70b-versatile':    { input: 0.59,  output: 0.79  },
  'llama-3.1-8b-instant':       { input: 0.05,  output: 0.08  },
  'deepseek-chat':              { input: 0.28,  output: 0.42  },
};

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
  constructor(
    private readonly model: LanguageModel,
    /** Optional price override ($/MTok). Takes precedence over the built-in table. */
    private readonly priceOverride?: { input: number; output: number },
  ) {}

  async run(options: AiRunOptions): Promise<AiRunResult> {
    const { system, messages, tools, n8nConfig, maxSteps = 20 } = options;

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
      // Strip empty-content messages — Gemini rejects any message where content
      // is an empty string ("must include at least one parts field").
      const safeMessages = (messages as CoreMessage[]).filter(
        (m) => typeof m.content !== 'string' || m.content.trim() !== '',
      );

      const result = await generateText({
        model: this.model,
        messages: [systemMessage, ...safeMessages],
        tools: Object.keys(allTools).length > 0 ? allTools : undefined,
        maxSteps,
      });

      // Guard against NaN — multi-step tool use can produce NaN when some steps
      // return no usage data and the SDK accumulates them.
      const safeInt = (n: unknown): number => (Number.isFinite(n) ? (n as number) : 0);
      const promptTokens = safeInt(result.usage?.promptTokens);
      const completionTokens = safeInt(result.usage?.completionTokens);
      const price = this.priceOverride ?? MODEL_PRICES[this.model.modelId];
      const costUsd = price
        ? (promptTokens * price.input + completionTokens * price.output) / 1_000_000
        : null;

      return {
        text: result.text,
        usage: { inputTokens: promptTokens, outputTokens: completionTokens, costUsd },
      };
    } finally {
      if (closeMcp) await closeMcp();
    }
  }
}
