import dotenv from 'dotenv';
import { loadEnvConfig } from './infrastructure/config/env-config.js';
import { createPool } from './infrastructure/db/pool.js';
import { migrate } from './infrastructure/db/migrator.js';
import { PostgresStateStore } from './adapters/outbound/state/postgres-state-store.js';
import { PostgresProjectRegistry } from './adapters/outbound/state/postgres-project-registry.js';
import { PostgresConversationContext } from './adapters/outbound/state/postgres-conversation-context.js';
import { PostgresProjectDocuments } from './adapters/outbound/state/postgres-project-documents.js';
import { JetStreamEventBus } from './adapters/outbound/eventbus/jetstream-event-bus.js';
import { ConsoleTelemetryAdapter } from './adapters/outbound/telemetry/console-telemetry-adapter.js';
import { buildModel } from './adapters/outbound/ai/model-factory.js';
import { AiSdkAdapter } from './adapters/outbound/ai/ai-sdk-adapter.js';
import { DOCS_DIR } from './adapters/outbound/claude/docs-path.js';
import { DiscordTextAdapter } from './adapters/inbound/discord/discord-text-adapter.js';
import { DiscordChannelManager } from './adapters/inbound/discord/discord-channel-manager.js';
import { MessageRouter } from './application/services/message-router.js';
import { composeDependencies } from './composition-root.js';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve .env relative to this file; override=true ensures file values take precedence over shell vars.
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), override: true });

const config = loadEnvConfig();

console.info('[Orchestr8_AI] Starting N8N Assistant...');

// Infrastructure
const pool = createPool(config.databaseUrl);
const migrationsDir = resolvePath(import.meta.dirname, 'infrastructure', 'db', 'migrations');
await migrate(pool, migrationsDir);

// Core adapters
const stateStore = new PostgresStateStore(pool);
const projectRegistry = new PostgresProjectRegistry(pool, config.encryptionKey);
const conversationContext = new PostgresConversationContext(pool);
const projectDocuments = new PostgresProjectDocuments(pool);
const eventBus = new JetStreamEventBus(config.natsUrl);
await eventBus.connect();
const telemetry = new ConsoleTelemetryAdapter();
const model = buildModel(config);
const aiAgent = new AiSdkAdapter(model);

// Discord
const discordAdapter = new DiscordTextAdapter(config.discordToken);
await discordAdapter.connect();
const channelManager = new DiscordChannelManager(discordAdapter.getClient());

// Compose
composeDependencies({ stateStore, eventBus, telemetry, config, pool });

// Message router
const router = new MessageRouter({
  orchestratorChannelId: config.orchestratorChannelId,
  guildId: config.guildId,
  docsDir: DOCS_DIR,
  projectRegistry,
  projectDocuments,
  conversationContext,
  aiAgent,
  orchestratorToolDeps: {
    channelManagement: channelManager,
    projectRegistry,
    eventBus,
    projectsCategoryId: config.projectsCategoryId,
  },
  conversation: discordAdapter,
  telemetry,
});

discordAdapter.onMessage((message) => router.handle(message));

telemetry.log('info', 'Orchestr8_AI N8N Assistant ready.', {
  provider: config.aiProvider,
  model: config.aiModel,
  database: 'connected',
  nats: 'connected',
  discord: 'connected',
  orchestratorChannel: config.orchestratorChannelId,
});

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  console.info('[Orchestr8_AI] Shutting down...');
  await discordAdapter.destroy();
  await eventBus.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
