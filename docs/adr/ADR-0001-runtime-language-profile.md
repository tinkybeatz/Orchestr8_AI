# ADR-0001: Runtime Language Profile

**Status:** Accepted
**Date:** 2026-03-06

## Context

Orchestr8_AI is a new standalone project managing multiple n8n instances via Discord. We need to choose a runtime language and module system.

## Decision

TypeScript with ESM (`"type": "module"`), Node.js ≥ 20, compiled with `tsc`.

## Rationale

- Matches Joe's proven architecture — same toolchain, same CI pipeline
- TypeScript provides type safety for the hexagonal port interfaces
- ESM is the modern Node.js standard; avoids CommonJS interop issues with discord.js v14
- Node.js 20 LTS provides stable `crypto` built-in (used for AES-256-GCM key encryption)

## Consequences

- All imports use `.js` extensions (TypeScript → ESM resolution)
- `tsx` used for dev scripts and local execution
- `tsconfig.build.json` for production builds
