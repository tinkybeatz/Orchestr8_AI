# Orchestr8_AI — Project Reference

## What it is

Orchestr8_AI is a Discord bot that lets you manage multiple n8n automation projects from Discord.
Each project gets its own Discord channel. Inside that channel, you talk to an AI agent — which
has live access to the project's n8n instance via MCP tools — to build, debug, document,
and improve workflows.

The core idea: one Discord channel = one n8n workspace. Orchestr8_AI routes every message to the
right agent, which already knows the project's context and has direct n8n API access.

---

## How it works — end to end

```
Discord message
    │
    ▼
DiscordTextAdapter          ← receives message, emits TextMessage event
    │
    ▼
MessageRouter               ← decides: orchestrator channel or project channel?
    │
    ├─ Orchestrator channel ──► OrchestratorAgent
    │                               reads INIT.md + ORCHESTRATOR.md (docs/)
    │                               real tool calls via AI SDK:
    │                               - list_projects  → Postgres query
    │                               - create_project → Discord channel + DB + NATS event
    │                               - update_project_status → DB update
    │
    └─ Project channel ───────► ProjectAgent
                                    reads INIT.md + role profile (docs/profiles/)
                                    AI SDK with n8n MCP tools (stdio transport)
                                    save_doc tool → saves documentation to DB
                                    reply sent back to Discord
```

### The two agents

**OrchestratorAgent** — lives in the designated orchestrator channel.
Manages the workspace: create projects, list them, pause/archive.
Does NOT have n8n MCP access. Uses real tool calls (list_projects, create_project,
update_project_status) wired to the application ports.

**ProjectAgent** — one per project channel, activated by channel ID lookup.
Full n8n MCP access via `experimental_createMCPClient` with a stdio transport
pointing to the project's n8n instance. Supports role switching via `/prefix` in
the message. Uses `save_doc` tool call for persistent documentation.

---

## Agent roles

Users prefix messages with `/rolename` to switch roles. Default is N8N_EXPERT.

| Prefix | Role | Purpose |
|---|---|---|
| *(none)* or `/expert` | N8N_EXPERT | Build, debug, optimise workflows using MCP tools |
| `/fixer` | FIXER | Safe, non-destructive repair mode |
| `/tasker` | TASKER | Produce a step-by-step plan without executing it |
| `/documentor` | DOCUMENTOR | Research-first, web sources, n8n-specific |
| `/improver` | IMPROVER | Improve `docs/skills/` files from patterns learned |
| `/product` | PRODUCT_MANAGER | Strategy, automation backlog, roadmap |

Each role is a markdown file in `docs/profiles/`. The system prompt is built at runtime
by reading INIT.md + the role file — knowledge lives in docs, not in TypeScript.

---

## Doc-driven architecture

Agents do NOT have hardcoded prompts in TypeScript. Instead, the system prompt is built
by reading INIT.md + the role's profile file at startup, using `readFileSync`.

This means you can change Orchestr8_AI's behaviour, add knowledge, or create new roles
by editing markdown files in `docs/`, with no code changes and no redeploy.

```
docs/
  INIT.md              ← master context: what Orchestr8_AI is, roles, save_doc tool
  profiles/
    ORCHESTRATOR.md    ← real tool protocol, workspace management rules
    N8N_EXPERT.md      ← reads all 7 skill files, uses MCP tools
    FIXER.md           ← safe repair mode rules
    TASKER.md          ← planning only, no execution
    DOCUMENTOR.md      ← n8n research, source priority, freshness scoring
    IMPROVER.md        ← edits docs/skills/ only, max 3 files, must confirm
    PRODUCT_MANAGER.md ← strategy, roadmap, not execution
  skills/
    n8n-mcp-tools-expert.md
    n8n-workflow-patterns.md
    n8n-node-configuration.md
    n8n-validation-expert.md
    n8n-expression-syntax.md
    n8n-code-javascript.md
    n8n-code-python.md
```

