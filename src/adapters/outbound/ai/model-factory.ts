import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { EnvConfig } from '../../../infrastructure/config/env-config.js';

export function buildModel(config: EnvConfig): LanguageModel {
  switch (config.aiProvider) {
    case 'anthropic':
      return createAnthropic({ apiKey: config.aiApiKey })(config.aiModel);
    case 'openai':
      return createOpenAI({ apiKey: config.aiApiKey })(config.aiModel);
    case 'deepseek':
      return createOpenAI({
        apiKey: config.aiApiKey,
        baseURL: config.aiBaseUrl ?? 'https://api.deepseek.com/v1',
      })(config.aiModel);
    case 'groq':
      return createOpenAI({
        apiKey: config.aiApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      })(config.aiModel);
    default:
      throw new Error(`Unknown AI provider: ${String(config.aiProvider)}`);
  }
}
