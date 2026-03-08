# ── Builder ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Compiled application
COPY --from=builder /app/dist ./dist

# SQL migration files are not emitted by tsc — copy alongside compiled output.
# main.ts resolves: import.meta.dirname + 'infrastructure/db/migrations'
# With rootDir=src, import.meta.dirname in dist/ = /app/dist → path: /app/dist/infrastructure/db/migrations
COPY --from=builder /app/src/infrastructure/db/migrations ./dist/infrastructure/db/migrations

# Static docs read by agents at runtime via filesystem
COPY --from=builder /app/docs ./docs

# Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

CMD ["node", "dist/main.js"]
