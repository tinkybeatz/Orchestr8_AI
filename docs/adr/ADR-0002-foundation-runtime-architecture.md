# ADR-0002: Foundation Runtime Architecture

**Status:** Accepted
**Date:** 2026-03-06

## Context

Orchestr8_AI orchestrates multiple n8n client instances from Discord. The architecture must support multiple concurrent projects, per-project AI agents, and persistent conversation state.

## Decision

Hexagonal architecture (ports + adapters) with the following runtime components:

- **Inbound**: `DiscordTextAdapter` — single Discord connection, routes messages by channel ID
- **Application**: `MessageRouter` → `OrchestratorAgent` or `ProjectAgent` based on channel
- **Agentic loop**: `AiSdkAdapter` — Vercel AI SDK with real tool calls and n8n MCP via stdio transport
- **Outbound**: PostgreSQL (state), NATS JetStream (events), per-project n8n-mcp subprocesses

## Rationale

- Hexagonal architecture enforces clean dependency direction: domain ← application ← adapters
- Vercel AI SDK provides a provider-agnostic agentic loop with native tool-call support
- n8n MCP spawned per-request via stdio transport; no persistent pool required
- PostgreSQL conversation context gives persistent memory across Discord sessions

## Consequences

- Application layer must never import from adapter layer (enforced by `check:deps`)
- New agent types can be added by implementing `AiAgentPort` and wiring into `MessageRouter`
- AI provider is configurable via `AI_PROVIDER` env var (anthropic, openai, deepseek, groq)
