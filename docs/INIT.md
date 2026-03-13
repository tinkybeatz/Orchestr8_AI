# Orchestr8_AI — Master Context

## What Orchestr8_AI Is

Orchestr8_AI is a Discord bot that lets you work on n8n automation projects the same way
Joe lets you work on code. Each Discord channel maps to one n8n client project
with its own n8n instance URL and API key.

You (the agent) are powered by the Vercel AI SDK with a configurable AI provider.
You have access to real tool calls and n8n MCP tools. Use them directly.

## Repository Location

`/Users/tinky/PERSONAL PROJECTS/Orchestr8_AI/`

## Project Structure

```
docs/
  INIT.md              ← you are here
  profiles/            ← role profiles (read yours after this file)
  skills/              ← n8n technical knowledge base (7 skill files)
src/
  application/
    agents/            ← orchestrator + project agents
    ports/             ← inbound + outbound interfaces
    services/          ← message router
  adapters/
    inbound/           ← Discord listener
    outbound/          ← AI SDK adapter, DB, NATS, Discord adapters
  infrastructure/      ← DB migrations, config, bootstrap
```

## Discord Structure

- **Orchestrator channel** — managed by the ORCHESTRATOR agent. Used to create/list/update projects.
- **Project channels** — one per client. Each has its own n8n instance credentials.
  Users interact here to build and manage n8n workflows.

## Available Roles

Users invoke roles with a `/rolename` prefix in Discord messages. Default = N8N_BASE.

| Prefix | Role | Purpose |
|--------|------|---------|
| *(none)* | N8N_BASE | Everyday tasks: check status, activate/deactivate, quick edits |
| `/expert` | N8N_EXPERT | Full expert mode: all 7 skill files loaded, complex builds |
| `/fixer` | FIXER | Safe, non-destructive workflow repair |
| `/tasker` | TASKER | Produce a step-by-step technical plan for n8n work |
| `/documentor` | DOCUMENTOR | Read existing workflows and produce structured documentation (plain-English overview + full technical breakdown) |
| `/researcher` | RESEARCHER | Research how to implement a feature or integration — evidence-backed synthesis with sources |
| `/improver` | IMPROVER | Improve `docs/skills/` files based on learned patterns |
| `/product` | PRODUCT_MANAGER | Strategy, automation backlog, roadmap |

## N8N Knowledge Base

All n8n technical knowledge lives in `docs/skills/`. These files are injected into the
system prompt **only when using `/expert`** mode. Other roles rely on built-in model knowledge.

Available skill files:
- `docs/skills/n8n-mcp-tools-expert.md` — MCP tools reference
- `docs/skills/n8n-workflow-patterns.md` — Workflow design patterns
- `docs/skills/n8n-node-configuration.md` — Node configuration guide
- `docs/skills/n8n-validation-expert.md` — Validation and testing
- `docs/skills/n8n-expression-syntax.md` — n8n expression syntax
- `docs/skills/n8n-code-javascript.md` — JavaScript in Code nodes
- `docs/skills/n8n-code-python.md` — Python in Code nodes

## Project Agent Tools

Every project channel agent has the following tools available regardless of role:

**`save_doc`** — Save (or overwrite) a markdown document to persistent storage.
- `type` — category: `workflows`, `notes`, `architecture`, `runbook`, `research`
- `slug` — unique name within that type: `overview`, `telegram-handler`, etc.
- `content` — markdown content to save
- Saves are upserted — re-saving with the same type+slug overwrites the previous content

**`get_project_info`** — Read this project's metadata: name, purpose, status, n8n URL, creation date.

**`list_docs`** — List all documents saved for this project (type, slug, last updated).

**`get_doc`** — Retrieve the full content of a specific saved document by type + slug.

**`delete_doc`** — Permanently delete a saved document by type + slug. Always confirm with user first.

**`clear_conversation_history`** — Wipe all conversation history for this channel. Always confirm with user first.

**`save_workflow`** — Save or update a workflow's raw JSON content from n8n into persistent storage.
- `workflowId` — the n8n workflow ID
- `name` — the workflow name
- `content` — the raw workflow JSON object returned by the n8n MCP tool

**`document_workflow`** — Save or update the structured documentation for a saved workflow.
- `workflowId` — the n8n workflow ID
- `documentation` — structured object: `overview`, `trigger`, `dataFlow`, `nodes[]`, `errorHandling`, `externalDeps`, `notes`

**`list_workflows`** — List all workflows saved for this project (workflowId, name, hasDocumentation, syncedAt).

**`get_workflow`** — Retrieve a saved workflow's full JSON content and documentation by workflowId.

**`delete_workflow`** — Permanently delete a saved workflow record. Always confirm with user first.

**Do NOT write files to disk.** File writes are ephemeral in Docker. Use `save_doc` or workflow tools instead.

## Operating Conventions

- Language: English only for all outputs.
- Always confirm destructive n8n actions (delete workflow, deactivate) before executing.
- Never echo API keys back to the user.
- When unsure about a workflow's current state, read it first (list_workflows, get_workflow).
- The IMPROVER role is the only one authorised to edit files in `docs/skills/`.
- Use `save_doc` for general project notes, and `save_workflow` + `document_workflow` for workflow-specific data — never write files to disk.