---

## Document persistence — `save_doc` tool

When the AI generates documentation (workflow overviews, runbooks, research notes),
it calls the `save_doc` tool directly:

```
save_doc({ type: "workflows", slug: "overview", content: "# Workflow Overview\n..." })
```

The tool saves to the `project_documents` table (upsert on `project_id + doc_type + slug`).
This replaces the old `<save_doc>` XML tag approach — no more XML parsing in MessageRouter.

---

## Architecture — hexagonal (ports and adapters)

```
src/
  application/
    agents/         ← OrchestratorAgent, ProjectAgent (pure logic)
    ports/
      inbound/      ← TextConversationPort (what drives the app)
      outbound/     ← AiAgentPort, ProjectRegistryPort, etc.
    services/       ← MessageRouter
  adapters/
    inbound/
      discord/      ← DiscordTextAdapter, DiscordChannelManager
    outbound/
      ai/           ← AiSdkAdapter, ModelFactory, N8nMcpClient
      state/        ← PostgresProjectRegistry, PostgresConversationContext,
                       PostgresProjectDocuments, PostgresStateStore
      eventbus/     ← JetStreamEventBus, stream configs, dead-letter handler
      telemetry/    ← ConsoleTelemetryAdapter
  infrastructure/
    config/         ← env-config (reads + validates all env vars)
    db/             ← pool, migrator, migrations/
  main.ts           ← wires everything together, starts the app
  composition-root.ts
```

The application layer imports only ports (interfaces), never adapters. Enforced by
`scripts/check-dependency-direction.ts` in CI.

---

## Database schema

PostgreSQL. Migrations run automatically at startup via `migrator.ts`.

### `projects`
One row per n8n project workspace.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `channel_id` | TEXT UNIQUE | Discord channel ID |
| `guild_id` | TEXT | Discord server ID |
| `name` | TEXT | Human-readable project name |
| `purpose` | TEXT | Optional description |
| `n8n_url` | TEXT | n8n API base URL |
| `n8n_key_enc` | TEXT | API key encrypted with AES-256-GCM |
| `status` | TEXT | `active` / `paused` / `archived` |
| `created_at` | TIMESTAMPTZ | |
| `created_by` | TEXT | Discord user ID |

n8n API keys are encrypted at rest using AES-256-GCM. The `ENCRYPTION_KEY` env var
(32-byte hex) is the master key. Never stored in plaintext.

### `project_documents`
AI-generated content saved via the `save_doc` tool.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `project_id` | UUID | FK → projects |
| `doc_type` | TEXT | e.g. `workflows`, `notes`, `runbook` |
| `slug` | TEXT | e.g. `overview`, `telegram-handler` |
| `content` | TEXT | Markdown content |
| `created_by` | TEXT | Discord user ID |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Updated on upsert |

Unique on `(project_id, doc_type, slug)` — re-saving overwrites.

### `conversation_context`
Per-channel message history (last N turns loaded on each agent call).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `channel_id` | TEXT | Discord channel ID |
| `role` | TEXT | `user` / `assistant` |
| `content` | TEXT | Message text |
| `created_at` | TIMESTAMPTZ | |

### Supporting tables
- `agent_runs` — run lifecycle tracking
- `run_checkpoints` — immutable step state per run
- `idempotency_keys` — deduplication for side-effecting ops (24h TTL)
- `outbox` — transactional outbox for event dispatch
- `schema_versions` — migration tracking

---

## n8n MCP integration

When `ProjectAgent` runs for a project channel, it creates an MCP client via
`experimental_createMCPClient` with a `Experimental_StdioMCPTransport` that spawns
`npx -y n8n-mcp` with the project's decrypted credentials:

```typescript
new Experimental_StdioMCPTransport('npx', ['-y', 'n8n-mcp'], {
  N8N_API_URL: n8nConfig.apiUrl,
  N8N_API_KEY: n8nConfig.apiKey,
})
```

