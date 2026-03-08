import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { createXai } from '@ai-sdk/xai';
import { createCohere } from '@ai-sdk/cohere';
import type { LanguageModel } from 'ai';
import type { EnvConfig } from '../../../infrastructure/config/env-config.js';

export function buildModel(config: EnvConfig): LanguageModel {
  const { aiApiKey: apiKey, aiModel: model, aiBaseUrl: baseURL } = config;

  switch (config.aiProvider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(model);
    case 'openai':
      return createOpenAI({ apiKey })(model);
    case 'openai-compatible':
      if (!baseURL) throw new Error('AI_BASE_URL is required for openai-compatible provider');
      return createOpenAI({ apiKey, baseURL })(model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(model);
    case 'mistral':
      return createMistral({ apiKey })(model);
    case 'groq':
      return createGroq({ apiKey })(model);
    case 'xai':
      return createXai({ apiKey })(model);
    case 'cohere':
      return createCohere({ apiKey })(model);
    case 'deepseek':
      return createOpenAI({ apiKey, baseURL: baseURL ?? 'https://api.deepseek.com/v1' })(model);
    default:
      throw new Error(`Unknown AI provider: ${String(config.aiProvider)}`);
  }
}
