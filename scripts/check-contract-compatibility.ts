/**
 * Contract compatibility checker: validates that all v1 contracts
 * can serialize/deserialize correctly and maintain backward compatibility.
 */
import {
  wrapRunCheckpoint,
  validateRunCheckpoint,
  wrapOutboxEvent,
  validateOutboxEvent,
  wrapDomainEventEnvelope,
  validateDomainEventEnvelope,
} from '../src/contracts/v1/index.js';

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.info(`  PASS: ${name}`);
  } catch (err) {
    console.error(`  FAIL: ${name} — ${err instanceof Error ? err.message : String(err)}`);
    failures++;
  }
}

console.info('Contract compatibility checks:');

check('RunCheckpoint v1 round-trip', () => {
  const wrapped = wrapRunCheckpoint({ runId: 'abc', stepIndex: 1, state: { x: 1 } });
  const json = JSON.stringify(wrapped);
  const parsed = JSON.parse(json) as typeof wrapped;
  validateRunCheckpoint(parsed);
  if (parsed.data.runId !== 'abc') throw new Error('runId mismatch');
});

check('OutboxEvent v1 round-trip', () => {
  const wrapped = wrapOutboxEvent({
    eventType: 'test.event',
    payload: { key: 'val' },
    correlationId: 'corr-1',
  });
  const json = JSON.stringify(wrapped);
  const parsed = JSON.parse(json) as typeof wrapped;
  validateOutboxEvent(parsed);
  if (parsed.data.eventType !== 'test.event') throw new Error('eventType mismatch');
});

check('DomainEventEnvelope v1 round-trip', () => {
  const wrapped = wrapDomainEventEnvelope({
    eventId: 'evt-1',
    eventType: 'test.event',
    occurredAt: new Date().toISOString(),
    correlationId: 'corr-1',
    aggregateId: 'agg-1',
    payload: { data: true },
  });
  const json = JSON.stringify(wrapped);
  const parsed = JSON.parse(json) as typeof wrapped;
  validateDomainEventEnvelope(parsed);
  if (parsed.data.eventId !== 'evt-1') throw new Error('eventId mismatch');
});

if (failures > 0) {
  console.error(`\n${failures} contract check(s) failed.`);
  process.exit(1);
} else {
  console.info('\nAll contract compatibility checks passed.');
}
