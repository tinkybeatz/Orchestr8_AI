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

---

## Step 1 — Discord bot (do this first, either way)

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** → name it "Orchestr8_AI"
2. **Bot** tab → **Add Bot** → enable **Message Content Intent** → copy the token
3. **OAuth2** → URL Generator → scopes: `bot` → permissions: `Manage Channels`, `Send Messages`, `Read Message History`
4. Open the generated URL to invite the bot to your server
5. In your Discord server, create a `#orchestrator` channel → right-click it → **Copy Channel ID** → save it
6. Optional: create a "N8N Projects" category → **Copy ID** → save it

You now have: `DISCORD_TOKEN`, `GUILD_ID`, `ORCHESTRATOR_CHANNEL_ID`, and optionally `PROJECTS_CATEGORY_ID`.

---

## Setup A — Local

**Prerequisites:** Node.js ≥ 20, Docker

### 1. Clone and install

```bash
git clone https://github.com/your-username/orchestr8ai.git
cd orchestr8ai
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DISCORD_TOKEN=your_bot_token
GUILD_ID=your_server_id
ORCHESTRATOR_CHANNEL_ID=your_orchestrator_channel_id
PROJECTS_CATEGORY_ID=          # optional

AI_PROVIDER=anthropic           # see "Supported AI Providers" below
AI_MODEL=claude-opus-4-6
AI_API_KEY=your_api_key
# AI_BASE_URL=                  # required only for openai-compatible

# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_32_byte_hex_key

# These defaults match docker-compose.yml — no changes needed
DATABASE_URL=postgresql://orchestr8ai:orchestr8ai_dev@localhost:5432/orchestr8ai_dev
NATS_URL=nats://localhost:4222
```

### 3. Start infrastructure and run

```bash
npm run infra:up    # starts PostgreSQL, NATS, ClickHouse, OTEL via Docker Compose
npm run db:migrate  # applies SQL migrations
npm run dev         # starts the bot
```

---

## Setup B — VPS (Docker Compose)

**Prerequisites:** A VPS with [Docker](https://docs.docker.com/engine/install/) installed.

### 1. Clone and configure

```bash
git clone https://github.com/your-username/orchestr8ai.git
cd orchestr8ai
cp .env.prod.example .env
```

Edit `.env` — fill in these values:

| Variable | How to get it |
|---|---|
| `DISCORD_TOKEN` | Discord Developer Portal → your bot → Bot tab |
| `GUILD_ID` | Discord → right-click your server → Copy Server ID |
| `ORCHESTRATOR_CHANNEL_ID` | Right-click `#orchestrator` → Copy Channel ID |
| `ENCRYPTION_KEY` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AI_PROVIDER` | See "Supported AI Providers" below |
| `AI_MODEL` | Model name for your chosen provider |
| `AI_API_KEY` | API key for your chosen provider |
| `POSTGRES_PASSWORD` | Choose any strong password — used for the bundled database |

### 2. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

PostgreSQL, NATS, and the bot all start together. Migrations run automatically on startup.

### 3. Verify

```bash
docker compose -f docker-compose.prod.yml logs -f orchestr8ai
# Should show: [Orchestr8_AI] Orchestr8_AI N8N Assistant ready.
```

> **Prefer a UI?** [Coolify](https://coolify.io) is also supported — deploy from GitHub and use managed PostgreSQL + NATS services instead of the bundled ones.

---

## Supported AI Providers

Set `AI_PROVIDER` to one of the following values:

| `AI_PROVIDER` | Provider | Example models | API key |
|---|---|---|---|
| `anthropic` | Anthropic | `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5` | [console.anthropic.com](https://console.anthropic.com) |
| `openai` | OpenAI | `gpt-4o`, `gpt-4o-mini`, `o3`, `o4-mini` | [platform.openai.com](https://platform.openai.com) |
| `google` | Google Gemini | `gemini-2.0-flash`, `gemini-2.0-pro`, `gemini-1.5-pro` | [aistudio.google.com](https://aistudio.google.com) |
| `mistral` | Mistral AI | `mistral-large-latest`, `mistral-small-latest` | [console.mistral.ai](https://console.mistral.ai) |
| `groq` | Groq | `llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b` | [console.groq.com](https://console.groq.com) |
| `xai` | xAI (Grok) | `grok-2`, `grok-3` | [console.x.ai](https://console.x.ai) |
| `cohere` | Cohere | `command-r-plus`, `command-r` | [dashboard.cohere.com](https://dashboard.cohere.com) |
| `deepseek` | DeepSeek | `deepseek-chat`, `deepseek-reasoner` | [platform.deepseek.com](https://platform.deepseek.com) |
| `openai-compatible` | Any OpenAI-compatible API | depends on endpoint | — |

For `openai-compatible`, also set `AI_BASE_URL` to the endpoint (e.g. `http://localhost:11434/v1` for Ollama, `https://api.together.xyz/v1` for Together AI).

---

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

### Managing projects

In `#orchestrator`:

```
List all projects
Pause the beta-startup project
Archive gamma-tech
```

---

## Development

```bash
npm run typecheck   # TypeScript type check
npm run lint        # ESLint
npm run check       # Architecture checks (deps, cycles, file size, contracts)
npm run test        # Vitest
npm run ci          # Full pipeline
```

---

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
