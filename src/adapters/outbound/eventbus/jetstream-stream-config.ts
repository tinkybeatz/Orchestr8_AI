import type { StreamConfig } from 'nats';

/**
 * ORCHESTRATION stream — core Orchestr8_AI events.
 * Subject pattern: orchestr8ai.discord.> (must not overlap with orchestr8ai.dlq.> in DEAD_LETTER)
 * 7d retention, 512MB limit, 2min dedup window.
 */
export function orchestrationStreamConfig(): Partial<StreamConfig> {
  return {
    name: 'ORCHESTRATION',
    subjects: ['orchestr8ai.discord.>'],
    retention: 'limits' as unknown as StreamConfig['retention'],
    storage: 'file' as unknown as StreamConfig['storage'],
    max_age: 7 * 24 * 60 * 60 * 1_000_000_000, // 7 days in nanoseconds
    max_bytes: 512 * 1024 * 1024, // 512MB
    discard: 'old' as unknown as StreamConfig['discard'],
    duplicate_window: 2 * 60 * 1_000_000_000, // 2 minutes in nanoseconds
    num_replicas: 1,
  };
}

/**
 * DEAD_LETTER stream — failed messages after max retries.
 * Subject pattern: orchestr8ai.dlq.>
 * 30d retention, 256MB limit.
 */
export function deadLetterStreamConfig(): Partial<StreamConfig> {
  return {
    name: 'DEAD_LETTER',
    subjects: ['orchestr8ai.dlq.>'],
    retention: 'limits' as unknown as StreamConfig['retention'],
    storage: 'file' as unknown as StreamConfig['storage'],
    max_age: 30 * 24 * 60 * 60 * 1_000_000_000, // 30 days
    max_bytes: 256 * 1024 * 1024, // 256MB
    discard: 'old' as unknown as StreamConfig['discard'],
    num_replicas: 1,
  };
}
