# Backlog: Phase 1 — Foundation

## Status: COMPLETE

All Phase 1 items have been implemented and `npm run ci` passes.

---

## Completed

| ID | Item | Notes |
|----|------|-------|
| B1-001 | Project scaffold (Orchestr8_AI/) | Adapted from Joe |
| B1-002 | PostgreSQL migrations (001, 002, 003) | Operational state + projects + context |
| B1-003 | NATS JetStream event bus | Copied from Joe |
| B1-004 | `ProjectRegistryPort` + `PostgresProjectRegistry` | AES-256-GCM encryption |
| B1-005 | `ConversationContextPort` + `PostgresConversationContext` | Rolling 40-msg window |
| B1-006 | `ChannelManagementPort` + `DiscordChannelManager` | Create + archive channels |
| B1-007 | `DiscordTextAdapter` | Inbound Discord messages → `TextConversationPort` |
| B1-008 | `AiSdkAdapter` | Vercel AI SDK with provider-agnostic model support |
| B1-009 | `N8nMcpClient` | Per-request n8n-mcp stdio subprocess via MCP client |
| B1-010 | `ModelFactory` | Builds `LanguageModel` from AI_PROVIDER/AI_MODEL/AI_API_KEY |
| B1-011 | `orchestrator-tools.ts` | Real tool calls: list_projects, create_project, update_project_status |
| B1-012 | `project-tools.ts` | Real tool call: save_doc |
| B1-013 | N8N skills prompt | 7 SKILL.md files inlined at agent startup |
| B1-014 | `ProjectAgent` | N8N expert per channel with save_doc tool |
| B1-015 | `OrchestratorAgent` | Project management with real tool calls |
| B1-016 | `MessageRouter` | Routes Discord messages to correct agent |
| B1-017 | Quality gates | check:deps, check:cycles, typecheck, lint all pass |
| B1-018 | README | Setup guide + architecture overview |

---

## Phase 2 Candidates

- Integration tests (PostgreSQL via testcontainers, MCP adapter mocks)
- `check:file-size` custom limit per directory
- Structured telemetry via OTEL (replace `ConsoleTelemetryAdapter`)
- ClickHouse ingestion for conversation analytics
- Web dashboard for project health
- Auto-reconnect on Discord disconnect
- Rate limiting per channel
- Multi-guild support
