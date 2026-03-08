import type { VersionedPayload } from '../versioning.js';
import { wrapPayload, validateVersion } from '../versioning.js';

export interface OutboxEventV1 {
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly aggregateId?: string;
}

export const OUTBOX_EVENT_TYPE = 'outbox.event';
export const OUTBOX_EVENT_VERSION = 1;

export function wrapOutboxEvent(data: OutboxEventV1): VersionedPayload<OutboxEventV1> {
  return wrapPayload(OUTBOX_EVENT_TYPE, OUTBOX_EVENT_VERSION, data);
}

export function validateOutboxEvent(payload: VersionedPayload<OutboxEventV1>): void {
  validateVersion(payload, OUTBOX_EVENT_TYPE, OUTBOX_EVENT_VERSION);
}
