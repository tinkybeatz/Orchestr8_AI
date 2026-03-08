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

AI_PROVIDER=anthropic           # anthropic | openai | deepseek | groq
AI_MODEL=claude-opus-4-6
AI_API_KEY=sk-ant-...

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

## Setup B — VPS with Coolify

**Prerequisites:** A VPS with [Coolify](https://coolify.io) installed, this repo pushed to GitHub.

Coolify will build the Docker image from the included `Dockerfile` and manage the app container. PostgreSQL and NATS run as separate Coolify services.

### 1. Add a PostgreSQL service

In Coolify → **New Resource** → **Database** → **PostgreSQL 17**

- Set a strong password → **Deploy**
- Copy the internal connection string — you'll use it as `DATABASE_URL`

### 2. Add a NATS service

In Coolify → **New Resource** → **Docker Compose** → paste:

```yaml
services:
  nats:
    image: nats:2.10-alpine
    command: ["-js"]
    ports:
      - "4222:4222"
```

Deploy it. Your `NATS_URL` will be `nats://nats:4222` (internal) or `nats://your-vps-ip:4222` (external).

### 3. Deploy Orchestr8_AI

In Coolify → **New Resource** → **Application** → connect your GitHub repo.

- Build pack: **Dockerfile**
- Port: leave empty (no HTTP exposure needed)

Set all environment variables in Coolify's **Environment Variables** tab:

| Variable | Value |
|---|---|
| `DISCORD_TOKEN` | Your bot token |
| `GUILD_ID` | Your Discord server ID |
| `ORCHESTRATOR_CHANNEL_ID` | Your `#orchestrator` channel ID |
| `PROJECTS_CATEGORY_ID` | Optional category ID |
| `AI_PROVIDER` | `anthropic` (or `openai`, `deepseek`, `groq`) |
| `AI_MODEL` | e.g. `claude-opus-4-6` |
| `AI_API_KEY` | Your AI provider API key |
| `ENCRYPTION_KEY` | 32-byte hex key (generate locally first) |
| `DATABASE_URL` | Internal connection string from step 1 |
| `NATS_URL` | Internal NATS URL from step 2 |

### 4. Deploy

Click **Deploy**. Coolify builds the image, runs migrations automatically on startup, and starts the bot.

To redeploy after a code push: push to your main branch — Coolify redeploys automatically if you enable the webhook.

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
