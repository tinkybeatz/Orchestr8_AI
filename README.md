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

## Setup B — VPS Deployment

The project ships with a `docker-compose.prod.yml` that bundles the bot, PostgreSQL, and NATS into a single stack — no external services needed.

### Environment variables

Whether you deploy via a platform UI or manually, you'll need these values:

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Discord Developer Portal → your bot → Bot tab |
| `GUILD_ID` | ✅ | Right-click your Discord server → Copy Server ID |
| `ORCHESTRATOR_CHANNEL_ID` | ✅ | Right-click `#orchestrator` → Copy Channel ID |
| `ENCRYPTION_KEY` | ✅ | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AI_PROVIDER` | ✅ | See "Supported AI Providers" below |
| `AI_MODEL` | ✅ | Model name for your chosen provider |
| `AI_API_KEY` | ✅ | API key for your chosen provider |
| `POSTGRES_PASSWORD` | ✅ | Any strong password — secures the bundled database |
| `PROJECTS_CATEGORY_ID` | ➖ | Discord category ID for project channels |
| `AI_BASE_URL` | ➖ | Required only for `openai-compatible` provider |
| `AI_INPUT_PRICE_PER_MTOK` | ➖ | Input price in $/MTok — only if your model isn't in the built-in table |
| `AI_OUTPUT_PRICE_PER_MTOK` | ➖ | Output price in $/MTok — only if your model isn't in the built-in table |

---

### Option 1 — Platform deployment (recommended)

Any platform that supports deploying Docker Compose stacks from a Git repository works out of the box — **no local clone or SSH needed**.

1. Point your platform to this repository
2. Set the compose file to `docker-compose.prod.yml`
3. Add the environment variables from the table above
4. Deploy

The platform builds the image, starts all three services, and runs migrations automatically. Most platforms also support auto-redeploy on every git push.

---

### Option 2 — Manual VPS (SSH)

For a plain VPS without a management UI:

```bash
git clone https://github.com/your-username/orchestr8ai.git
cd orchestr8ai
cp .env.prod.example .env   # then fill in the values from the table above
docker compose -f docker-compose.prod.yml up -d
```

Verify it's running:

```bash
docker compose -f docker-compose.prod.yml logs -f orchestr8ai
# Should show: [Orchestr8_AI] Orchestr8_AI N8N Assistant ready.
```

---

## Database Dashboard

Orchestr8_AI ships with [Adminer](https://www.adminer.org/) — a lightweight web UI for
inspecting the PostgreSQL database. It is included in both the local dev and production Docker stacks.

### Local access

After `npm run infra:up`, open: **http://localhost:8080**

Login form:

| Field | Value |
|---|---|
| System | PostgreSQL |
| Server | `postgres` |
| Username | `orchestr8ai` |
| Password | `orchestr8ai_dev` |
| Database | `orchestr8ai_dev` |

### Production access

In `docker-compose.prod.yml` the Adminer port is bound to `127.0.0.1` — it is **not publicly
reachable** by default. Choose one of the following access methods:

---

**Option A — SSH tunnel** *(most secure, no extra config)*

Open a tunnel from your local machine to the server:

```bash
ssh -L 8080:localhost:8080 user@yourserver
```

Keep that terminal open, then open **http://localhost:8080** in your browser. The tunnel is only active while the SSH session runs. To run it in the background instead:

```bash
ssh -fNL 8080:localhost:8080 user@yourserver
```

Login form:

| Field | Value |
|---|---|
| System | PostgreSQL |
| Server | `postgres` |
| Username | `orchestr8ai` |
| Password | your `POSTGRES_PASSWORD` value |
| Database | `orchestr8ai_prod` |

---

**Option B — Public URL via reverse proxy** *(platform or nginx/Caddy)*

This gives Adminer a permanent HTTPS URL. Always protect it with a password before exposing it publicly.

**Coolify:**
1. Open your Coolify project → locate the `adminer` service
2. Go to **Domains** → add a domain (e.g. `db.yourdomain.com`) — SSL is provisioned automatically
3. Go to **Security** → enable **Basic Auth** → set a username and password
4. Click **Save** then **Redeploy**
5. Open `https://db.yourdomain.com` — enter the Basic Auth credentials, then log in with the form above

**Nginx (manual):**
```nginx
server {
    listen 443 ssl;
    server_name db.yourdomain.com;
    # ... your SSL config ...

    auth_basic "Adminer";
    auth_basic_user_file /etc/nginx/.htpasswd;  # htpasswd -c /etc/nginx/.htpasswd youruser

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

**Caddy:**
```
db.yourdomain.com {
    basicauth {
        youruser <bcrypt-hash>   # caddy hash-password --plaintext yourpassword
    }
    reverse_proxy 127.0.0.1:8080
}
```

---

**Option C — Firewall-restricted port** *(office/LAN only)*

Edit `docker-compose.prod.yml` and change the Adminer port binding:

```yaml
# From (localhost only):
- "127.0.0.1:${ADMINER_PORT:-8080}:8080"

# To (specific trusted IP only):
- "YOUR_OFFICE_IP:8080:8080"
```

Then open port 8080 in your server's firewall for that IP only.

---

### Tables visible after login

| Table | Content |
|---|---|
| `projects` | All projects — name, purpose, status, n8n URL, channel IDs |
| `workflows` | Saved workflow JSON + structured documentation, linked to projects |
| `project_documents` | Saved docs — type, slug, content, timestamps |
| `conversation_context` | Per-channel conversation history |
| `agent_runs` | Agent run states |
| `run_checkpoints` | Checkpoint states per run |
| `outbox` | Pending/dispatched NATS events |
| `schema_versions` | Applied DB migrations |

> `n8n_key_enc` in `projects` stores the AES-256-GCM encrypted API key — the plaintext key is never visible.

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
