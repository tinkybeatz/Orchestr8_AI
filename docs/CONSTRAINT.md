# Orchestr8_AI — Global Constraints

## Runtime Constraint

The multi-agent system uses the **Vercel AI SDK** with a configurable AI provider.
Provider, model, and API key are set via env vars (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`).
Supported providers: Anthropic, OpenAI, DeepSeek, Groq.

## Architecture Constraint

Orchestr8_AI MUST follow the hexagonal architecture pattern:
- Domain layer: zero external dependencies
- Application layer: ports (interfaces) only, no implementations
- Adapters layer: implementations of ports
- Infrastructure layer: database pool, config, migrations

Dependency direction: adapters → application → domain (never reversed).

## n8n Constraint

- All n8n operations go through the MCP client spawned by `AiSdkAdapter`
- n8n API credentials MUST be stored encrypted (AES-256-GCM) in PostgreSQL
- Cross-project credential access is FORBIDDEN
- Every project agent MUST only use the n8n config for its own channel

## Discord Constraint

- Discord is the sole inbound interface for user interactions
- The orchestrator channel (`ORCHESTRATOR_CHANNEL_ID`) is the ONLY channel
  where project creation is permitted
- Project channels MUST be created programmatically by the bot; manual channel
  assignment to a project is not permitted
