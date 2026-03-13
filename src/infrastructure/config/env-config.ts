export type AiProvider =
  | 'anthropic'
  | 'openai'
  | 'openai-compatible'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'xai'
  | 'cohere'
  | 'deepseek';

export interface EnvConfig {
  databaseUrl: string;
  natsUrl: string;
  discordToken: string;
  guildId: string;
  orchestratorChannelId: string;
  projectsCategoryId: string | undefined;
  encryptionKey: string;
  aiProvider: AiProvider;
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string | undefined;
  /** Override input token price in $/MTok (env: AI_INPUT_PRICE_PER_MTOK). */
  aiInputPricePerMTok: number | undefined;
  /** Override output token price in $/MTok (env: AI_OUTPUT_PRICE_PER_MTOK). */
  aiOutputPricePerMTok: number | undefined;
  /** Dashboard basic-auth username (env: DASHBOARD_USER). Omit to disable. */
  dashboardUser: string | undefined;
  /** Dashboard basic-auth password (env: DASHBOARD_PASSWORD). Omit to disable. */
  dashboardPassword: string | undefined;
  /** HTTP port for the dashboard (env: DASHBOARD_PORT, default: 3000). */
  dashboardPort: number;
}

const VALID_PROVIDERS: AiProvider[] = [
  'anthropic',
  'openai',
  'openai-compatible',
  'google',
  'mistral',
  'groq',
  'xai',
  'cohere',
  'deepseek',
];

export function loadEnvConfig(): EnvConfig {
  const required = [
    'DATABASE_URL',
    'NATS_URL',
    'DISCORD_TOKEN',
    'GUILD_ID',
    'ORCHESTRATOR_CHANNEL_ID',
    'ENCRYPTION_KEY',
    'AI_PROVIDER',
    'AI_MODEL',
    'AI_API_KEY',
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      console.error(`[Orchestr8_AI] Missing required env var: ${key}`);
      process.exit(1);
    }
  }

  const provider = process.env['AI_PROVIDER']!;
  if (!VALID_PROVIDERS.includes(provider as AiProvider)) {
    console.error(
      `[Orchestr8_AI] Invalid AI_PROVIDER: ${provider}. Must be one of: ${VALID_PROVIDERS.join(', ')}`
    );
    process.exit(1);
  }

  const parseOptionalFloat = (key: string): number | undefined => {
    const val = process.env[key];
    if (!val) return undefined;
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  };

  return {
    databaseUrl: process.env['DATABASE_URL']!,
    natsUrl: process.env['NATS_URL']!,
    discordToken: process.env['DISCORD_TOKEN']!,
    guildId: process.env['GUILD_ID']!,
    orchestratorChannelId: process.env['ORCHESTRATOR_CHANNEL_ID']!,
    projectsCategoryId: process.env['PROJECTS_CATEGORY_ID'],
    encryptionKey: process.env['ENCRYPTION_KEY']!,
    aiProvider: provider as AiProvider,
    aiModel: process.env['AI_MODEL']!,
    aiApiKey: process.env['AI_API_KEY']!,
    aiBaseUrl: process.env['AI_BASE_URL'],
    aiInputPricePerMTok: parseOptionalFloat('AI_INPUT_PRICE_PER_MTOK'),
    aiOutputPricePerMTok: parseOptionalFloat('AI_OUTPUT_PRICE_PER_MTOK'),
    dashboardUser: process.env['DASHBOARD_USER'],
    dashboardPassword: process.env['DASHBOARD_PASSWORD'],
    dashboardPort: parseInt(process.env['DASHBOARD_PORT'] ?? '3000', 10),
  };
}