The MCP client provides all n8n-mcp tools (list_workflows, get_workflow, create_workflow,
etc.) as native tool calls to the AI SDK. The client is closed after each agent run.

---

## NATS / event bus

NATS JetStream is used to publish domain events. Currently one event is published:

- `orchestr8ai.discord.project.created` — emitted after a project is created

Two streams are configured:
- `ORCHESTRATION` — subjects: `orchestr8ai.discord.>` — 7d retention
- `DEAD_LETTER` — subjects: `orchestr8ai.dlq.>` — 30d retention, for failed messages

Nothing currently subscribes to these events. NATS is wired up and ready for consumers.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✓ | Discord bot token |
| `GUILD_ID` | ✓ | Discord server (guild) ID |
| `ORCHESTRATOR_CHANNEL_ID` | ✓ | Channel ID where Orchestr8_AI manages projects |
| `PROJECTS_CATEGORY_ID` | | Optional Discord category for new project channels |
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NATS_URL` | ✓ | NATS server URL |
| `ENCRYPTION_KEY` | ✓ | 32-byte hex key for n8n API key encryption |
| `AI_PROVIDER` | ✓ | AI provider: `anthropic`, `openai`, `deepseek`, `groq` |
| `AI_MODEL` | ✓ | Model name (e.g. `claude-opus-4-6`, `gpt-4o`) |
| `AI_API_KEY` | ✓ | API key for the selected AI provider |
| `AI_BASE_URL` | | Optional custom endpoint URL |

---

## Deployment

### Local development
```bash
npm install
npm run dev       # runs migrations, starts app with tsx
```
Requires Docker. Uses `docker-compose.yml` (includes postgres, nats, clickhouse, otel).

### Production (Coolify / any Docker host)
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
Env vars injected by Coolify (or any Docker-compatible env injection).

Migrations run automatically at startup — no manual step needed.

### Build
```bash
npm run build    # tsc -p tsconfig.build.json → dist/
```

### CI
```bash
npm run ci       # typecheck + lint + check:deps + check:cycles + check:deep-imports
                 # + check:file-size (250 line limit per file) + check:contracts + tests
```

---

## Key design decisions

**Doc-driven agents** — behaviour is in markdown, not TypeScript. Change a profile, see
the change immediately without rebuilding or redeploying.

**Real tool calls** — OrchestratorAgent and ProjectAgent use native AI SDK tool calls,
not XML tag parsing. Cleaner, more reliable, provider-agnostic.

**Provider-agnostic AI** — `AI_PROVIDER` + `AI_MODEL` + `AI_API_KEY` support Anthropic,
OpenAI, DeepSeek, and Groq. Swap providers by changing env vars.

**`save_doc` tool for persistence** — AI calls the tool directly; no XML parsing needed.
Saves to PostgreSQL. No file-system dependency, works in Docker.

**n8n API key encryption** — AES-256-GCM at rest. The key never appears in logs or
network traffic once stored.

**250-line file size limit** — enforced by CI. Keeps files readable and focused.

**Hexagonal architecture** — application layer imports only ports. Adapters are swappable.
Enforced by `check-dependency-direction.ts` in CI.

---

## What does not exist yet (extension points)

- **REST API** — `project_documents` and `projects` tables are ready for a dashboard but
  no HTTP server exists yet.
- **NATS consumers** — streams are set up but nothing subscribes. A future listener could
  trigger automations when `orchestr8ai.discord.project.created` fires.
- **Tests** — CI passes with `--passWithNoTests`. The hexagonal architecture makes unit
  testing straightforward (inject mock ports).
- **Multi-guild** — the DB schema supports multiple guilds. The Discord adapter and config
  currently assume one guild.
- **Web dashboard** — read from `project_documents`, `projects`, `conversation_context`.
  All data is in Postgres.
