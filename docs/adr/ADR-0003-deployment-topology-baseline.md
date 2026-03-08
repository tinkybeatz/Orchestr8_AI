# ADR-0003: Deployment Topology Baseline

**Status:** Accepted
**Date:** 2026-03-06

## Context

Orchestr8_AI needs a backing infrastructure for operational state, eventing, analytics, and observability.

## Decision

Docker Compose stack (identical topology to Joe, renamed for Orchestr8_AI):

| Container | Image | Purpose |
|-----------|-------|---------|
| `orchestr8ai-postgres` | postgres:17-alpine | Project registry, conversation context, operational state |
| `orchestr8ai-nats` | nats:latest | JetStream event bus (project lifecycle events) |
| `orchestr8ai-clickhouse` | clickhouse/clickhouse-server | Analytics ingestion (future) |
| `orchestr8ai-otel` | otel/opentelemetry-collector | Telemetry aggregation (future) |

## Rationale

- Full infrastructure from day one avoids painful migrations later
- NATS JetStream enables durable event streams for project lifecycle auditing
- ClickHouse + OTEL are wired but not actively used yet — ready for Phase 2 analytics
- Reusing Joe's docker-compose topology reduces maintenance burden

## Consequences

- Docker must be available in the dev environment
- `npm run infra:up` must be run before `npm run dev`
- Production deployment would extract each service to managed infrastructure (RDS, Confluent/NATS Cloud, etc.)
