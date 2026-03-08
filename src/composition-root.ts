import type { StateStorePort } from './application/ports/outbound/state-store.port.js';
import type { EventBusPort } from './application/ports/outbound/event-bus.port.js';
import type { TelemetryPort } from './application/ports/outbound/telemetry.port.js';
import type { EnvConfig } from './infrastructure/config/env-config.js';
import type { PgPool } from './infrastructure/db/pool.js';

export interface AppDependencies {
  stateStore: StateStorePort;
  eventBus: EventBusPort;
  telemetry: TelemetryPort;
  config: EnvConfig;
  pool: PgPool;
}

let deps: AppDependencies | null = null;

export function composeDependencies(d: AppDependencies): void {
  deps = d;
}

export function resolve(): AppDependencies {
  if (!deps) {
    throw new Error('[Orchestr8_AI] Dependencies not composed. Call composeDependencies() first.');
  }
  return deps;
}
