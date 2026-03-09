/**
 * Starts local infrastructure via docker compose and waits for health.
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import net from 'node:net';

const ROOT = resolve(import.meta.dirname, '..');

console.info('[infra-up] Starting Docker services...');
execSync('docker compose up -d', { cwd: ROOT, stdio: 'inherit' });

console.info('[infra-up] Waiting for services to become healthy...');

const MAX_WAIT_MS = 120_000;
const POLL_MS = 2_000;

type CheckFn = () => Promise<boolean>;

interface ServiceCheck {
  name: string;
  check: CheckFn;
}

function dockerHealthy(container: string): boolean {
  try {
    const result = execSync(
      `docker inspect --format='{{.State.Health.Status}}' ${container}`,
      { encoding: 'utf-8' },
    ).trim();
    return result === 'healthy';
  } catch {
    return false;
  }
}

function tcpReady(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

const services: ServiceCheck[] = [
  { name: 'PostgreSQL', check: () => Promise.resolve(dockerHealthy('orchestr8ai-postgres')) },
  { name: 'NATS', check: () => Promise.resolve(dockerHealthy('orchestr8ai-nats')) },
  { name: 'ClickHouse', check: () => Promise.resolve(dockerHealthy('orchestr8ai-clickhouse')) },
  // OTel has healthcheck disabled (scratch image) — use TCP probe on health port
  { name: 'OTel Collector', check: () => tcpReady('localhost', 13133) },
];

async function waitForHealth(): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    const results: boolean[] = [];

    for (const svc of services) {
      results.push(await svc.check());
    }

    if (results.every(Boolean)) {
      console.info('[infra-up] All services healthy.');
      return;
    }

    const failing = services.filter((_, i) => !results[i]).map((s) => s.name);
    console.info(`[infra-up] Waiting... (not ready: ${failing.join(', ')})`);

    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  throw new Error(`Services did not become healthy within ${MAX_WAIT_MS / 1000}s`);
}

await waitForHealth();
