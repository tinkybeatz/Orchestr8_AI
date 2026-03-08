# Orchestr8_AI — Discord Multi-Project N8N Assistant

Orchestr8_AI is a Discord bot that lets a freelancer manage multiple n8n client projects from a single Discord server. Each Discord text channel maps to one client project connected to one specific n8n instance.

## How It Works

```
Discord Server
├── #orchestrator     ← Create new project channels, manage projects
├── #acme-corp        ← N8N expert agent → n8n.acme.cloud
├── #beta-startup     ← N8N expert agent → n8n.beta.io
└── #gamma-tech       ← N8N expert agent → n8n.gamma.com
```

- **`#orchestrator`** — Talk to the orchestrator agent to create new project channels, list all projects, or update project status. Provide the project name, n8n URL, API key, and purpose.
- **Project channels** — Each channel has a full n8n expert agent (all 7 skill sets) connected exclusively to that project's n8n instance. Conversation history persists across messages.

## Prerequisites

- Node.js ≥ 20
- Docker (for PostgreSQL, NATS, ClickHouse, OTEL)
- A Discord bot token with `Manage Channels`, `Send Messages`, `Read Message History` permissions and **Message Content Intent** enabled
- An AI provider API key (Anthropic, OpenAI, DeepSeek, or Groq)

## Setup

### 1. Discord bot (one-time)

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → New Application → "Orchestr8_AI"
2. **Bot** tab → Add Bot → enable **Message Content Intent** → copy the token
3. **OAuth2** → URL Generator → scopes: `bot` → permissions: `Manage Channels`, `Send Messages`, `Read Message History`
4. Open the generated URL to invite Orchestr8_AI to your server
5. Create a `#orchestrator` channel → right-click → **Copy Channel ID** → save as `ORCHESTRATOR_CHANNEL_ID`
6. Optional: Create a "N8N Projects" category → **Copy ID** → save as `PROJECTS_CATEGORY_ID`

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Discord
DISCORD_TOKEN=your_bot_token
GUILD_ID=your_server_id
ORCHESTRATOR_CHANNEL_ID=channel_id_of_orchestrator

# Optional: put project channels inside a category
PROJECTS_CATEGORY_ID=

# AI provider (anthropic | openai | deepseek | groq)
AI_PROVIDER=anthropic
AI_MODEL=claude-opus-4-6
AI_API_KEY=sk-ant-...
# AI_BASE_URL=   # optional, for custom endpoints

# Encryption key for n8n API keys at rest (32-byte hex)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=

# Infrastructure (defaults work with docker compose)
DATABASE_URL=postgresql://orchestr8ai:orchestr8ai_dev@localhost:5432/orchestr8ai_dev
NATS_URL=nats://localhost:4222
```

### 3. Start infrastructure

```bash
npm run infra:up    # starts PostgreSQL, NATS, ClickHouse, OTEL via docker compose
npm run db:migrate  # applies SQL migrations
```

### 4. Install and run

```bash
npm install
npm run dev
```

Or in production:

```bash
npm run build
node dist/main.js
```

## Usage

### Creating a project

In `#orchestrator`:

```
New project: Acme Corp, n8n at https://n8n.acme.cloud, API key: xxx, automates invoicing
```

Orchestr8_AI will confirm the details, create a `#acme-corp` channel, encrypt and store the credentials, then post a confirmation.

### Working with a project

In `#acme-corp`:

```
List my workflows
Show me the Invoice Generator workflow
Add an error handler to the main workflow
```

Orchestr8_AI connects to Acme's n8n instance and operates as a full n8n expert. The conversation history persists — it remembers context from earlier in the channel.

### Managing projects

In `#orchestrator`:

```
List all projects
Pause the beta-startup project
Archive gamma-tech
```

## Development

```bash
npm run typecheck   # TypeScript type check
npm run lint        # ESLint
npm run check       # All architecture checks (deps, cycles, file size, contracts)
npm run test        # Vitest
npm run ci          # Full pipeline
```

## Architecture

Hexagonal TypeScript architecture:

```
src/
├── application/     # Ports (interfaces) + agents + services
│   ├── ports/
│   │   ├── inbound/   # TextConversationPort
│   │   └── outbound/  # AiAgentPort, ProjectRegistryPort, ...
│   ├── agents/
│   │   ├── orchestrator/  # Project management agent + real tool calls
│   │   └── project/       # N8N expert agent + save_doc tool
│   └── services/
│       └── message-router.ts  # Routes Discord messages to agents
└── adapters/
    ├── inbound/discord/   # DiscordTextAdapter, DiscordChannelManager
    └── outbound/
        ├── ai/            # AiSdkAdapter, ModelFactory, N8nMcpClient
        └── state/         # PostgresProjectRegistry, PostgresConversationContext
```

Infrastructure: PostgreSQL 17 · NATS JetStream · ClickHouse · OpenTelemetry
