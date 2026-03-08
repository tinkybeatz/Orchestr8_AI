/**
 * Probes all 4 infrastructure services and reports status.
 */
import { execSync } from 'node:child_process';
import net from 'node:net';

interface Probe {
  name: string;
  check: () => Promise<boolean>;
}

function tcpCheck(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
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

const probes: Probe[] = [
  {
    name: 'PostgreSQL',
    check: async () => dockerHealthy('joe-postgres') && await tcpCheck('localhost', 5432),
  },
  {
    name: 'NATS',
    check: async () => dockerHealthy('joe-nats') && await tcpCheck('localhost', 4222),
  },
  {
    name: 'ClickHouse',
    check: async () => dockerHealthy('joe-clickhouse') && await tcpCheck('localhost', 8123),
  },
  {
    name: 'OTel Collector',
    check: async () => await tcpCheck('localhost', 13133) && await tcpCheck('localhost', 4317),
  },
];

let allOk = true;

for (const probe of probes) {
  const ok = await probe.check();
  const status = ok ? 'OK' : 'FAIL';
  console.info(`  ${probe.name}: ${status}`);
  if (!ok) allOk = false;
}

if (!allOk) {
  console.error('\nSome services are not healthy.');
  process.exit(1);
} else {
  console.info('\nAll infrastructure services healthy.');
}
